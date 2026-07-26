import type { ProfileData, ResumeData, Experience, Project } from "@/lib/types";

// A single, deliberately unrelated experience entry, used only in the cross-entry-mixing tests
// to prove a number from THIS entry doesn't get treated as grounded for a DIFFERENT one.
export const secondExperience: Experience = {
  company: "Globex Inc",
  title: "Intern",
  startDate: "2021-06",
  endDate: "2021-08",
  location: "Remote",
  bullets: [
    "Analyzed $50,000 in quarterly marketing spend",
    "Built a dashboard used by 200 employees",
  ],
};

export const baseExperience: Experience = {
  company: "Acme Corp",
  title: "Software Engineer",
  startDate: "2022-01",
  endDate: "2024-06",
  location: "San Francisco, CA",
  bullets: ["Reduced latency by 30% across the checkout service", "Led a team of 4 engineers"],
};

export const baseProject: Project = {
  name: "Portfolio Site",
  bullets: ["Built a personal site with 10,000 total visitors"],
  url: "https://janedoe.dev",
};

// A second project with no url in the profile — used for the "no url at all" fidelity sub-case.
export const secondProject: Project = {
  name: "Budget Tracker",
  bullets: ["Processed 500 transactions per day"],
};

export function makeProfile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    name: "Jane Doe",
    headline: "Software Engineer",
    location: "Remote",
    summary: "Builds software.",
    experience: [baseExperience],
    education: [
      {
        school: "State University",
        degree: "BSc",
        field: "Computer Science",
        startDate: "2018-09",
        endDate: "2022-05",
      },
    ],
    skills: ["Python", "TypeScript"],
    projects: [baseProject],
    certifications: ["AWS Certified Cloud Practitioner"],
    contact: { location: "Remote", email: "jane@example.com" },
    ...overrides,
  };
}

export function makeResume(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    contact: { name: "Jane Doe", location: "Remote" },
    summary: "Software engineer who reduced latency by 30% at Acme Corp.",
    experience: [baseExperience],
    education: [
      {
        school: "State University",
        degree: "BSc",
        field: "Computer Science",
        startDate: "2018-09",
        endDate: "2022-05",
      },
    ],
    skills: [{ category: "Languages", items: ["Python", "TypeScript"] }],
    projects: [baseProject],
    certifications: ["AWS Certified Cloud Practitioner"],
    ...overrides,
  };
}
