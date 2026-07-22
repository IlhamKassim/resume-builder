/**
 * Runs a handful of representative job descriptions through the real
 * tailoring pipeline and checks that the AI didn't invent facts not
 * present in lib/my-profile.ts — company names, locations, project
 * names, skills, certifications, education, and quantified claims.
 *
 * This makes real Anthropic API calls (costs tokens). Run manually:
 *   npm run check:fidelity
 */
import myProfile from "../lib/my-profile";
import { tailorResume } from "../lib/claude";
import { checkResumeFidelity, type FidelityViolation } from "../lib/fidelity-check";
import type { ResumeData } from "../lib/types";

const SAMPLE_JOB_DESCRIPTIONS: { label: string; jd: string }[] = [
  {
    label: "New Grad Software Engineer (full-stack + AI)",
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
  {
    label: "Business Operations / Program Analyst",
    jd: `Program Operations Analyst

We're looking for a Program Operations Analyst to support cross-functional program delivery, stakeholder engagement, and data-driven reporting.

Responsibilities:
- Coordinate program logistics and manage stakeholder relationships across departments
- Maintain and analyze program databases to report on impact and outcomes
- Support recruitment and onboarding cycles for program cohorts
- Evaluate new tools (including AI-based tools) for process improvement

Qualifications:
- Bachelor's degree in business, engineering, or related field
- Strong organizational and communication skills
- Experience with CRM or database systems
- Comfort working with leadership/executive stakeholders`,
  },
];

function checkResume(resume: ResumeData, label: string): FidelityViolation[] {
  return checkResumeFidelity(myProfile, resume).map((v) => ({ ...v, message: `[${label}] ${v.message}` }));
}

async function main() {
  let hardFailures = 0;
  let heuristicWarnings = 0;

  for (const { label, jd } of SAMPLE_JOB_DESCRIPTIONS) {
    console.log(`\n=== ${label} ===`);
    const { resume } = await tailorResume(myProfile, jd);
    const violations = checkResume(resume, label);

    const hard = violations.filter((v) => !v.category.startsWith("heuristic."));
    const heuristic = violations.filter((v) => v.category.startsWith("heuristic."));

    if (hard.length === 0) {
      console.log("  ✓ No fidelity violations");
    } else {
      for (const v of hard) console.log(`  ✗ [${v.category}] ${v.message}`);
      hardFailures += hard.length;
    }

    if (heuristic.length > 0) {
      for (const v of heuristic) console.log(`  ~ [warn] ${v.message}`);
      heuristicWarnings += heuristic.length;
    }
  }

  console.log(
    `\n${hardFailures === 0 ? "PASS" : "FAIL"} — ${hardFailures} hard violation(s), ${heuristicWarnings} heuristic warning(s)`
  );
  process.exit(hardFailures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Fidelity check crashed:", err);
  process.exit(1);
});
