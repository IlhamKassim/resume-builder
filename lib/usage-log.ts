import { appendFile, readFile } from "fs/promises";
import path from "path";
import type { TokenUsage } from "@/lib/claude";

const LOG_PATH = path.join(process.cwd(), "usage-log.jsonl");

// Claude Sonnet 5 INTRO pricing (per million tokens) — mirrors app/page.tsx's session estimator.
// ⚠️ Intro pricing ends 2026-08-31 — after that, list price is $3/$15 (same as Sonnet 4.6's list
// price), which combined with Sonnet 5's larger tokenizer makes it MORE expensive than staying on
// 4.6. Update these constants (and re-evaluate ANTHROPIC_MODEL in .env.local) before/at that date.
// See docs/adr/0002-migrate-to-sonnet-5-despite-post-intro-price-increase.md.
const PRICE_INPUT_PER_M = 2.0;
const PRICE_CACHE_WRITE_PER_M = 2.5; // 1.25x base
const PRICE_CACHE_READ_PER_M = 0.2; // 0.1x base
const PRICE_OUTPUT_PER_M = 10.0;

// The date these intro-rate constants stop being accurate. Checked at runtime so the drift is a
// loud, visible failure instead of a silent one — see docs/adr/0002-....md.
const PRICING_VALID_UNTIL = "2026-08-31";

/** Midnight UTC of the day immediately after `dateStr`, used as an exclusive staleness cutoff
 * so the entire documented validity date itself stays valid regardless of time-of-day precision. */
function dayAfterUTC(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/** True once today is past PRICING_VALID_UNTIL — the cost constants above are stale and need
 * updating (or ANTHROPIC_MODEL needs to be reverted to claude-sonnet-4-6). */
export function isPricingStale(now: Date = new Date()): boolean {
  return now >= dayAfterUTC(PRICING_VALID_UNTIL);
}

// Logged at most once per process so a long-lived server doesn't spam this on every estimate
// call once pricing goes stale — the first alert is enough to get attention.
let staleWarningLogged = false;

export function estimateCost(usage: TokenUsage): number {
  if (isPricingStale() && !staleWarningLogged) {
    staleWarningLogged = true;
    console.error(
      `⚠️  PRICING STALE: intro-rate constants in lib/usage-log.ts expired ${PRICING_VALID_UNTIL}. ` +
        `Cost/balance figures are now wrong. Update PRICE_* here and in app/page.tsx, or revert ` +
        `ANTHROPIC_MODEL — see docs/adr/0002-migrate-to-sonnet-5-despite-post-intro-price-increase.md.`
    );
  }
  return (
    (usage.inputTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (usage.cacheCreationTokens / 1_000_000) * PRICE_CACHE_WRITE_PER_M +
    (usage.cacheReadTokens / 1_000_000) * PRICE_CACHE_READ_PER_M +
    (usage.outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

export interface GenerationLogEntry {
  type: "generation";
  timestamp: string;
  action: "resume" | "cover-letter";
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
  usage: TokenUsage
): Promise<void> {
  await appendEntry({
    type: "generation",
    timestamp: new Date().toISOString(),
    action,
    usage,
    cost: estimateCost(usage),
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
