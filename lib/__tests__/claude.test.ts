import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResumeDataSchema } from "@/lib/types";
import { profileFixture, jobDescriptionFixture } from "@/lib/__tests__/fixtures/profile-fixture";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();
  class MockAnthropic {
    messages = { create: mockCreate };
    static RateLimitError = actual.default.RateLimitError;
    static APIConnectionError = actual.default.APIConnectionError;
    static APIConnectionTimeoutError = actual.default.APIConnectionTimeoutError;
    static InternalServerError = actual.default.InternalServerError;
  }
  return { ...actual, default: MockAnthropic };
});

const validResumeOutput = {
  contact: {
    name: "Mohammad Ilham bin Kassim",
    location: "State College, Pennsylvania, United States",
    website: "https://ilham-portfolio-yl2x.vercel.app/",
    linkedin: "https://www.linkedin.com/in/ilhamkassim",
  },
  summary:
    "Computer Engineering senior at Penn State with a strong foundation in data structures, algorithms, and AI systems programming. Experienced in technical operations and building tools with real-world impact.",
  experience: [
    {
      company: "Penn State University",
      title: "Technical Operations Assistant",
      startDate: "2023-09",
      endDate: null,
      location: "State College, PA",
      bullets: [
        "Managed technical infrastructure supporting university operations",
        "Collaborated with cross-functional teams to deliver impactful solutions",
      ],
    },
  ],
  education: [
    {
      school: "Pennsylvania State University",
      degree: "Bachelor of Science",
      field: "Computer Engineering",
      startDate: "2021-08",
      endDate: "2025-05",
    },
  ],
  skills: [
    { category: "Languages", items: ["Python", "C++"] },
    { category: "CS Fundamentals", items: ["Data Structures & Algorithms", "AI & Systems Programming"] },
  ],
  projects: [
    {
      name: "Truth-Checking Tool",
      description: "Automated fact-checking tool with real-world impact",
    },
  ],
};

describe("tailorResume", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns a valid ResumeData object when Claude responds correctly", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify(validResumeOutput) }],
    });

    const { tailorResume } = await import("../claude");
    const result = await tailorResume(profileFixture, jobDescriptionFixture);

    expect(ResumeDataSchema.safeParse(result).success).toBe(true);
    expect(result.contact.name).toBe("Mohammad Ilham bin Kassim");
  });

  it("passes profile data and job description to Claude", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify(validResumeOutput) }],
    });

    const { tailorResume } = await import("../claude");
    await tailorResume(profileFixture, jobDescriptionFixture);

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === "user"
    );
    expect(JSON.stringify(userMessage.content)).toContain("Mohammad Ilham bin Kassim");
    expect(JSON.stringify(userMessage.content)).toContain("Software Engineer Intern");
  });

  it("throws when Claude returns invalid JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "Sorry, I cannot help with that." }],
    });

    const { tailorResume } = await import("../claude");
    await expect(tailorResume(profileFixture, jobDescriptionFixture)).rejects.toThrow();
  });

  it("throws when Claude returns JSON that fails ResumeData schema", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({ contact: { name: "Someone" }, summary: "" }),
        },
      ],
    });

    const { tailorResume } = await import("../claude");
    await expect(tailorResume(profileFixture, jobDescriptionFixture)).rejects.toThrow();
  });

  it("retries on rate limit and succeeds on second attempt", async () => {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    mockCreate
      .mockRejectedValueOnce(new Anthropic.RateLimitError(429, undefined, "rate limited", new Headers()))
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify(validResumeOutput) }],
      });

    const { tailorResume } = await import("../claude");
    const result = await tailorResume(profileFixture, jobDescriptionFixture);
    expect(result.contact.name).toBe("Mohammad Ilham bin Kassim");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws TailoringError after exhausting retries on rate limit", async () => {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    mockCreate.mockRejectedValue(
      new Anthropic.RateLimitError(429, undefined, "rate limited", new Headers())
    );

    const { tailorResume, TailoringError } = await import("../claude");
    await expect(tailorResume(profileFixture, jobDescriptionFixture)).rejects.toThrow(TailoringError);
  });

  it("throws TailoringError on timeout", async () => {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    mockCreate.mockRejectedValue(new Anthropic.APIConnectionTimeoutError());

    const { tailorResume, TailoringError } = await import("../claude");
    await expect(tailorResume(profileFixture, jobDescriptionFixture)).rejects.toThrow(TailoringError);
  });

  it("includes a no-hallucination instruction in the system prompt", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify(validResumeOutput) }],
    });

    const { tailorResume } = await import("../claude");
    await tailorResume(profileFixture, jobDescriptionFixture);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system.toLowerCase()).toMatch(/only|never invent|do not invent/);
  });
});
