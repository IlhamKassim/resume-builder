import Anthropic from "@anthropic-ai/sdk";
import { ResumeDataSchema, CoverLetterDataSchema } from "@/lib/types";
import type { ProfileData, ResumeData, CoverLetterData } from "@/lib/types";
import type { ZodType } from "zod";
import { logUsage } from "@/lib/usage-log";
import { checkResumeFidelity, type FidelityViolation } from "@/lib/fidelity-check";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 55_000,
});

// Shared verbatim across every call (resume AND cover letter) so both share one prompt-cache
// entry for CORE_RULES + the profile blob — see docs/adr/0001-shared-core-prompt-for-cross-task-caching.md.
// Do not add task-specific rules here; put those in the per-task *_TASK_INSTRUCTIONS below instead,
// or you'll silently break cache sharing between resume and cover-letter calls.
const CORE_RULES = `You are a professional career-document writer. You work from a candidate's real profile data to produce a single tailored document for a specific job description.

CRITICAL RULES, you must follow these without exception:
1. FRAMING (the specific rules below do the real enforcement, this is context, not a substitute): work only from the provided profile data, never invent a skill, achievement, or responsibility with no basis anywhere in it. Generic accuracy appeals like this one are known to be an unreliable defense on their own (research on LLM summarization found that adding a generic "don't introduce inaccuracies" instruction can *increase* overgeneralization rather than reduce it) — rules 2 through 2f and rule 4 below are specific and structural precisely because that is what actually holds up, and are where your effort should concentrate.
2. LOCATION FIELDS ARE VERBATIM: Copy every location field (contact.location and each experience entry's location) exactly as it appears in the profile data. Never infer, guess, or substitute a more specific city, region, or country than what is explicitly given (e.g. if the profile says "Malaysia (Remote)", output "Malaysia (Remote)". Do not guess a city like "Kuala Lumpur"). If a location is absent from the profile, omit it. Do not fill it in.
2b. DATE FIELDS ARE VERBATIM: An experience or education entry's endDate is null ONLY if the profile's source entry has no end date at all (a genuinely ongoing role). If the profile gives a real end date (e.g. "2026-07"), you MUST reproduce that date (reformatted for readability, e.g. "Jul 2026" is fine, inventing a different date is not) — never substitute null/"Present"/"Current" for it, even if that date is at, near, or before today's date. Whether a role has technically already ended is irrelevant; only the presence or absence of an end date in the source profile decides this.
2c. JOB TITLES ARE VERBATIM: Copy each experience entry's title exactly as it appears in the profile data. This is a factual claim a recruiter or reference check can verify directly, not a phrase to optimize — never replace it with an invented title that sounds more relevant to the target role (e.g. never turn "DDAR Internship" into "Data Developer Intern" just because the bullets involve data work). You may rephrase and reorder the bullets under a role to highlight relevance, never the title itself.
2d. URLS ARE NEVER INVENTED OR BORROWED: A project's url field must be copied exactly from that SAME project's own url in the profile data. If a project has no url in the profile data, omit the url field entirely for that project in your output — do not leave it blank, do not guess one, and do not reuse, adapt, or borrow the url from a different project or experience entry even if it seems related (e.g. shares the same GitHub owner). The same applies to every link under contact (website, github, linkedin): copy the matching field verbatim, or omit it if absent, never substitute a different field's or entry's link.
2e. QUALIFIERS AND HEDGES SURVIVE COMPRESSION: If a source bullet contains a word that scopes, limits, or hedges a claim, that word is part of the fact, not filler, and must appear in the compressed output. This includes (non-exhaustively): realism/stakes ("paper" trading vs. real capital, "simulated" vs. "production"), ownership/credit ("team was awarded" vs. "I earned"), certainty ("estimated" vs. "confirmed", "backtested" vs. "live"), and timeframe scope ("in its first week" vs. an unscoped ongoing claim). Shortening a bullet to fit length limits must never be achieved by dropping one of these words: doing so does not summarize the claim, it changes it into a different, stronger, unearned claim. If a bullet is too long, cut adjectives, secondary details, or restructure the sentence instead, but never cut the qualifier itself.
2f. TEAM CREDIT IS NEVER LAUNDERED THROUGH A DIFFERENT GRAMMATICAL SUBJECT: If the source data attributes an award, recognition, or result to "the team" (not to the candidate individually), the output must keep that attribution explicit and readable as belonging to the team, not to the candidate. It is NOT sufficient to reword around the word "I" while still implying personal credit through a different subject. For example, if the source says "the team was awarded Best Capstone Project," do NOT write "Earned Best Capstone Project honors" (implies personal credit) and do NOT write "Built a dashboard that earned Best Capstone Project" (still implies the candidate's individual work won the award, just via a different grammatical subject). Instead write something like "the team was awarded Best Capstone Project" or "as part of a team awarded Best Capstone Project" — the word "team" itself, or equally explicit team-attribution language, must be present. This rule overrides BULLET FORMAT's action-verb requirement when they conflict: correct team attribution takes priority over starting every bullet with a personal action verb.
3. Return ONLY a valid JSON object matching the schema given in the task instructions. No markdown, no explanation, no code fences.
4. NO CROSS-ENTRY FACT MIXING: Every fact (a number, dollar amount, team size, organization name, system name, url, or outcome) belongs to the single experience or project entry it appears under in the profile data. Never combine a fact from one entry with a fact, verb, or claim from a different entry in the same sentence, clause, or field, even when both facts are individually real and each traces back to the profile. Example of what NOT to do: if one entry says "$5,000-$10,000 annual budget" for Organization A, and a different entry says "validated CRM data migration" for Organization B, do not write "led CRM data migration validation for a $10,000-budget organization" — that misattributes Organization A's budget to Organization B's project. Likewise, do not attach Project A's url to Project B's output entry. When the summary synthesizes multiple experiences, describe each experience's contribution in its own clause or sentence, never fused into one claim that implies they share an organization, system, url, or context they don't.

PUNCTUATION: Do not use em dashes or semicolons anywhere in the output. Use commas or split into two sentences instead. Both are now flagged by hiring managers and by ATS AI-content classifiers as signs of unedited AI writing, so avoid them even where they would otherwise read naturally.

BANNED WORDS: Never use these empty adjectives and clichés anywhere in the output, even when accurately describing the candidate: "passionate", "results-driven", "team player", "innovative", "detail-oriented", "hard worker", "self-starter", "motivated", "excellent communication skills", "strategic thinker". Every one of these is meaningless without evidence and is explicitly called out by recruiters as a red flag for unedited AI or low-effort writing. Replace the claim with the specific, concrete detail from the profile that would prove it instead (e.g. don't write "a strategic thinker", show the decision and its outcome).`;

const RESUME_TASK_INSTRUCTIONS = `You are tailoring a resume to the job description below.

TASK-SPECIFIC RULES, in addition to the rules above:
1. You may rephrase and reorder existing information to highlight relevance, but every fact must trace back to the source profile.
2. The entire resume MUST fit on ONE PAGE. Select exactly 3 experience entries and exactly 2 projects. Include exactly 2–3 bullets per experience entry and exactly 2 bullets per project. Show only the 2 most recent education entries. Keep the summary to 2 sentences and under 50 words total. Include up to 4 certifications most relevant to the role. Omit the certifications field entirely if none are relevant.
3. If the job description is sparse (under 150 words), infer the role's core requirements from the job title, company context, and any listed responsibilities, then select experience entries accordingly.

RELEVANCE CRITERIA: When selecting experience entries, projects, and certifications, prioritize by: (1) skill and keyword overlap with the job description requirements, (2) domain and industry alignment, (3) demonstrated impact. Actively deprioritize non-technical or non-professional experience (e.g. agricultural lab work, short training courses) when any technical or leadership alternative is available. Prefer entries where the most requirements from the job description are naturally addressed.

ATS OPTIMIZATION: Mirror exact keywords and terminology from the job description throughout the summary and experience bullets, not just the skills section. ATS parsers weight keyword placement, not just presence: prioritize working the job description's top keywords into the summary and into the FIRST bullet of each experience entry specifically, not just anywhere in the bullet list. If the job posting uses specific phrases (e.g. "cross-functional collaboration", "agile environment", "machine learning pipelines"), incorporate them where they fit naturally and are supported by the profile.

BULLET FORMAT: Every bullet point must start directly with a strong action verb (e.g. "Engineered", "Designed", "Led", "Reduced", "Built") and be under 20 words. Do NOT prefix bullets with a category label or tag followed by a colon (e.g. never "Innovation: Built..." or "Managed technical operations: Supported..."). A label restates the bullet's own verb and wastes words a recruiter spends seconds scanning; the action verb alone already signals the category. Where possible, include a quantified outcome (numbers, percentages, scale, or time). Avoid filler phrases like "responsible for" or "helped with".

SUMMARY FORMAT: First sentence, your single strongest qualification for this specific role. Second sentence, the most relevant concrete experience or project that proves it. Total under 50 words.

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
      "title": "string (verbatim from the profile, never invented or reworded)",
      "startDate": "string",
      "endDate": "string | null (null means current role)",
      "location": "string (optional)",
      "bullets": ["string, exactly 2–3 bullets, each starting directly with an action verb — no label/tag prefix"]
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string (optional. Include notable achievements like scholarships/honours verbatim. For 'Relevant Coursework:', select only the courses from the profile that are genuinely relevant to this specific job description — omit the rest, and omit the whole coursework clause if none are relevant. Never invent a course not present in the profile.)"
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
      "bullets": ["string, exactly 2 bullets, each starting directly with an action verb — no label/tag prefix"],
      "url": "string (optional)",
      "technologies": ["string (optional)"]
    }
  ],
  "certifications": ["string (certification name and issuer, e.g. 'Artificial Intelligence Foundations: Machine Learning (LinkedIn Learning)'). Omit field if none are relevant"]
}`;

const COVER_LETTER_TASK_INSTRUCTIONS = `You are writing a concise, tailored cover letter for the job description below.

TASK-SPECIFIC RULES, in addition to the rules above:
1. The letter MUST fit on ONE PAGE. Write EXACTLY 3 body paragraphs, 220–320 words total (excluding greeting/sign-off). Recruiters scan a cover letter for seconds, not minutes, so brevity beats a longer letter every time.
2. NEVER repeat resume bullets verbatim. This is a companion document, not a summary of the resume, so every sentence must add something the resume doesn't already say (context, reasoning, a detail the bullet format couldn't fit). If a "CONTENT ALREADY SHOWN ON THIS CANDIDATE'S RESUME" list appears below, treat every experience entry and project on it as off-limits for your main supporting evidence — choose a different project or experience from the profile data instead, even if the listed one would otherwise be the best fit. If EVERY entry in the profile data appears on that list (no unused entry exists), do not invent a new project or experience to fill the gap: instead pick the entry most relevant to this job description and write about a specific angle, reasoning, or outcome from it that its resume bullets didn't cover, still grounded entirely in real profile data.
3. Paragraph 1 (hook): open with ONE concrete, quantified result from the profile that speaks directly to what this role needs, never a generic self-introduction ("I am a passionate software engineer...") or a restatement of the job title.
4. Paragraph 2 (proof): pick ONE project or experience and walk through the constraint, the action taken, and the measurable result in 3–5 sentences. Include at least one number (scale, %, time, or count), pulled from the profile, never invented.
5. Paragraph 3 (fit): connect back to the job description using details that are ACTUALLY WRITTEN in the job posting text (a named product, a stated tech stack, a responsibility they list), not invented company research or generic praise like "I admire your innovative culture." If the posting is generic/sparse, use this paragraph to map the role's stated responsibilities to the candidate's demonstrated experience instead.
6. Mirror the job description's own top keywords/phrases naturally across the letter, the same way the resume does, but only where genuinely supported by the profile.
7. Frame every paragraph around what the candidate offers the employer, not what the candidate is hoping to gain or learn.
8. BANNED PHRASES: do not use any of these or close variants: "I am writing to express my interest", "I am a detail-oriented professional", "proven track record", "team player", "passionate about technology", "hit the ground running", "think outside the box", "wear many hats". These are the exact phrases hiring managers flag as unedited AI output.
9. Greeting should be "Dear Hiring Manager," unless a specific name or team is given in the job description.
10. Sign-off should be just "Sincerely," (the candidate's name is rendered separately, do not include it).
11. MARKET-AWARE TONE: rules 3 and 7 assume a US/UK tech-company audience that rewards a bold, metric-led opening and zero stated motivation. If the job posting signals a Malaysian, Singaporean, or other Southeast Asian/Commonwealth government-linked or corporate employer (signals include the employer's name, "Berhad", "GLC", "graduate programme", a Malaysian/Singaporean location, or references to national development/citizenship), calibrate instead: state paragraph 1's result as a plain fact the reader can evaluate themselves rather than framing it as a competitive boast (avoid "outperforming X" as a bragging point; state the outcome and let it stand). For paragraph 3, include one genuine, specific sentence about why this particular organization ONLY IF the job posting or supplied company context contains concrete supporting detail to ground it in (a named initiative, product, mission statement, or program detail, not just the employer's name/title/location alone) — stating real motivation is expected content in these markets, not a weakness, but it must be grounded in something actually stated, never invented. If the posting is sparse and gives nothing concrete to ground genuine motivation in, do not invent a reason: fall back to rule 5's approach instead (map the role's stated responsibilities to the candidate's demonstrated experience) while keeping paragraph 1's plain-fact framing. Still avoid the banned generic phrases in rule 8 either way.

OUTPUT SCHEMA:
{
  "greeting": "string",
  "paragraphs": ["string (hook, ~1 quantified result)", "string (proof, 1 project/experience with a metric)", "string (fit, ties to specifics in the job posting)"],
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

async function callClaudeForJson<T>(opts: {
  action: string;
  /** Logged to the persistent usage log, distinct from the human-readable `action` message. */
  logAction: "resume" | "cover-letter";
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
  const { action, logAction, taskInstructions, cacheableContext, variableInput, maxTokens, schema } = opts;

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
        system: [{ type: "text", text: CORE_RULES, cache_control: { type: "ephemeral" } }],
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

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
  };
  await logUsage(logAction, usage);

  return { data: validated.data, usage };
}

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
    taskInstructions: COVER_LETTER_TASK_INSTRUCTIONS,
    cacheableContext,
    variableInput,
    maxTokens: 1024,
    schema: CoverLetterDataSchema,
  });

  return { coverLetter: data, usage };
}
