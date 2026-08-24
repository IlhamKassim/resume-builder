/**
 * THROWAWAY PROTOTYPE — answers one question: if resume generation switched
 * from Claude Sonnet 5 to DeepSeek's strongest chat model, would quality drop?
 *
 * Runs the exact same CORE_RULES + RESUME_TASK_INSTRUCTIONS prompt (from
 * lib/claude/prompts.ts) against both providers for the same profile + job
 * descriptions, then compares: JSON schema validity, fidelity violations
 * (via the real lib/fidelity-check.ts), and the hard style rules the prompt
 * asserts (no em dash/semicolon, no banned filler words, exactly 2-3 bullets
 * per experience / 2 per project).
 *
 * Makes real paid API calls to both Anthropic and DeepSeek. Run manually:
 *   npm run prototype:deepseek
 *
 * Requires DEEPSEEK_API_KEY in .env.local (get one at platform.deepseek.com).
 * Defaults to "deepseek-chat" (V3.2, their general-purpose flagship) —
 * override with DEEPSEEK_MODEL if you want to try deepseek-reasoner instead,
 * though its heavy chain-of-thought output is a worse fit for a one-shot
 * JSON task than the fast direct answers this comparison is targeting.
 *
 * Not wired into the app. Nothing here should be imported by real routes —
 * lib/claude/index.ts's tailorResume() stays the only production path.
 */
import myProfile from "../lib/my-profile";
import { tailorResume } from "../lib/claude";
import { CORE_RULES, RESUME_TASK_INSTRUCTIONS } from "../lib/claude/prompts";
import { checkResumeFidelity, type FidelityViolation } from "../lib/fidelity-check";
import { ResumeDataSchema, type ResumeData } from "../lib/types";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const OUT_DIR = path.join(__dirname, "../.prototype-output");

const SAMPLE_JOB_DESCRIPTIONS: { label: string; jd: string }[] = [
  {
    label: "Junior Software Developer — Seagull Cooling Technologies (Malaysia)",
    jd: `Junior Software Developer
Seagull Cooling Technologies (Asia Pacific) Sdn. Bhd.
Pusat Bandar Damansara, Kuala Lumpur

Key Responsibilities:
- Application Development: Develop and maintain web applications and internal business systems, actively supporting both frontend and backend development activities.
- System Integration & Databases: Work directly with databases, APIs, and modern system integrations to ensure seamless data flow and functionality.
- Testing & Maintenance: Assist in debugging, testing, troubleshooting, and continuous improvement of existing software applications.
- Deployment Support: Participate in software deployment, version maintenance, and ongoing system enhancement activities.
- Documentation: Prepare and meticulously maintain technical documentation when required.
- Team Collaboration: Collaborate with senior developers, cross-functional project teams, and business users to understand functional requirements and deliver impactful technical solutions.

Job Requirements:
- Diploma or Bachelor's Degree in Computer Science, Software Engineering, Information Technology, or a related field
- Fresh Graduates to 2 years of working experience. Fresh graduates are highly encouraged to apply
- Having internship or academic project experience in software development is a strong advantage
- Basic to intermediate knowledge of C#, .NET Core, and Python
- Experience with PHP (Laravel) is an added advantage
- Strong problem-solving mindset and highly analytical thinking skills
- A positive attitude with a strong willingness and passion to learn new technologies
- Excellent interpersonal, communication, and teamwork skills
- Self-motivated, with the ability to work independently with minimal supervision when required
- Strong attention to detail and an unyielding commitment to software quality`,
  },
  {
    label: "New Grad Software Engineer (full-stack + AI, US-style)",
    jd: `New Grad Software Engineer

We're hiring a New Grad Software Engineer to join our product engineering team. You'll build full-stack features across our web application, working with modern frameworks and cloud infrastructure.

Responsibilities:
- Build and ship full-stack features using React/Next.js and TypeScript
- Design and integrate backend APIs, including working with third-party AI/LLM APIs
- Write automated tests and participate in code review
- Deploy and monitor services in a cloud environment (AWS/GCP)

Qualifications:
- BS in Computer Science, Computer Engineering, or related field
- Strong fundamentals in data structures, algorithms, and systems programming
- Experience with JavaScript/TypeScript and at least one backend language (Python, Java, C++)
- Familiarity with AI/ML APIs (e.g. Gemini, OpenAI, Claude) is a plus`,
  },
];

const BANNED_WORDS = [
  "passionate",
  "results-driven",
  "team player",
  "innovative",
  "detail-oriented",
  "hard worker",
  "self-starter",
  "motivated",
  "excellent communication skills",
  "strategic thinker",
];

interface StyleCheck {
  emDashOrSemicolon: boolean;
  bannedWordsFound: string[];
  experienceBulletCountsOk: boolean;
  projectBulletCountsOk: boolean;
}

function checkStyleRules(resume: ResumeData): StyleCheck {
  const text = JSON.stringify(resume);
  return {
    emDashOrSemicolon: /—|;/.test(text),
    bannedWordsFound: BANNED_WORDS.filter((w) => text.toLowerCase().includes(w)),
    experienceBulletCountsOk: resume.experience.every((e) => e.bullets.length >= 2 && e.bullets.length <= 3),
    projectBulletCountsOk: resume.projects.every((p) => p.bullets.length === 2),
  };
}

async function tailorWithDeepSeek(jd: string): Promise<ResumeData> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set in .env.local");
  }

  const userPrompt = `PROFILE DATA:\n${JSON.stringify(myProfile, null, 2)}\n\n${RESUME_TASK_INSTRUCTIONS}\n\nJOB DESCRIPTION:\n${jd}\n\nTailor the resume to this job description. Remember: only use facts from the profile data above.`;

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: CORE_RULES },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error ${res.status}: ${await res.text()}`);
  }

  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned no message content");

  const parsed = ResumeDataSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(`DeepSeek output failed schema validation: ${JSON.stringify(parsed.error.issues, null, 2)}`);
  }
  return parsed.data;
}

function report(label: string, resume: ResumeData, violations: FidelityViolation[], style: StyleCheck, ms: number) {
  const hard = violations.filter((v) => !v.category.startsWith("heuristic."));
  const heuristic = violations.filter((v) => v.category.startsWith("heuristic."));

  console.log(`  time: ${(ms / 1000).toFixed(1)}s`);
  console.log(`  fidelity: ${hard.length === 0 ? "PASS" : `FAIL (${hard.length})`}${heuristic.length ? `, ${heuristic.length} heuristic warning(s)` : ""}`);
  for (const v of hard) console.log(`    ✗ [${v.category}] ${v.message}`);
  for (const v of heuristic) console.log(`    ~ [warn] ${v.message}`);
  console.log(`  style: em-dash/semicolon=${style.emDashOrSemicolon ? "FOUND" : "clean"}, banned words=${style.bannedWordsFound.length ? style.bannedWordsFound.join(", ") : "none"}, bullet counts=${style.experienceBulletCountsOk && style.projectBulletCountsOk ? "ok" : "OFF"}`);
  console.log(`  summary: "${resume.summary}"`);
}

function slug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function save(label: string, provider: string, resume: ResumeData) {
  mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${slug(label)}.${provider}.json`);
  writeFileSync(file, JSON.stringify(resume, null, 2));
  console.log(`  saved: ${path.relative(process.cwd(), file)}`);
}

async function main() {
  for (const { label, jd } of SAMPLE_JOB_DESCRIPTIONS) {
    console.log(`\n=== ${label} ===`);

    console.log(`\n[Claude Sonnet 5]`);
    try {
      const start = Date.now();
      const { resume } = await tailorResume(myProfile, jd);
      const ms = Date.now() - start;
      report("Claude", resume, checkResumeFidelity(myProfile, resume), checkStyleRules(resume), ms);
      save(label, "claude", resume);
    } catch (err) {
      console.log(`  CRASHED: ${err instanceof Error ? err.message : String(err)}`);
    }

    console.log(`\n[DeepSeek ${DEEPSEEK_MODEL}]`);
    try {
      const start = Date.now();
      const resume = await tailorWithDeepSeek(jd);
      const ms = Date.now() - start;
      report("DeepSeek", resume, checkResumeFidelity(myProfile, resume), checkStyleRules(resume), ms);
      save(label, "deepseek", resume);
    } catch (err) {
      console.log(`  CRASHED: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

main().catch((err) => {
  console.error("Prototype crashed:", err);
  process.exit(1);
});
