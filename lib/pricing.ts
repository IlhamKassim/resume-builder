import type { TokenUsage } from "@/lib/claude";

export type Provider = "claude" | "deepseek";

// Claude Sonnet 5 INTRO pricing (per million tokens) — the single source of truth for both the
// server-side usage log (lib/usage-log.ts) and the client-side session usage bar (app/page.tsx).
// ⚠️ Intro pricing ends 2026-08-31 — after that, list price is $3/$15 (same as Sonnet 4.6's list
// price), which combined with Sonnet 5's larger tokenizer makes it MORE expensive than staying on
// 4.6. Update these constants (and re-evaluate ANTHROPIC_MODEL in .env.local) before/at that date.
// See docs/adr/0002-migrate-to-sonnet-5-despite-post-intro-price-increase.md.
const CLAUDE_PRICE_INPUT_PER_M = 2.0;
const CLAUDE_PRICE_CACHE_WRITE_PER_M = 2.5; // 1.25x base
const CLAUDE_PRICE_CACHE_READ_PER_M = 0.2; // 0.1x base
const CLAUDE_PRICE_OUTPUT_PER_M = 10.0;

// DeepSeek v4-flash pricing (per million tokens), confirmed 2026-08-24 against
// api-docs.deepseek.com/quick_start/pricing. DeepSeek doesn't bill a separate cache-write
// premium the way Claude does (no CACHE_WRITE constant — cache misses are just billed at the
// normal input rate). Rates are ~2x higher during peak hours (01:00-04:00 and 06:00-10:00 UTC,
// Mon-Fri); this uses the flat off-peak rate as an estimate rather than checking wall-clock time,
// so cost during peak hours will read as an undercount by up to 2x — acceptable imprecision for
// a rough balance estimate, same spirit as the web-search fee undercount noted in
// lib/claude/json-call.ts.
const DEEPSEEK_PRICE_INPUT_PER_M = 0.22; // cache miss, off-peak
const DEEPSEEK_PRICE_CACHE_READ_PER_M = 0.007; // cache hit, off-peak
const DEEPSEEK_PRICE_OUTPUT_PER_M = 0.66; // off-peak

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

export function estimateCost(usage: TokenUsage, provider: Provider = "claude"): number {
  if (provider === "deepseek") {
    return (
      (usage.inputTokens / 1_000_000) * DEEPSEEK_PRICE_INPUT_PER_M +
      (usage.cacheReadTokens / 1_000_000) * DEEPSEEK_PRICE_CACHE_READ_PER_M +
      (usage.outputTokens / 1_000_000) * DEEPSEEK_PRICE_OUTPUT_PER_M
    );
  }

  if (isPricingStale() && !staleWarningLogged) {
    staleWarningLogged = true;
    console.error(
      `⚠️  PRICING STALE: intro-rate constants in lib/pricing.ts expired ${PRICING_VALID_UNTIL}. ` +
        `Cost/balance figures are now wrong. Update PRICE_* here, or revert ANTHROPIC_MODEL — see ` +
        `docs/adr/0002-migrate-to-sonnet-5-despite-post-intro-price-increase.md.`
    );
  }
  return (
    (usage.inputTokens / 1_000_000) * CLAUDE_PRICE_INPUT_PER_M +
    (usage.cacheCreationTokens / 1_000_000) * CLAUDE_PRICE_CACHE_WRITE_PER_M +
    (usage.cacheReadTokens / 1_000_000) * CLAUDE_PRICE_CACHE_READ_PER_M +
    (usage.outputTokens / 1_000_000) * CLAUDE_PRICE_OUTPUT_PER_M
  );
}
