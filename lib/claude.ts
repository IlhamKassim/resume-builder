import Anthropic from "@anthropic-ai/sdk";
import { ResumeDataSchema } from "@/lib/types";
import type { ProfileData, ResumeData } from "@/lib/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a professional resume writer. Your task is to tailor a resume to a specific job description.

CRITICAL RULES — you must follow these without exception:
1. Only use information explicitly present in the provided profile data. Never invent, embellish, or infer any experience, skills, achievements, or responsibilities not present in the profile.
2. You may rephrase and reorder existing information to highlight relevance, but every fact must trace back to the source profile.
3. Return ONLY a valid JSON object matching the schema below — no markdown, no explanation, no code fences.

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
  "summary": "string (2-3 sentences, tailored to the role, required)",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string",
      "endDate": "string | null (null means current role)",
      "location": "string (optional)",
      "bullets": ["string (action-verb led, quantified where data exists)"]
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
  "skills": ["string (only skills relevant to this job description)"],
  "projects": [
    {
      "name": "string",
      "description": "string",
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

export async function tailorResume(
  profile: ProfileData,
  jobDescription: string
): Promise<ResumeData> {
  const userMessage = `PROFILE DATA:
${JSON.stringify(profile, null, 2)}

JOB DESCRIPTION:
${jobDescription}

Tailor the resume to this job description. Remember: only use facts from the profile data above.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

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

  return validated.data;
}
