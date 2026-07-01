import { z } from "zod";

const SkillCategorySchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string()),
});

const ExperienceSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
  location: z.string().optional(),
});

const EducationSchema = z.object({
  school: z.string().min(1),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().optional(),
});

const ProjectSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  description: z.string().optional(),
  bullets: z.array(z.string()).default([]),
  url: z.string().url().optional(),
  technologies: z.array(z.string()).optional(),
});

const ContactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
});

export const ProfileDataSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  location: z.string(),
  summary: z.string(),
  experience: z.array(ExperienceSchema).min(1),
  education: z.array(EducationSchema),
  skills: z.array(z.string()),
  projects: z.array(ProjectSchema),
  certifications: z.array(z.string()).optional(),
  contact: ContactSchema,
});

export const ResumeDataSchema = z.object({
  contact: ContactSchema.extend({ name: z.string().min(1) }),
  summary: z.string().min(1),
  experience: z.array(ExperienceSchema).min(1),
  education: z.array(EducationSchema),
  skills: z.array(SkillCategorySchema),
  projects: z.array(ProjectSchema),
  certifications: z.array(z.string()).optional(),
});

export const TailorRequestSchema = z.object({
  profile: ProfileDataSchema,
  jobDescription: z.string().min(1),
});

export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type ProfileData = z.infer<typeof ProfileDataSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type TailorRequest = z.infer<typeof TailorRequestSchema>;
