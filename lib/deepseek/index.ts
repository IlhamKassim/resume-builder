import { ResumeDataSchema, type ProfileData, type ResumeData } from "@/lib/types";
import { checkResumeFidelity, type FidelityViolation } from "@/lib/fidelity-check";
import { CORE_RULES, RESUME_TASK_INSTRUCTIONS } from "@/lib/claude/prompts";
import type { TokenUsage } from "@/lib/claude";
import { callDeepSeekForJson } from "./json-call";

export async function tailorResumeWithDeepSeek(
  profile: ProfileData,
  jobDescription: string
): Promise<{ resume: ResumeData; usage: TokenUsage; fidelityWarnings: FidelityViolation[] }> {
  const cacheableContext = `PROFILE DATA:\n${JSON.stringify(profile, null, 2)}`;
  const variableInput = `JOB DESCRIPTION:
${jobDescription}

Tailor the resume to this job description. Remember: only use facts from the profile data above.`;

  const { data, usage } = await callDeepSeekForJson({
    action: "Resume generation",
    logAction: "resume",
    systemPrompt: CORE_RULES,
    taskInstructions: RESUME_TASK_INSTRUCTIONS,
    cacheableContext,
    variableInput,
    maxTokens: 4096,
    schema: ResumeDataSchema,
  });

  // Same deterministic, provider-agnostic fidelity pass the Claude path runs — see
  // lib/claude/index.ts's tailorResume. Not model-specific, so it needs no changes to also catch
  // DeepSeek hallucinations (confirmed in this session's earlier prototype comparison).
  const fidelityWarnings = checkResumeFidelity(profile, data);

  return { resume: data, usage, fidelityWarnings };
}
