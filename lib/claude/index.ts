import { z } from "zod";
import { ResumeDataSchema, CoverLetterDataSchema, InterviewPrepDataSchema } from "@/lib/types";
import type { ProfileData, ResumeData, CoverLetterData, InterviewPrepData } from "@/lib/types";
import { checkResumeFidelity, type FidelityViolation } from "@/lib/fidelity-check";
import { CountryListingsSchema, type CountryListings } from "@/lib/job-listings";
import {
  CORE_RULES,
  RESUME_TASK_INSTRUCTIONS,
  COVER_LETTER_TASK_INSTRUCTIONS,
  INTERVIEW_PREP_TASK_INSTRUCTIONS,
  JOB_DOSSIER_SYSTEM_PROMPT,
} from "./prompts";
import {
  callClaudeForJson,
  callClaudeWithWebSearchForJson,
  TailoringError,
  type TokenUsage,
} from "./json-call";

export { TailoringError };
export type { TokenUsage };

export async function tailorResume(
  profile: ProfileData,
  jobDescription: string
): Promise<{ resume: ResumeData; usage: TokenUsage; fidelityWarnings: FidelityViolation[] }> {
  const cacheableContext = `PROFILE DATA:\n${JSON.stringify(profile, null, 2)}`;
  const variableInput = `JOB DESCRIPTION:
${jobDescription}

Tailor the resume to this job description. Remember: only use facts from the profile data above.`;

  const { data, usage } = await callClaudeForJson({
    action: "Resume generation",
    logAction: "resume",
    systemPrompt: CORE_RULES,
    taskInstructions: RESUME_TASK_INSTRUCTIONS,
    cacheableContext,
    variableInput,
    maxTokens: 4096,
    schema: ResumeDataSchema,
  });

  // Cheap, deterministic fidelity pass against the already-generated data (no extra API call) —
  // the "content validation gate" stage of a layered hallucination-mitigation architecture,
  // run automatically on every real generation rather than only via the manual npm script.
  const fidelityWarnings = checkResumeFidelity(profile, data);

  return { resume: data, usage, fidelityWarnings };
}

export async function generateCoverLetter(
  profile: ProfileData,
  jobDescription: string,
  resume?: ResumeData
): Promise<{ coverLetter: CoverLetterData; usage: TokenUsage }> {
  const cacheableContext = `PROFILE DATA:\n${JSON.stringify(profile, null, 2)}`;
  // Without this, the model has no way to know what the actual tailored resume contains (it only
  // sees the full profile) and rule 2's "never repeat resume bullets" becomes unenforceable —
  // it can only guess. Passing the real selection closes that gap.
  const resumeContentNote = resume
    ? `\n\nCONTENT ALREADY SHOWN ON THIS CANDIDATE'S RESUME FOR THIS APPLICATION (do not repeat these facts, bullets, or the same supporting evidence — pick different profile facts to support the letter instead):
Experience entries shown: ${resume.experience.map((e) => `${e.title} at ${e.company}`).join("; ")}
Projects shown: ${resume.projects.map((p) => p.name).join(", ")}`
    : "";
  const variableInput = `JOB DESCRIPTION:
${jobDescription}${resumeContentNote}

Write a tailored cover letter for this job description. Remember: only use facts from the profile data above.`;

  const { data, usage } = await callClaudeForJson({
    action: "Cover letter generation",
    logAction: "cover-letter",
    systemPrompt: CORE_RULES,
    taskInstructions: COVER_LETTER_TASK_INSTRUCTIONS,
    cacheableContext,
    variableInput,
    maxTokens: 1024,
    schema: CoverLetterDataSchema,
  });

  return { coverLetter: data, usage };
}

export async function generateInterviewQuestions(
  profile: ProfileData,
  jobDescription: string,
  resume?: ResumeData
): Promise<{ interviewPrep: InterviewPrepData; usage: TokenUsage }> {
  const cacheableContext = `PROFILE DATA:\n${JSON.stringify(profile, null, 2)}`;
  // Same reasoning as generateCoverLetter: without this the model has no way to know what the
  // actual tailored resume contains, so behavioral-question hints can't steer the candidate
  // toward experiences the resume didn't already cover.
  const resumeContentNote = resume
    ? `\n\nCONTENT ALREADY SHOWN ON THIS CANDIDATE'S RESUME FOR THIS APPLICATION (prefer other profile entries when choosing which experience or project a behavioral-question hint references):
Experience entries shown: ${resume.experience.map((e) => `${e.title} at ${e.company}`).join("; ")}
Projects shown: ${resume.projects.map((p) => p.name).join(", ")}`
    : "";
  const variableInput = `JOB DESCRIPTION:
${jobDescription}${resumeContentNote}

Generate interview-prep questions for this job description. Remember: only use facts from the profile data above.`;

  const { data, usage } = await callClaudeForJson({
    action: "Interview prep generation",
    logAction: "interview-prep",
    systemPrompt: CORE_RULES,
    taskInstructions: INTERVIEW_PREP_TASK_INSTRUCTIONS,
    cacheableContext,
    variableInput,
    maxTokens: 1500,
    schema: InterviewPrepDataSchema,
  });

  return { interviewPrep: data, usage };
}

const JobDossierResultSchema = z.object({ countries: z.array(CountryListingsSchema) });

export async function generateJobDossier(
  excludeCompanies: string[]
): Promise<{ countries: CountryListings[]; usage: TokenUsage }> {
  const excludeBlock = excludeCompanies.length
    ? `\n\nEXCLUDE list — the candidate already has these companies on their active application list, do not list any of them in any country:\n${excludeCompanies.join(", ")}`
    : "";

  const { data, usage } = await callClaudeWithWebSearchForJson({
    action: "Job dossier refresh",
    logAction: "job-dossier",
    systemPrompt: JOB_DOSSIER_SYSTEM_PROMPT,
    userPrompt: `Compile a fresh job dossier now, following every rule in the system prompt.${excludeBlock}`,
    maxUses: 15,
    maxTokens: 8000,
    schema: JobDossierResultSchema,
  });

  return { countries: data.countries, usage };
}
