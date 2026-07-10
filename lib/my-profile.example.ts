import type { ProfileData } from "@/lib/types";

// Copy this file to lib/my-profile.ts and replace every field with your own
// real data. lib/my-profile.ts is gitignored — it never gets committed.
const myProfile: ProfileData = {
  name: "Jordan Example",
  headline: "Computer Science Graduate | Full-Stack Development | Cloud Systems",
  location: "Springfield, IL, USA",
  summary:
    "Recent Computer Science graduate interested in backend systems and developer tooling. Enjoys building small, focused tools that solve real problems.",
  experience: [
    {
      company: "Example University — Department of Computer Science",
      title: "Undergraduate Research Assistant",
      startDate: "2024-09",
      endDate: "2025-05",
      location: "Springfield, IL, USA",
      bullets: [
        "Built a data pipeline to process and validate research survey exports",
        "Wrote unit tests covering the core parsing logic, raising coverage from 40% to 85%",
      ],
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
  skills: ["Python", "TypeScript", "React", "SQL", "Git"],
  projects: [
    {
      name: "Sample Project",
      role: "Solo developer",
      description: "A small side project demonstrating a full-stack feature.",
      bullets: ["Implemented the core feature end-to-end", "Deployed and documented the project"],
      technologies: ["Next.js", "PostgreSQL"],
    },
  ],
  certifications: [],
  contact: {
    email: "jordan.example@email.com",
    phone: "+1 555-0100",
    location: "Springfield, IL, USA",
    website: "https://example.com",
    linkedin: "https://www.linkedin.com/in/jordan-example",
  },
};

export default myProfile;
