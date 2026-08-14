import { z } from "zod";
import { CoverLetterDataSchema, ResumeDataSchema } from "@/lib/types";

export const ApplicationStatusSchema = z.enum([
  "saved",
  "applied",
  "phone-screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);

export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  "phone-screen": "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  "saved",
  "applied",
  "phone-screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

// `FidelityViolation` in @/lib/fidelity-check is a plain TS interface, not a Zod schema,
// so define a matching local schema rather than importing one.
const FidelityViolationSchema = z.object({
  category: z.string(),
  message: z.string(),
});

export const ApplicationSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  role: z.string().min(1),
  url: z.string().url().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  status: ApplicationStatusSchema.default("saved"),
  jobDescription: z.string().default(""),
  appliedDate: z.string().optional(),
  lastContactDate: z.string().optional(),
  notes: z.string().optional(),
  resume: ResumeDataSchema.optional(),
  coverLetter: CoverLetterDataSchema.optional(),
  fidelityWarnings: z.array(FidelityViolationSchema).optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type Application = z.infer<typeof ApplicationSchema>;

export const ApplicationUpdateSchema = ApplicationSchema.pick({
  company: true,
  role: true,
  url: true,
  location: true,
  country: true,
  status: true,
  jobDescription: true,
  appliedDate: true,
  lastContactDate: true,
  notes: true,
  resume: true,
  coverLetter: true,
  fidelityWarnings: true,
}).partial();

export const ApplicationCreateSchema = ApplicationUpdateSchema.required({
  company: true,
  role: true,
});
