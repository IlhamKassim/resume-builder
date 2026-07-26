import { describe, it, expect } from "vitest";
import { checkResumeFidelity, type FidelityViolation } from "@/lib/fidelity-check";
import {
  makeProfile,
  makeResume,
  baseExperience,
  secondExperience,
  baseProject,
  secondProject,
} from "@/lib/__tests__/fixtures/fidelity-fixtures";

function expectSingleViolation(violations: FidelityViolation[], category: string) {
  expect(violations).toHaveLength(1);
  expect(violations[0]).toMatchObject({ category });
}

describe("checkResumeFidelity", () => {
  it("returns no violations for a resume grounded entirely in the profile", () => {
    const violations = checkResumeFidelity(makeProfile(), makeResume());
    expect(violations).toEqual([]);
  });

  it("flags an experience company not present in the profile", () => {
    const violations = checkResumeFidelity(
      makeProfile(),
      makeResume({ experience: [{ ...baseExperience, company: "Umbrella Corp" }] })
    );
    expectSingleViolation(violations, "experience.company");
  });

  it("flags a title that doesn't match any profile entry for that company", () => {
    const violations = checkResumeFidelity(
      makeProfile(),
      makeResume({ experience: [{ ...baseExperience, title: "Senior Software Engineer" }] })
    );
    expectSingleViolation(violations, "experience.title");
  });

  it("flags an experience location that doesn't match the profile's location for that company", () => {
    const violations = checkResumeFidelity(
      makeProfile(),
      makeResume({ experience: [{ ...baseExperience, location: "New York, NY" }] })
    );
    expectSingleViolation(violations, "experience.location");
  });

  it("flags a contact location that doesn't match the profile's contact location", () => {
    const resume = makeResume();
    resume.contact.location = "New York, NY";
    const violations = checkResumeFidelity(makeProfile(), resume);
    expectSingleViolation(violations, "contact.location");
  });

  it("flags a project name not present in the profile", () => {
    const violations = checkResumeFidelity(
      makeProfile(),
      makeResume({ projects: [{ ...baseProject, name: "Secret Project" }] })
    );
    expectSingleViolation(violations, "project.name");
  });

  it("flags a project url when the profile's entry for that project has no url at all", () => {
    const violations = checkResumeFidelity(
      makeProfile({ projects: [secondProject] }),
      makeResume({ projects: [{ ...secondProject, url: "https://budget-tracker.example.com" }] })
    );
    expectSingleViolation(violations, "project.url");
  });

  it("flags a project url borrowed from a different project's real url", () => {
    const violations = checkResumeFidelity(
      makeProfile({ projects: [baseProject, { ...secondProject, url: "https://budget-tracker.example.com" }] }),
      makeResume({ projects: [{ ...baseProject, url: "https://budget-tracker.example.com" }] })
    );
    expectSingleViolation(violations, "project.url");
  });

  it("flags a skill with no matching term anywhere in the profile", () => {
    const violations = checkResumeFidelity(
      makeProfile(),
      makeResume({ skills: [{ category: "Languages", items: ["Rust"] }] })
    );
    expectSingleViolation(violations, "heuristic.skills");
  });

  it("flags a certification not present in the profile", () => {
    const violations = checkResumeFidelity(
      makeProfile(),
      makeResume({ certifications: ["Certified Kubernetes Administrator"] })
    );
    expectSingleViolation(violations, "certifications");
  });

  it("flags an education school not present in the profile", () => {
    const violations = checkResumeFidelity(
      makeProfile(),
      makeResume({
        education: [
          {
            school: "Other University",
            degree: "BSc",
            field: "Computer Science",
            startDate: "2018-09",
            endDate: "2022-05",
          },
        ],
      })
    );
    expectSingleViolation(violations, "education.school");
  });

  it("flags a bullet whose numeric claim belongs to a different profile entry (ADR-0004)", () => {
    const mixedBullet = {
      ...baseExperience,
      bullets: ["Reduced latency by 30% across the checkout service", "Led a team that managed a $50,000 budget"],
    };
    const violations = checkResumeFidelity(
      makeProfile({ experience: [baseExperience, secondExperience] }),
      makeResume({ experience: [mixedBullet, secondExperience] })
    );
    expectSingleViolation(violations, "cross-entry-fact-mixing");
  });

  it("flags a bullet whose numeric claim isn't grounded verbatim anywhere in the profile", () => {
    const inventedNumberBullet = {
      ...baseExperience,
      bullets: ["Reduced latency by 30% across the checkout service", "Cut deployment time by 87%"],
    };
    const violations = checkResumeFidelity(
      makeProfile(),
      makeResume({ experience: [inventedNumberBullet] })
    );
    expectSingleViolation(violations, "heuristic.numeric-claim");
  });

  it("flags a summary sentence that fuses numbers uniquely traceable to two different entries (ADR-0004)", () => {
    const violations = checkResumeFidelity(
      makeProfile({ experience: [baseExperience, secondExperience] }),
      makeResume({
        experience: [baseExperience, secondExperience],
        summary: "Reduced latency by 30% and analyzed $50,000 in quarterly marketing spend.",
      })
    );
    expectSingleViolation(violations, "cross-entry-fact-mixing");
  });

  it("does not flag a summary that references multiple entries in separate sentences", () => {
    const violations = checkResumeFidelity(
      makeProfile({ experience: [baseExperience, secondExperience] }),
      makeResume({
        experience: [baseExperience, secondExperience],
        summary:
          "Software engineer who reduced latency by 30% at Acme Corp. Also analyzed $50,000 in quarterly marketing spend at Globex Inc.",
      })
    );
    expect(violations).toEqual([]);
  });
});
