import { readFile, writeFile } from "fs/promises";
import path from "path";
import {
  JobDossierSchema,
  jobListings,
  jobListingsCompiledOn,
  type JobDossier,
} from "@/lib/job-listings";

const STORE_PATH = path.join(process.cwd(), "job-listings.json");

const SEED: JobDossier = { compiledOn: jobListingsCompiledOn, countries: jobListings };

export async function readDossier(): Promise<JobDossier> {
  let raw: string;
  try {
    raw = await readFile(STORE_PATH, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return SEED;
    throw err;
  }

  const parsed = JobDossierSchema.safeParse(JSON.parse(raw));
  // A hand-edited or corrupted store file should degrade to the seed rather than crash the page.
  return parsed.success ? parsed.data : SEED;
}

export async function writeDossier(dossier: JobDossier): Promise<void> {
  await writeFile(STORE_PATH, JSON.stringify(dossier, null, 2), "utf8");
}
