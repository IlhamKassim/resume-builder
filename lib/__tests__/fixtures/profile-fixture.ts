import type { ProfileData } from "@/lib/types";

export const profileFixture: ProfileData = {
  name: "Mohammad Ilham bin Kassim",
  headline: "Computer Engineering Senior @ Penn State | MARA YTP Scholar | Data Structures & Algorithms | AI & Systems Programming | Leadership & Innovation",
  location: "State College, Pennsylvania, United States",
  summary:
    "I like building things that make life a little easier to navigate. Currently finishing my Computer Engineering degree at Penn State, I've found that I'm most interested in where technical systems meet community needs. From working on technical operations here at the university to experimenting with truth-checking tools, I just enjoy solving puzzles that have a real-world impact.",
  experience: [
    {
      company: "Penn State University",
      title: "Technical Operations Assistant",
      startDate: "2023-09",
      endDate: null,
      location: "State College, Pennsylvania, United States",
      bullets: [
        "Supported technical operations at the university, applying engineering and problem-solving skills to address real-world system needs",
        "Experimented with AI-driven truth-checking tools, demonstrating initiative in software development and applied AI research",
        "Collaborated within cross-functional university environments, contributing technical insight to projects with community impact",
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
    "Python Programming",
    "Data Structures & Algorithms",
    "AI & Systems Programming",
    "Problem-Solving & Analytical Thinking",
    "Technical Documentation",
    "Team Collaboration & Communication",
    "C++",
  ],
  projects: [
    {
      name: "AI Truth-Checking Tool",
      description: "Experimented with building a truth-checking tool leveraging AI techniques, focused on solving a real-world information verification problem and demonstrating applied software development skills",
      technologies: ["AI", "Python"],
    },
  ],
  contact: {
    website: "https://ilham-portfolio-yl2x.vercel.app/",
    linkedin: "https://www.linkedin.com/in/ilhamkassim",
  },
};

export const jobDescriptionFixture = `
We are looking for a Software Engineer Intern to join our team.

Requirements:
- Strong foundation in data structures and algorithms
- Experience with Python or C++
- Interest in AI and machine learning
- Strong communication and teamwork skills
- Currently pursuing a BS/MS in Computer Science or Computer Engineering

Responsibilities:
- Build and maintain software systems
- Collaborate with senior engineers
- Write clean, well-tested code
- Participate in code reviews
`;
