import { describe, it, expect } from "vitest";
import { analyzeFit } from "@/lib/fit-analysis";
import type { ProfileData } from "@/lib/types";

function makeProfile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    name: "Jordan Example",
    headline: "Full-Stack Development | Cloud Systems",
    location: "Springfield, IL, USA",
    summary: "Engineer building full-stack web applications with React and TypeScript.",
    experience: [
      {
        company: "Example University",
        title: "Undergraduate Research Assistant",
        startDate: "2024-09",
        endDate: "2025-05",
        location: "Springfield, IL, USA",
        bullets: ["Built a data pipeline with Python and PostgreSQL"],
      },
    ],
    education: [
      {
        school: "Example University",
        degree: "B.S.",
        field: "Computer Science",
        startDate: "2021-08",
        endDate: "2025-05",
      },
    ],
    skills: ["TypeScript", "React", "SQL", "Git"],
    projects: [
      {
        name: "Sample Project",
        role: "Solo developer",
        description: "A full-stack feature demonstrating machine learning.",
        bullets: ["Implemented the core feature end-to-end"],
        technologies: ["Next.js", "PostgreSQL"],
      },
    ],
    certifications: [],
    contact: { email: "jordan@example.com", location: "Springfield, IL, USA" },
    ...overrides,
  };
}

describe("analyzeFit", () => {
  it("matches skills present in both the JD and the profile, and flags the gaps", () => {
    const result = analyzeFit(
      makeProfile(),
      "We need a full-stack engineer with React, TypeScript, PostgreSQL, Docker, and Kubernetes experience."
    );

    expect(result.matchedKeywords).toEqual(
      expect.arrayContaining(["full-stack", "react", "typescript", "postgresql"])
    );
    expect(result.missingKeywords).toEqual(
      expect.arrayContaining(["docker", "kubernetes"])
    );
    expect(result.missingKeywords).not.toContain("react");
  });

  it("computes coverage as a rounded percentage of JD keywords", () => {
    const result = analyzeFit(
      makeProfile(),
      "React, TypeScript, Docker, and Kubernetes are required."
    );

    // 4 keywords: react + typescript matched, docker + kubernetes missing → 50%
    expect(result.totalKeywords).toBe(4);
    expect(result.coverage).toBe(50);
  });

  it("matches multi-word skills found in project descriptions", () => {
    const result = analyzeFit(
      makeProfile(),
      "You will apply machine learning and distributed systems at scale."
    );

    expect(result.matchedKeywords).toContain("machine learning");
    expect(result.missingKeywords).toContain("distributed systems");
  });

  it("returns empty results and zero coverage for a JD with no recognized keywords", () => {
    const result = analyzeFit(makeProfile(), "Join our friendly team and grow with us.");

    expect(result.totalKeywords).toBe(0);
    expect(result.matchedKeywords).toEqual([]);
    expect(result.missingKeywords).toEqual([]);
    expect(result.coverage).toBe(0);
  });

  it("does not match a short term as a substring of a longer token", () => {
    // "go" must not be considered present just because "mongodb" contains "go".
    const result = analyzeFit(makeProfile(), "We are hiring a Go developer.");
    expect(result.missingKeywords).toContain("go");
    expect(result.matchedKeywords).not.toContain("go");
  });

  it("recommendedSkills lists the missing keywords", () => {
    const result = analyzeFit(makeProfile(), "React, TypeScript, and Terraform required.");
    expect(result.recommendedSkills).toEqual(["terraform"]);
  });
});
