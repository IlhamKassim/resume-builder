import { readFile, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import {
  ApplicationCreateSchema,
  ApplicationUpdateSchema,
  type Application,
} from "@/lib/applications";

const STORE_PATH = path.join(process.cwd(), "applications.json");

export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof ApplicationUpdateSchema>;

async function readAll(): Promise<Application[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as Application[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(list: Application[]): Promise<void> {
  await writeFile(STORE_PATH, JSON.stringify(list, null, 2), "utf8");
}

export async function listApplications(): Promise<Application[]> {
  return readAll();
}

export async function getApplication(id: string): Promise<Application | null> {
  const list = await readAll();
  return list.find((app) => app.id === id) ?? null;
}

export async function createApplication(input: ApplicationCreateInput): Promise<Application> {
  const now = new Date().toISOString();
  const record: Application = {
    ...input,
    id: crypto.randomUUID(),
    status: input.status ?? "saved",
    jobDescription: input.jobDescription ?? "",
    createdAt: now,
    updatedAt: now,
  };
  const list = await readAll();
  list.push(record);
  await writeAll(list);
  return record;
}

export async function updateApplication(
  id: string,
  patch: ApplicationUpdateInput
): Promise<Application | null> {
  const list = await readAll();
  const index = list.findIndex((app) => app.id === id);
  if (index === -1) return null;
  const updated: Application = {
    ...list[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  list[index] = updated;
  await writeAll(list);
  return updated;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const list = await readAll();
  const next = list.filter((app) => app.id !== id);
  if (next.length === list.length) return false;
  await writeAll(next);
  return true;
}
