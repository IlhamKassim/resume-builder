import { describe, it, expect } from "vitest";
import {
  ProfileDataSchema,
  ResumeDataSchema,
  TailorRequestSchema,
} from "@/lib/types";

const validExperience = {
  company: "Acme Corp",
  title: "Software Engineer",
  startDate: "2022-01",
  endDate: "2024-06",
  bullets: ["Built features", "Reduced latency by 30%"],
  location: "Remote",
};

const validEducation = {
  school: "University of Somewhere",
  degree: "BSc",
  field: "Computer Science",
  startDate: "2018-09",
  endDate: "2022-05",
};

const validProfile = {
  name: "Jane Doe",
  headline: "Full Stack Engineer",
  location: "San Francisco, CA",
  summary: "5 years building web apps.",
  experience: [validExperience],
  education: [validEducation],
  skills: ["TypeScript", "React", "Node.js"],
  projects: [
    {
      name: "My App",
      description: "A cool app",
      url: "https://myapp.com",
      technologies: ["React"],
    },
  ],
  contact: {
    email: "jane@example.com",
    linkedin: "https://linkedin.com/in/janedoe",
  },
};

const validResumeData = {
  contact: {
    name: "Jane Doe",
    email: "jane@example.com",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/janedoe",
  },
  summary: "Tailored summary for the role.",
  experience: [validExperience],
  education: [validEducation],
  skills: [{ category: "Languages", items: ["TypeScript", "React"] }],
  projects: [
    {
      name: "My App",
      description: "A cool app",
      technologies: ["React"],
    },
  ],
};

describe("ProfileDataSchema", () => {
  it("accepts a valid profile", () => {
    const result = ProfileDataSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("accepts a profile with no projects", () => {
    const result = ProfileDataSchema.safeParse({
      ...validProfile,
      projects: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a profile with optional fields omitted", () => {
    const result = ProfileDataSchema.safeParse({
      ...validProfile,
      contact: {},
      experience: [{ ...validExperience, location: undefined }],
      projects: [{ name: "App", description: "Desc" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a profile missing required name", () => {
    const { name: _, ...withoutName } = validProfile;
    const result = ProfileDataSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  it("rejects a profile with empty name", () => {
    const result = ProfileDataSchema.safeParse({ ...validProfile, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a profile with no experience entries", () => {
    const result = ProfileDataSchema.safeParse({
      ...validProfile,
      experience: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects experience missing company", () => {
    const { company: _, ...withoutCompany } = validExperience;
    const result = ProfileDataSchema.safeParse({
      ...validProfile,
      experience: [withoutCompany],
    });
    expect(result.success).toBe(false);
  });
});

describe("ResumeDataSchema", () => {
  it("accepts valid resume data", () => {
    const result = ResumeDataSchema.safeParse(validResumeData);
    expect(result.success).toBe(true);
  });

  it("accepts resume with empty projects array", () => {
    const result = ResumeDataSchema.safeParse({
      ...validResumeData,
      projects: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects resume missing contact name", () => {
    const result = ResumeDataSchema.safeParse({
      ...validResumeData,
      contact: { email: "jane@example.com" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects resume with empty summary", () => {
    const result = ResumeDataSchema.safeParse({
      ...validResumeData,
      summary: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects resume with no experience", () => {
    const result = ResumeDataSchema.safeParse({
      ...validResumeData,
      experience: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("TailorRequestSchema", () => {
  it("accepts a valid tailor request", () => {
    const result = TailorRequestSchema.safeParse({
      profile: validProfile,
      jobDescription: "We are looking for a full stack engineer...",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a request with empty job description", () => {
    const result = TailorRequestSchema.safeParse({
      profile: validProfile,
      jobDescription: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a request missing profile", () => {
    const result = TailorRequestSchema.safeParse({
      jobDescription: "Some job",
    });
    expect(result.success).toBe(false);
  });
});
