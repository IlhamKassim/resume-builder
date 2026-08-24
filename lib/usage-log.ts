import { appendFile, readFile } from "fs/promises";
import path from "path";
import type { TokenUsage } from "@/lib/claude";
import { estimateCost, type Provider } from "@/lib/pricing";

const LOG_PATH = path.join(process.cwd(), "usage-log.jsonl");

export interface GenerationLogEntry {
  type: "generation";
  timestamp: string;
  action: "resume" | "cover-letter" | "interview-prep" | "job-dossier";
  // Optional so old log lines written before the DeepSeek toggle existed still parse — absence
  // means "claude", the only provider that existed when those entries were written.
  provider?: Provider;
  usage: TokenUsage;
  cost: number;
}

export interface TopupLogEntry {
  type: "topup";
  timestamp: string;
  amount: number;
  note?: string;
}

/** A manual balance correction — e.g. spend that happened outside the normal logUsage() path
 * (a raw API call made while debugging, bypassing lib/claude.ts) and needs to be reconciled by
 * hand. `amount` is a signed dollar delta applied directly to the estimated balance: negative
 * reduces it (untracked spend), positive increases it (an overcorrection elsewhere, a refund). */
export interface AdjustmentLogEntry {
  type: "adjustment";
  timestamp: string;
  amount: number;
  note: string;
}

export type UsageLogEntry = GenerationLogEntry | TopupLogEntry | AdjustmentLogEntry;

async function appendEntry(entry: UsageLogEntry): Promise<void> {
  try {
    await appendFile(LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    console.error("Failed to write usage log:", err);
  }
}

export async function logUsage(
  action: GenerationLogEntry["action"],
  usage: TokenUsage,
  provider: Provider = "claude"
): Promise<void> {
  await appendEntry({
    type: "generation",
    timestamp: new Date().toISOString(),
    action,
    provider,
    usage,
    cost: estimateCost(usage, provider),
  });
}

/** Record a real-world credit top-up (e.g. after adding funds in the Anthropic Console) so the
 * app can estimate a running balance: sum(topups) - sum(generation costs). */
export async function logTopup(amount: number, note?: string): Promise<void> {
  await appendEntry({
    type: "topup",
    timestamp: new Date().toISOString(),
    amount,
    note,
  });
}

/** Record a manual balance correction — see AdjustmentLogEntry. */
export async function logAdjustment(amount: number, note: string): Promise<void> {
  await appendEntry({
    type: "adjustment",
    timestamp: new Date().toISOString(),
    amount,
    note,
  });
}

export async function readUsageLog(): Promise<UsageLogEntry[]> {
  try {
    const raw = await readFile(LOG_PATH, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as UsageLogEntry);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}
