import Anthropic from "@anthropic-ai/sdk";
import { ResumeDataSchema } from "@/lib/types";
import type { ProfileData, ResumeData } from "@/lib/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 55_000,
});

const SYSTEM_PROMPT = `You are a professional resume writer. Your task is to tailor a resume to a specific job description.

CRITICAL RULES — you must follow these without exception:
1. Only use information explicitly present in the provided profile data. Never invent, embellish, or infer any experience, skills, achievements, or responsibilities not present in the profile.
2. You may rephrase and reorder existing information to highlight relevance, but every fact must trace back to the source profile.
3. Return ONLY a valid JSON object matching the schema below — no markdown, no explanation, no code fences.
4. The entire resume MUST fit on ONE PAGE. Select only the 3 most relevant experience entries and 2 most relevant projects. Include exactly 2–3 bullets per experience entry and 2 bullets per project. Show only the 2 most recent education entries. Keep the summary to 2 sentences maximum.

BULLET FORMAT: Every bullet point (in both experience and projects) must follow the pattern "Label: description" where the label is a 2–4 word thematic category in title case (e.g. "AI & Business Intelligence:", "Technical Operations:"), followed by a colon and space, then a concise one-line description starting with a strong action verb. Avoid filler phrases like "responsible for" or "helped with".

SKILLS FORMAT: Group skills into 3–5 meaningful categories (e.g. Languages, Frameworks, Systems, AI & ML, Tools). Only include skills relevant to this specific job description. Mirror exact terminology from the job posting where applicable.

OUTPUT SCHEMA:
{
  "contact": {
    "name": "string (required)",
    "email": "string (optional)",
    "phone": "string (optional)",
    "location": "string (optional)",
    "linkedin": "string (optional)",
    "github": "string (optional)",
    "website": "string (optional)"
  },
  "summary": "string (2 sentences max, tailored to the role, required)",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string",
      "endDate": "string | null (null means current role)",
      "location": "string (optional)",
      "bullets": ["string — exactly 2–3 bullets, each formatted as 'Label: description'"]
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string"
    }
  ],
  "skills": [
    {
      "category": "string (e.g. 'Languages', 'Frameworks', 'AI & ML', 'Tools')",
      "items": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "role": "string (your capacity, e.g. 'Lead Developer') (optional)",
      "bullets": ["string — exactly 2 bullets, each formatted as 'Label: description'"],
      "url": "string (optional)",
      "technologies": ["string (optional)"]
    }
  ]
}`;

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
}

export async function tailorResume(
  profile: ProfileData,
  jobDescription: string
): Promise<{ resume: ResumeData; usage: TokenUsage }> {
  const userMessage = `PROFILE DATA:
${JSON.stringify(profile, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Tailor the resume to this job description. Remember: only use facts from the profile data above.`;

  let response: Anthropic.Message;
  try {
    response = await callWithRetry(() =>
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      })
    );
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new TailoringError(
        "Resume generation failed — API rate limit reached. Please try again in a moment."
      );
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      throw new TailoringError(
        "Resume generation failed — request timed out. Please try again."
      );
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new TailoringError(
        "Resume generation failed — could not reach the AI service. Please check your connection and try again."
      );
    }
    throw err;
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new TailoringError(
      "Resume generation failed — no text response from AI. Please try again."
    );
  }

  let parsed: unknown;
  try {
    // Strip markdown code fences if Claude includes them despite instructions
    const cleaned = textBlock.text
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new TailoringError(
      "Resume generation failed — AI returned an unexpected format. Please try again."
    );
  }

  const validated = ResumeDataSchema.safeParse(parsed);
  if (!validated.success) {
    throw new TailoringError(
      "Resume generation failed — AI output didn't match expected structure. Please try again."
    );
  }

  return {
    resume: validated.data,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
