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
      location: "State College, PA",
      bullets: [
        "Managed technical infrastructure for university operations",
        "Collaborated with cross-functional teams to deliver solutions",
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
    "Data Structures & Algorithms",
    "AI & Systems Programming",
    "Python",
    "C++",
    "Leadership",
  ],
  projects: [
    {
      name: "Truth-Checking Tool",
      description: "Experimented with automated fact-checking tools with real-world impact",
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
