import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";
import { logUsage } from "@/lib/usage-log";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 55_000,
});

export class TailoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TailoringError";
  }
}

function isRetryable(err: unknown): boolean {
  return (
    err instanceof Anthropic.RateLimitError ||
    err instanceof Anthropic.APIConnectionError ||
    err instanceof Anthropic.InternalServerError
  );
}

async function callWithRetry(
  fn: () => Promise<Anthropic.Message>,
  maxRetries = 2
): Promise<Anthropic.Message> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isRetryable(err) && attempt < maxRetries) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  /** Tokens written to the prompt cache this call (core rules + profile), billed at 1.25x input price. */
  cacheCreationTokens: number;
  /** Tokens read from the prompt cache this call, billed at 0.1x input price. */
  cacheReadTokens: number;
}

function mapClaudeCallError(err: unknown, action: string): never {
  if (err instanceof Anthropic.RateLimitError) {
    throw new TailoringError(
      `${action} failed — API rate limit reached. Please try again in a moment.`
    );
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    throw new TailoringError(`${action} failed — request timed out. Please try again.`);
  }
  if (err instanceof Anthropic.APIConnectionError) {
    throw new TailoringError(
      `${action} failed — could not reach the AI service. Please check your connection and try again.`
    );
  }
  throw err;
}

/** Pulls the JSON object out of a model response even when surrounding prose is present. Despite
 * "return ONLY JSON, no explanation" in the system prompt, Claude sometimes wraps the object in
 * commentary anyway — observed consistently when the job description is a poor fit for the
 * candidate's profile (e.g. a sales role against a software-engineering profile), where the model
 * feels compelled to caveat the mismatch before/after the JSON rather than silently comply. A
 * naive strip-fences-at-the-string-boundary approach breaks on that prose, so this scans for the
 * first `{` and walks forward counting brace depth (ignoring braces inside string literals) to
 * find its matching close — which is correct regardless of what surrounds it. */
function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) return text.trim();

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start).trim();
}

/** One attempt at getting well-formed, schema-valid JSON out of Claude. Network/rate-limit
 * errors are already retried inside callWithRetry and propagate out (via mapClaudeCallError)
 * rather than being returned here — only "we got a response but it wasn't usable" is a soft
 * failure, since that's the category worth retrying with a fresh generation.
 *
 * Logs usage here, not in the caller: every attempt burns real tokens regardless of whether it
 * ends up usable, and only this retry state machine knows how many attempts actually ran. */
async function attemptClaudeForJson<T>(opts: {
  action: string;
  logAction: "resume" | "cover-letter" | "interview-prep";
  systemPrompt: string;
  taskInstructions: string;
  cacheableContext: string;
  variableInput: string;
  maxTokens: number;
  schema: ZodType<T>;
}): Promise<{ data: T; usage: TokenUsage } | { softFailure: string; usage: TokenUsage }> {
  const { action, logAction, systemPrompt, taskInstructions, cacheableContext, variableInput, maxTokens, schema } =
    opts;

  let response: Anthropic.Message;
  try {
    response = await callWithRetry(() =>
      client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: maxTokens,
        // NOTE: research on LLM summarization (generalization bias in scientific-abstract
        // summaries, Royal Society Open Science 2026) found a 76% reduction in overgeneralization
        // at temperature 0 vs. default sampling. Tried setting `temperature: 0` here, but the API
        // rejects it outright for this model: "400 temperature is deprecated for this model" —
        // confirmed live, every real generation failed until this was reverted. Left unset;
        // revisit only if a future model/SDK version restores support for this parameter.
        thinking: { type: "disabled" },
        output_config: { effort: "high" },
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: cacheableContext, cache_control: { type: "ephemeral" } },
              { type: "text", text: `${taskInstructions}\n\n${variableInput}` },
            ],
          },
        ],
      })
    );
  } catch (err) {
    mapClaudeCallError(err, action);
  }

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
  };
  // Every attempt burns real tokens regardless of whether it ends up usable, so it must be
  // logged for the balance estimator even when we go on to retry or fail.
  await logUsage(logAction, usage);

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { softFailure: "no text response from AI", usage };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(textBlock.text));
  } catch {
    return { softFailure: "AI returned an unexpected format", usage };
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    // Previously silent: a validation failure gave zero diagnostic info anywhere, making every
    // schema mismatch a black box. Log the actual Zod issues server-side so a real failure (as
    // opposed to a flaky retry) is debuggable instead of just "try again" forever.
    console.error(`${action} — schema validation failed:`, JSON.stringify(validated.error.issues, null, 2));
    return { softFailure: "AI output didn't match expected structure", usage };
  }

  return { data: validated.data, usage };
}

/** Soft failures (bad JSON, schema mismatch) are retried once with a fresh generation before
 * surfacing an error to the user — these are non-deterministic model slips, not systemic
 * problems, and a second attempt usually passes. Network/API errors are not retried here; they
 * already have their own retry inside callWithRetry and propagate out immediately.
 *
 * Generic across both tasks: the caller supplies its own systemPrompt, task instructions, and
 * schema, so this is the one place the "call Claude, validate the JSON, retry once" state
 * machine lives — no prompt content or task-specific knowledge belongs in this file. */
export async function callClaudeForJson<T>(opts: {
  action: string;
  /** Logged to the persistent usage log, distinct from the human-readable `action` message. */
  logAction: "resume" | "cover-letter" | "interview-prep";
  /** The cached system block — must be byte-identical across callers that want to share one
   * prompt-cache entry (see docs/adr/0001-shared-core-prompt-for-cross-task-caching.md). */
  systemPrompt: string;
  /** Resume- or cover-letter-specific rules + schema. Deliberately NOT cached (it's small and
   * always accompanies the equally-uncached job description, so caching it buys nothing). */
  taskInstructions: string;
  /** Large, identical across every call regardless of task — cached. */
  cacheableContext: string;
  /** Changes every call (the job description) — never cached. */
  variableInput: string;
  maxTokens: number;
  schema: ZodType<T>;
}): Promise<{ data: T; usage: TokenUsage }> {
  const maxSoftRetries = 1;

  for (let attempt = 0; ; attempt++) {
    const result = await attemptClaudeForJson(opts);
    if ("data" in result) return result;

    if (attempt < maxSoftRetries) {
      console.error(`${opts.action} — soft failure (${result.softFailure}), retrying once`);
      continue;
    }

    throw new TailoringError(`${opts.action} failed — ${result.softFailure}. Please try again.`);
  }
}
