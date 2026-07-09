# Migrate to Sonnet 5 despite a post-intro price increase

Status: accepted, revisit before 2026-08-31

Migrated `ANTHROPIC_MODEL` from `claude-sonnet-4-6` to `claude-sonnet-5`. Measured on identical input: Sonnet 5's tokenizer counts ~43% more tokens for the same profile+prompt content (8,000 vs 5,575 cached tokens), and its list price ($3/$15 per million) is identical to Sonnet 4.6's. Under list pricing this migration would be a net ~30% cost *increase*, not a saving.

The decision to migrate anyway rests entirely on Sonnet 5's **introductory pricing** ($2/$10 per million, in effect through 2026-08-31), which brings the same call to ~13.5% cheaper than staying on 4.6. This is a temporary window, not a durable win.

Also found during testing: Sonnet 5 defaults to adaptive thinking *on* when the `thinking` param is omitted (Sonnet 4.6 effectively ran without it). A naive model-string swap silently truncated resume output (thinking consumed 2,716 of the 4,096-token budget, leaving too little room for the JSON body, `stop_reason: "max_tokens"`). Fixed by explicitly setting `thinking: { type: "disabled" }` on every call — required for correctness, not just cost.

**Consequence, needs a human to act on it:** the pricing constants in `lib/usage-log.ts` and `app/page.tsx` are hardcoded to the intro rate. After 2026-08-31, either revert `ANTHROPIC_MODEL` back to `claude-sonnet-4-6` (cheaper at that point) or update the pricing constants to Sonnet 5's list rate — otherwise cost/balance tracking silently drifts wrong. Nothing in the code enforces this; it's a calendar reminder, not a safeguard.
