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

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function extractNumericTokens(text: string): string[] {
  return text.match(/\$?\d[\d,.]*\s?(%|k|m|\+)?/gi) ?? [];
}

interface Violation {
  category: string;
  message: string;
}

function checkResume(resume: ResumeData, label: string): Violation[] {
  const violations: Violation[] = [];

  const profileCompanies = new Set(myProfile.experience.map((e) => norm(e.company)));
  const companyToLocation = new Map(
    myProfile.experience.map((e) => [norm(e.company), e.location ?? null])
  );
  const profileProjectNames = new Set(myProfile.projects.map((p) => norm(p.name)));
  const profileCerts = new Set((myProfile.certifications ?? []).map(norm));
  const profileSchools = new Set(myProfile.education.map((e) => norm(e.school)));

  // Skills are explicitly allowed to be synthesized/reworded from anywhere in the
  // profile (skills list, project tech stacks, bullet text, headline) — so the
  // fidelity bar here is "grounded somewhere," checked as a substring match against
  // the full text corpus, not an exact match against the flat skills array.
  const fullTextCorpus = norm(
    [
      myProfile.headline,
      myProfile.summary,
      ...myProfile.skills,
      ...myProfile.experience.flatMap((e) => e.bullets),
      ...myProfile.projects.flatMap((p) => [
        ...(p.bullets ?? []),
        p.description ?? "",
        ...(p.technologies ?? []),
      ]),
    ].join(" \n ")
  );

  // Corpus of all source text (bullets + descriptions) to sanity-check numeric claims against.
  const sourceTextCorpus = [
    ...myProfile.experience.flatMap((e) => e.bullets),
    ...myProfile.projects.flatMap((p) => [...(p.bullets ?? []), p.description ?? ""]),
  ].join(" \n ");
  const sourceNumbers = new Set(extractNumericTokens(sourceTextCorpus).map(norm));

  // 1 & 2: experience company + location fidelity
  for (const exp of resume.experience) {
    if (!profileCompanies.has(norm(exp.company))) {
      violations.push({
        category: "experience.company",
        message: `Generated company "${exp.company}" not found in profile experience entries`,
      });
      continue;
    }
    if (exp.location) {
      const sourceLocation = companyToLocation.get(norm(exp.company));
      if (sourceLocation && exp.location !== sourceLocation) {
        violations.push({
          category: "experience.location",
          message: `"${exp.company}" location "${exp.location}" does not match profile's "${sourceLocation}"`,
        });
      }
    }
  }

  // 3: contact location fidelity
  if (resume.contact.location && resume.contact.location !== myProfile.contact.location) {
    violations.push({
      category: "contact.location",
      message: `Generated contact location "${resume.contact.location}" does not match profile's "${myProfile.contact.location}"`,
    });
  }

  // 4: project name fidelity
  for (const proj of resume.projects) {
    if (!profileProjectNames.has(norm(proj.name))) {
      violations.push({
        category: "project.name",
        message: `Generated project "${proj.name}" not found in profile projects`,
      });
    }
  }

  // 5 (heuristic, non-fatal): skills should be grounded somewhere in the profile,
  // but rewording/synthesis across skills + tech stacks + bullets is expected.
  for (const category of resume.skills) {
    for (const item of category.items) {
      const words = norm(item)
        .replace(/[()]/g, " ")
        .split(/[\s/&,-]+/)
        .filter((w) => w.length > 2);
      const grounded = words.some((w) => fullTextCorpus.includes(w));
      if (!grounded) {
        violations.push({
          category: "heuristic.skills",
          message: `Skill "${item}" (in "${category.category}") has no matching term anywhere in the profile`,
        });
      }
    }
  }

  // 6: certification fidelity
  for (const cert of resume.certifications ?? []) {
    if (!profileCerts.has(norm(cert))) {
      violations.push({
        category: "certifications",
        message: `Certification "${cert}" not found in profile certifications`,
      });
    }
  }

  // 7: education school fidelity
  for (const edu of resume.education) {
    if (!profileSchools.has(norm(edu.school))) {
      violations.push({
        category: "education.school",
        message: `School "${edu.school}" not found in profile education entries`,
      });
    }
  }

  // 8 (heuristic, non-fatal): quantified claims should trace back to a source number
  const allBullets = [
    ...resume.experience.flatMap((e) => e.bullets),
    ...resume.projects.flatMap((p) => p.bullets),
  ];
  for (const bullet of allBullets) {
    for (const num of extractNumericTokens(bullet)) {
      if (!sourceNumbers.has(norm(num))) {
        violations.push({
          category: "heuristic.numeric-claim",
          message: `Bullet contains "${num.trim()}" not found verbatim in any source bullet/description: "${bullet}"`,
        });
      }
    }
  }

  return violations.map((v) => ({ ...v, message: `[${label}] ${v.message}` }));
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
