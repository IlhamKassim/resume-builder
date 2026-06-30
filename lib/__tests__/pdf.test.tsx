import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types";
import { ResumeTemplate } from "@/components/resume-template/Template";

function render(data: ResumeData) {
  return renderToBuffer(createElement(ResumeTemplate, { data }) as ReactElement<DocumentProps>);
}

const fullResume: ResumeData = {
  contact: {
    name: "Mohammad Ilham bin Kassim",
    email: "ilham@example.com",
    location: "State College, PA",
    linkedin: "https://linkedin.com/in/ilhamkassim",
    website: "https://ilham-portfolio-yl2x.vercel.app/",
  },
  summary:
    "Computer Engineering senior at Penn State with a strong foundation in data structures, algorithms, and AI systems programming.",
  experience: [
    {
      company: "Penn State University",
      title: "Technical Operations Assistant",
      startDate: "2023-09",
      endDate: null,
      location: "State College, PA",
      bullets: [
        "Technical Support: Managed technical infrastructure supporting university operations.",
        "Collaboration: Worked with cross-functional teams to deliver impactful solutions.",
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
    { category: "Languages", items: ["Python", "C++", "JavaScript"] },
    { category: "Core CS", items: ["Data Structures & Algorithms", "AI & Systems Programming"] },
  ],
  projects: [
    {
      name: "Truth-Checking Tool",
      role: "Developer",
      bullets: [
        "AI Integration: Built an automated fact-checking tool with real-world impact.",
      ],
    },
  ],
};

const noProjectsResume: ResumeData = { ...fullResume, projects: [] };
const noSummaryResume: ResumeData = { ...fullResume, summary: "x", projects: [] };

describe("ResumeTemplate", () => {
  it("renders a non-empty PDF buffer for a full resume", async () => {
    const buffer = await render(fullResume);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("renders without error when projects array is empty", async () => {
    await expect(render(noProjectsResume)).resolves.toBeInstanceOf(Buffer);
  });

  it("renders without error for minimal resume (no projects)", async () => {
    await expect(render(noSummaryResume)).resolves.toBeInstanceOf(Buffer);
  });

  it("produces a valid PDF (starts with PDF magic bytes)", async () => {
    const buffer = await render(fullResume);
    const header = buffer.slice(0, 4).toString("ascii");
    expect(header).toBe("%PDF");
  });
});
