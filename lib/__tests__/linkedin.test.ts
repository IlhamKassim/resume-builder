import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseLinkedInHtml, LinkedInScrapingError, validateLinkedInUrl } from "@/lib/linkedin";
import { ProfileDataSchema } from "@/lib/types";

const fixtureHtml = readFileSync(
  join(__dirname, "fixtures/linkedin-profile.html"),
  "utf-8"
);

describe("validateLinkedInUrl", () => {
  it("accepts a standard linkedin.com/in/ URL", () => {
    expect(() => validateLinkedInUrl("https://www.linkedin.com/in/janedoe")).not.toThrow();
  });

  it("accepts URL without www", () => {
    expect(() => validateLinkedInUrl("https://linkedin.com/in/janedoe")).not.toThrow();
  });

  it("rejects a non-LinkedIn URL", () => {
    expect(() => validateLinkedInUrl("https://example.com/janedoe")).toThrow(LinkedInScrapingError);
  });

  it("rejects a LinkedIn URL that is not a profile", () => {
    expect(() => validateLinkedInUrl("https://linkedin.com/jobs/view/123")).toThrow(LinkedInScrapingError);
  });

  it("rejects an empty string", () => {
    expect(() => validateLinkedInUrl("")).toThrow(LinkedInScrapingError);
  });
});

describe("parseLinkedInHtml", () => {
  it("extracts the name", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    expect(profile.name).toBe("Jane Doe");
  });

  it("extracts the headline", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    expect(profile.headline).toBe("Senior Software Engineer at Acme Corp");
  });

  it("extracts the location", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    expect(profile.location).toBe("San Francisco, CA");
  });

  it("extracts the summary", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    expect(profile.summary).toContain("5+ years building scalable web applications");
  });

  it("extracts at least one experience entry", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    expect(profile.experience.length).toBeGreaterThanOrEqual(1);
  });

  it("extracts experience title and company", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    const first = profile.experience[0];
    expect(first.title).toBe("Senior Software Engineer");
    expect(first.company).toBe("Acme Corp");
  });

  it("extracts experience dates", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    const first = profile.experience[0];
    expect(first.startDate).toBeTruthy();
    expect(first.endDate).toBeNull();
  });

  it("extracts experience bullets as non-empty array", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    expect(profile.experience[0].bullets.length).toBeGreaterThan(0);
  });

  it("extracts education school and degree", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    expect(profile.education.length).toBeGreaterThanOrEqual(1);
    expect(profile.education[0].school).toBe("University of California, Berkeley");
    expect(profile.education[0].degree).toBeTruthy();
  });

  it("extracts skills as a non-empty array", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    expect(profile.skills).toContain("TypeScript");
    expect(profile.skills).toContain("React");
  });

  it("returns a result that passes ProfileDataSchema validation", () => {
    const profile = parseLinkedInHtml(fixtureHtml);
    const result = ProfileDataSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it("throws LinkedInScrapingError when name cannot be found", () => {
    expect(() => parseLinkedInHtml("<html><body><p>No profile here</p></body></html>")).toThrow(LinkedInScrapingError);
  });
});
