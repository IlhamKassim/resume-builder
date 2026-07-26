import { NextResponse } from "next/server";
import { readUsageLog } from "@/lib/usage-log";
import { isPricingStale } from "@/lib/pricing";

export async function GET() {
  const entries = await readUsageLog();
  const generations = entries.filter((e) => e.type === "generation");
  const topups = entries.filter((e) => e.type === "topup");
  const adjustments = entries.filter((e) => e.type === "adjustment");

  const totals = generations.reduce(
    (acc, entry) => ({
      inputTokens: acc.inputTokens + entry.usage.inputTokens,
      outputTokens: acc.outputTokens + entry.usage.outputTokens,
      cacheCreationTokens: acc.cacheCreationTokens + entry.usage.cacheCreationTokens,
      cacheReadTokens: acc.cacheReadTokens + entry.usage.cacheReadTokens,
      cost: acc.cost + entry.cost,
      generations: acc.generations + 1,
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      cost: 0,
      generations: 0,
    }
  );

  const toppedUp = topups.reduce((sum, t) => sum + t.amount, 0);
  const adjusted = adjustments.reduce((sum, a) => sum + a.amount, 0);

  return NextResponse.json({
    totals,
    // Only meaningful once at least one top-up has been logged (npm run log-topup).
    balance:
      topups.length > 0
        ? { toppedUp, estimatedRemaining: toppedUp - totals.cost + adjusted }
        : null,
    pricingStale: isPricingStale(),
    entries,
  });
}
