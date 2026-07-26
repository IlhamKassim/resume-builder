import { describe, it, expect } from "vitest";
import { estimateCost, isPricingStale } from "@/lib/pricing";

describe("estimateCost", () => {
  it("prices input tokens at $2 per million", () => {
    const cost = estimateCost({
      inputTokens: 1_000_000,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
    });
    expect(cost).toBeCloseTo(2.0, 6);
  });

  it("prices output tokens at $10 per million", () => {
    const cost = estimateCost({
      inputTokens: 0,
      outputTokens: 1_000_000,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
    });
    expect(cost).toBeCloseTo(10.0, 6);
  });

  it("prices cache-write tokens at $2.50 per million (1.25x base)", () => {
    const cost = estimateCost({
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 1_000_000,
      cacheReadTokens: 0,
    });
    expect(cost).toBeCloseTo(2.5, 6);
  });

  it("prices cache-read tokens at $0.20 per million (0.1x base)", () => {
    const cost = estimateCost({
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(0.2, 6);
  });

  it("sums all four token types for a real mixed-usage call", () => {
    const cost = estimateCost({
      inputTokens: 500,
      outputTokens: 300,
      cacheCreationTokens: 4_000,
      cacheReadTokens: 8_000,
    });
    const expected =
      (500 / 1_000_000) * 2.0 +
      (300 / 1_000_000) * 10.0 +
      (4_000 / 1_000_000) * 2.5 +
      (8_000 / 1_000_000) * 0.2;
    expect(cost).toBeCloseTo(expected, 10);
  });
});

describe("isPricingStale", () => {
  it("is not stale on the documented validity date itself", () => {
    expect(isPricingStale(new Date("2026-08-31T23:59:59Z"))).toBe(false);
  });

  it("is not stale the day before the validity date", () => {
    expect(isPricingStale(new Date("2026-08-30T00:00:00Z"))).toBe(false);
  });

  it("is stale the day after the validity date", () => {
    expect(isPricingStale(new Date("2026-09-01T00:00:00Z"))).toBe(true);
  });
});
