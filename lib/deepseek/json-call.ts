import type { ZodType } from "zod";
import { TailoringError } from "@/lib/claude/json-call";
import { logUsage } from "@/lib/usage-log";
import type { TokenUsage } from "@/lib/claude";

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function callWithRetry(fn: () => Promise<Response>, maxRetries = 2): Promise<Response> {
  let lastRes: Response | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fn();
    if (res.ok || !isRetryableStatus(res.status) || attempt === maxRetries) return res;
    lastRes = res;
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  return lastRes!;
}

/** Same brace-counting JSON extraction as lib/claude/json-call.ts's extractJsonObject — kept as
 * its own small copy rather than a cross-provider import, since it's ~15 lines of provider-
 * agnostic text parsing, not Claude-specific logic. */
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

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
  };
}

async function attemptDeepSeekForJson<T>(opts: {
  action: string;
  logAction: "resume";
  systemPrompt: string;
  taskInstructions: string;
  cacheableContext: string;
  variableInput: string;
  maxTokens: number;
  schema: ZodType<T>;
}): Promise<{ data: T; usage: TokenUsage } | { softFailure: string; usage: TokenUsage }> {
  const { action, logAction, systemPrompt, taskInstructions, cacheableContext, variableInput, maxTokens, schema } =
    opts;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new TailoringError(
      `${action} failed — DEEPSEEK_API_KEY is not set. Add it to .env.local (get one at platform.deepseek.com).`
    );
  }

  const userPrompt = `${cacheableContext}\n\n${taskInstructions}\n\n${variableInput}`;

  let res: Response;
  try {
    res = await callWithRetry(() =>
      fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          max_tokens: maxTokens,
          // v4 models default to thinking mode ON — the same truncation trap documented in
          // docs/adr/0002-migrate-to-sonnet-5-despite-post-intro-price-increase.md for Claude:
          // thinking output eats the token budget meant for the JSON body. Must be explicit.
          thinking: { type: "disabled" },
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      })
    );
  } catch {
    throw new TailoringError(
      `${action} failed — could not reach the DeepSeek API. Please check your connection and try again.`
    );
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new TailoringError(`${action} failed — DeepSeek API rate limit reached. Please try again in a moment.`);
    }
    if (res.status === 401) {
      throw new TailoringError(`${action} failed — DeepSeek API key was rejected. Check DEEPSEEK_API_KEY.`);
    }
    throw new TailoringError(`${action} failed — DeepSeek API error ${res.status}: ${bodyText || "unknown error"}`);
  }

  const body = (await res.json()) as DeepSeekResponse;

  const rawUsage = body.usage;
  const usage: TokenUsage = {
    inputTokens: rawUsage?.prompt_cache_miss_tokens ?? rawUsage?.prompt_tokens ?? 0,
    outputTokens: rawUsage?.completion_tokens ?? 0,
    // DeepSeek doesn't bill a separate cache-write premium — a cache miss is just billed at the
    // normal input rate, so there's nothing to attribute to "creation" the way Claude does.
    cacheCreationTokens: 0,
    cacheReadTokens: rawUsage?.prompt_cache_hit_tokens ?? 0,
  };
  // Every attempt burns real tokens regardless of whether it ends up usable, same reasoning as
  // the Claude path — see lib/claude/json-call.ts's attemptClaudeForJson.
  await logUsage(logAction, usage, "deepseek");

  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    return { softFailure: "no text response from AI", usage };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(content));
  } catch {
    return { softFailure: "AI returned an unexpected format", usage };
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    console.error(`${action} — schema validation failed:`, JSON.stringify(validated.error.issues, null, 2));
    return { softFailure: "AI output didn't match expected structure", usage };
  }

  return { data: validated.data, usage };
}

/** Mirrors lib/claude/json-call.ts's callClaudeForJson: one soft-failure retry (bad JSON, schema
 * mismatch) before surfacing an error, since those are non-deterministic model slips rather than
 * systemic problems. */
export async function callDeepSeekForJson<T>(opts: {
  action: string;
  logAction: "resume";
  systemPrompt: string;
  taskInstructions: string;
  cacheableContext: string;
  variableInput: string;
  maxTokens: number;
  schema: ZodType<T>;
}): Promise<{ data: T; usage: TokenUsage }> {
  const maxSoftRetries = 1;

  for (let attempt = 0; ; attempt++) {
    const result = await attemptDeepSeekForJson(opts);
    if ("data" in result) return result;

    if (attempt < maxSoftRetries) {
      console.error(`${opts.action} — soft failure (${result.softFailure}), retrying once`);
      continue;
    }

    throw new TailoringError(`${opts.action} failed — ${result.softFailure}. Please try again.`);
  }
}
