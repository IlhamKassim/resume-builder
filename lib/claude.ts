import Anthropic from "@anthropic-ai/sdk";
import { ResumeDataSchema, CoverLetterDataSchema } from "@/lib/types";
import type { ProfileData, ResumeData, CoverLetterData } from "@/lib/types";
import type { ZodType } from "zod";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 55_000,
});

const RESUME_SYSTEM_PROMPT = `You are a professional resume writer. Your task is to tailor a resume to a specific job description.

CRITICAL RULES — you must follow these without exception:
1. Only use information explicitly present in the provided profile data. Never invent, embellish, or infer any experience, skills, achievements, or responsibilities not present in the profile.
1b. LOCATION FIELDS ARE VERBATIM: Copy every location field (contact.location and each experience entry's location) exactly as it appears in the profile data. Never infer, guess, or substitute a more specific city, region, or country than what is explicitly given (e.g. if the profile says "Malaysia (Remote)", output "Malaysia (Remote)" — do not guess a city like "Kuala Lumpur"). If a location is absent from the profile, omit it — do not fill it in.
2. You may rephrase and reorder existing information to highlight relevance, but every fact must trace back to the source profile.
3. Return ONLY a valid JSON object matching the schema below — no markdown, no explanation, no code fences.
4. The entire resume MUST fit on ONE PAGE. Select exactly 3 experience entries and exactly 2 projects. Include exactly 2–3 bullets per experience entry and exactly 2 bullets per project. Show only the 2 most recent education entries. Keep the summary to 2 sentences and under 50 words total. Include up to 4 certifications most relevant to the role — omit the certifications field entirely if none are relevant.
5. If the job description is sparse (under 150 words), infer the role's core requirements from the job title, company context, and any listed responsibilities, then select experience entries accordingly.

RELEVANCE CRITERIA: When selecting experience entries, projects, and certifications, prioritize by: (1) skill and keyword overlap with the job description requirements, (2) domain and industry alignment, (3) demonstrated impact. Actively deprioritize non-technical or non-professional experience (e.g. agricultural lab work, short training courses) when any technical or leadership alternative is available. Prefer entries where the most requirements from the job description are naturally addressed.

ATS OPTIMIZATION: Mirror exact keywords and terminology from the job description throughout the summary and experience bullets — not just the skills section. If the job posting uses specific phrases (e.g. "cross-functional collaboration", "agile environment", "machine learning pipelines"), incorporate them where they fit naturally and are supported by the profile.

BULLET FORMAT: Every bullet point must start with a strong action verb (e.g. "Engineered", "Designed", "Led", "Reduced", "Built") and be under 20 words. Where possible, include a quantified outcome (numbers, percentages, scale, or time). Avoid filler phrases like "responsible for" or "helped with".

SUMMARY FORMAT: First sentence — your single strongest qualification for this specific role. Second sentence — the most relevant concrete experience or project that proves it. Total under 50 words.

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
      "endDate": "string",
      "description": "string (optional — include only for notable achievements such as scholarships or honours)"
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
  ],
  "certifications": ["string (certification name and issuer, e.g. 'Artificial Intelligence Foundations: Machine Learning (LinkedIn Learning)') — omit field if none are relevant"]
}`;

const COVER_LETTER_SYSTEM_PROMPT = `You are a professional cover letter writer. Your task is to write a concise, tailored cover letter for a specific job description, based only on the candidate's profile data.

CRITICAL RULES — you must follow these without exception:
1. Only use information explicitly present in the provided profile data. Never invent, embellish, or infer any experience, skills, achievements, or responsibilities not present in the profile.
2. LOCATION FIELDS ARE VERBATIM: never reference a specific city/region/company location beyond what's explicitly in the profile data.
3. Return ONLY a valid JSON object matching the schema below — no markdown, no explanation, no code fences.
4. Keep it to 2–3 body paragraphs, under 300 words total (excluding greeting/sign-off). Professional, confident tone — avoid clichés like "I am writing to express my interest."
5. Paragraph 1: why this role/company specifically, tied to one real, concrete qualification from the profile. Paragraph 2 (and optional paragraph 3): concrete evidence from experience or projects that prove fit. Mirror key terminology from the job description only where genuinely supported by the profile.
6. Greeting should be "Dear Hiring Manager," unless a specific name or team is given in the job description.
7. Sign-off should be just "Sincerely," — the candidate's name is rendered separately, do not include it.

OUTPUT SCHEMA:
{
  "greeting": "string",
  "paragraphs": ["string", "string"],
  "signOff": "string"
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
  /** Tokens written to the prompt cache this call (profile + system prompt), billed at 1.25x input price. */
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

async function callClaudeForJson<T>(opts: {
  action: string;
  system: string;
  /** Large, identical across every call for this action (system context, profile data) — cached. */
  cacheableContext: string;
  /** Changes every call (the job description) — never cached. */
  variableInput: string;
  maxTokens: number;
  schema: ZodType<T>;
}): Promise<{ data: T; usage: TokenUsage }> {
  const { action, system, cacheableContext, variableInput, maxTokens, schema } = opts;

  let response: Anthropic.Message;
  try {
    response = await callWithRetry(() =>
      client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: cacheableContext, cache_control: { type: "ephemeral" } },
              { type: "text", text: variableInput },
            ],
          },
        ],
      })
    );
  } catch (err) {
    mapClaudeCallError(err, action);
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new TailoringError(`${action} failed — no text response from AI. Please try again.`);
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
      `${action} failed — AI returned an unexpected format. Please try again.`
    );
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new TailoringError(
      `${action} failed — AI output didn't match expected structure. Please try again.`
    );
  }

  return {
    data: validated.data,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    },
  };
}

export async function tailorResume(
  profile: ProfileData,
  jobDescription: string
): Promise<{ resume: ResumeData; usage: TokenUsage }> {
  const cacheableContext = `PROFILE DATA:\n${JSON.stringify(profile, null, 2)}`;
  const variableInput = `JOB DESCRIPTION:
${jobDescription}

Tailor the resume to this job description. Remember: only use facts from the profile data above.`;

  const { data, usage } = await callClaudeForJson({
    action: "Resume generation",
    system: RESUME_SYSTEM_PROMPT,
    cacheableContext,
    variableInput,
    maxTokens: 4096,
    schema: ResumeDataSchema,
  });

  return { resume: data, usage };
}

export async function generateCoverLetter(
  profile: ProfileData,
  jobDescription: string
): Promise<{ coverLetter: CoverLetterData; usage: TokenUsage }> {
  const cacheableContext = `PROFILE DATA:\n${JSON.stringify(profile, null, 2)}`;
  const variableInput = `JOB DESCRIPTION:
${jobDescription}

Write a tailored cover letter for this job description. Remember: only use facts from the profile data above.`;

  const { data, usage } = await callClaudeForJson({
    action: "Cover letter generation",
    system: COVER_LETTER_SYSTEM_PROMPT,
    cacheableContext,
    variableInput,
    maxTokens: 1024,
    schema: CoverLetterDataSchema,
  });

  return { coverLetter: data, usage };
}
