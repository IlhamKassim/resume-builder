import type { ProfileData, ResumeData } from "@/lib/types";

export interface FidelityViolation {
  category: string;
  message: string;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function extractNumericTokens(text: string): string[] {
  return text.match(/\$?\d[\d,.]*\s?(%|k|m|\+)?/gi) ?? [];
}

/**
 * Checks a generated resume against the source profile for fidelity violations: invented
 * companies/titles/locations/urls/certifications/schools, and cross-entry fact mixing (a number
 * from one job/project bleeding into a bullet or summary sentence about a different one — see
 * docs/adr/0004-prevent-cross-entry-fact-conflation-in-prompt-not-detector.md).
 *
 * Shared by scripts/check-profile-fidelity.ts (offline, multi-JD sweep) and the live tailoring
 * path in lib/claude.ts (single real generation, no extra API cost since it only inspects data
 * already in hand) so both stay in sync with one implementation.
 */
export function checkResumeFidelity(profile: ProfileData, resume: ResumeData): FidelityViolation[] {
  const violations: FidelityViolation[] = [];

  const profileCompanies = new Set(profile.experience.map((e) => norm(e.company)));
  const companyToLocation = new Map(
    profile.experience.map((e) => [norm(e.company), e.location ?? null])
  );
  // Keyed by company+title pair, not company alone — several profile entries share the
  // same company (e.g. "Penn State University") with different titles.
  const validCompanyTitlePairs = new Set(
    profile.experience.map((e) => `${norm(e.company)}|${norm(e.title)}`)
  );
  const profileProjectNames = new Set(profile.projects.map((p) => norm(p.name)));
  // Keyed by project name — a project's url must match ITS OWN source url, not just
  // exist somewhere in the profile (a generated url could otherwise borrow a different
  // project's real url and still look "grounded").
  const projectNameToUrl = new Map(profile.projects.map((p) => [norm(p.name), p.url ?? null]));
  const profileCerts = new Set((profile.certifications ?? []).map(norm));
  const profileSchools = new Set(profile.education.map((e) => norm(e.school)));

  // Skills are explicitly allowed to be synthesized/reworded from anywhere in the
  // profile (skills list, project tech stacks, bullet text, headline) — so the
  // fidelity bar here is "grounded somewhere," checked as a substring match against
  // the full text corpus, not an exact match against the flat skills array.
  const fullTextCorpus = norm(
    [
      profile.headline,
      profile.summary,
      ...profile.skills,
      ...profile.experience.flatMap((e) => e.bullets),
      ...profile.projects.flatMap((p) => [
        ...(p.bullets ?? []),
        p.description ?? "",
        ...(p.technologies ?? []),
      ]),
    ].join(" \n ")
  );

  // Corpus of all source text (bullets + descriptions) to sanity-check numeric claims against.
  const sourceTextCorpus = [
    ...profile.experience.flatMap((e) => e.bullets),
    ...profile.projects.flatMap((p) => [...(p.bullets ?? []), p.description ?? ""]),
  ].join(" \n ");
  const sourceNumbers = new Set(extractNumericTokens(sourceTextCorpus).map(norm));

  // Per-entry numeric tokens: which raw numbers "belong" to which SPECIFIC experience or
  // project entry. A number is only "grounded" for a given bullet if it belongs to that
  // bullet's OWN entry, not just present somewhere else in the profile under a different job.
  const experienceNumbers = new Map(
    profile.experience.map((e) => [
      `${norm(e.company)}|${norm(e.title)}`,
      new Set(extractNumericTokens(e.bullets.join(" \n ")).map(norm)),
    ])
  );
  const projectNumbers = new Map(
    profile.projects.map((p) => [
      norm(p.name),
      new Set(
        extractNumericTokens([...(p.bullets ?? []), p.description ?? ""].join(" \n ")).map(norm)
      ),
    ])
  );
  // Reverse index: a number that belongs to exactly one entry is strong evidence of where it
  // came from. A number shared verbatim across multiple entries is ambiguous, so it's excluded
  // below rather than treated as evidence of mixing either way.
  const numberToEntries = new Map<string, string[]>();
  for (const [key, nums] of experienceNumbers) {
    for (const n of nums) numberToEntries.set(n, [...(numberToEntries.get(n) ?? []), `experience: ${key}`]);
  }
  for (const [key, nums] of projectNumbers) {
    for (const n of nums) numberToEntries.set(n, [...(numberToEntries.get(n) ?? []), `project: ${key}`]);
  }

  // 1 & 2: experience company + title + location fidelity
  for (const exp of resume.experience) {
    if (!profileCompanies.has(norm(exp.company))) {
      violations.push({
        category: "experience.company",
        message: `Generated company "${exp.company}" not found in profile experience entries`,
      });
      continue;
    }
    if (!validCompanyTitlePairs.has(`${norm(exp.company)}|${norm(exp.title)}`)) {
      violations.push({
        category: "experience.title",
        message: `Title "${exp.title}" at "${exp.company}" does not match any profile entry for that company`,
      });
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
  if (resume.contact.location && resume.contact.location !== profile.contact.location) {
    violations.push({
      category: "contact.location",
      message: `Generated contact location "${resume.contact.location}" does not match profile's "${profile.contact.location}"`,
    });
  }

  // 4: project name + url fidelity
  for (const proj of resume.projects) {
    if (!profileProjectNames.has(norm(proj.name))) {
      violations.push({
        category: "project.name",
        message: `Generated project "${proj.name}" not found in profile projects`,
      });
      continue;
    }
    const sourceUrl = projectNameToUrl.get(norm(proj.name));
    if (sourceUrl == null) {
      if (proj.url) {
        violations.push({
          category: "project.url",
          message: `Project "${proj.name}" has url "${proj.url}" but the profile's entry for this project has no url at all`,
        });
      }
    } else if (proj.url !== sourceUrl) {
      violations.push({
        category: "project.url",
        message: proj.url
          ? `Project "${proj.name}" url "${proj.url}" does not match profile's "${sourceUrl}"`
          : `Project "${proj.name}" is missing a url; profile expects "${sourceUrl}"`,
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

  // 8: quantified claims in a bullet must trace back to THAT SAME entry's own source numbers.
  // A number that isn't grounded in its own entry but IS grounded in a DIFFERENT entry is a
  // hard failure (cross-entry fact mixing, ADR 0004) — a number that isn't grounded anywhere
  // at all is the older, softer "possibly invented" heuristic.
  function checkOwnEntryNumbers(
    bullets: string[],
    ownNumbers: Set<string> | undefined,
    describe: (bullet: string) => string
  ) {
    if (!ownNumbers) return; // company/title/name fidelity violation already reported above
    for (const bullet of bullets) {
      for (const num of extractNumericTokens(bullet)) {
        const normNum = norm(num);
        if (ownNumbers.has(normNum)) continue;
        if (sourceNumbers.has(normNum)) {
          violations.push({
            category: "cross-entry-fact-mixing",
            message: `${describe(bullet)} contains "${num.trim()}" which belongs to a DIFFERENT profile entry, not this one: "${bullet}"`,
          });
        } else {
          violations.push({
            category: "heuristic.numeric-claim",
            message: `Bullet contains "${num.trim()}" not found verbatim in any source bullet/description: "${bullet}"`,
          });
        }
      }
    }
  }

  for (const exp of resume.experience) {
    checkOwnEntryNumbers(
      exp.bullets,
      experienceNumbers.get(`${norm(exp.company)}|${norm(exp.title)}`),
      () => `"${exp.title}" at "${exp.company}" bullet`
    );
  }
  for (const proj of resume.projects) {
    checkOwnEntryNumbers(proj.bullets ?? [], projectNumbers.get(norm(proj.name)), () => `Project "${proj.name}" bullet`);
  }

  // 9: the summary may legitimately reference multiple entries, but CORE_RULES rule 4 requires
  // each entry's contribution stay in its own clause/sentence. Flag any single summary
  // sentence that fuses numbers uniquely traceable to two or more different entries — the
  // exact failure pattern documented in ADR 0004.
  const summarySentences = resume.summary.split(/(?<=[.!?])\s+/);
  for (const sentence of summarySentences) {
    const entriesInSentence = new Set<string>();
    for (const num of extractNumericTokens(sentence)) {
      const entries = numberToEntries.get(norm(num));
      if (entries && entries.length === 1) entriesInSentence.add(entries[0]);
    }
    if (entriesInSentence.size > 1) {
      violations.push({
        category: "cross-entry-fact-mixing",
        message: `Summary sentence fuses facts from different profile entries (${[...entriesInSentence].join(", ")}) into one sentence: "${sentence.trim()}"`,
      });
    }
  }

  return violations;
}
