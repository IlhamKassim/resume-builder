/**
 * Records a manual balance correction — e.g. spend that happened outside the
 * normal logUsage() path (a raw API call made while debugging, bypassing
 * lib/claude.ts). Amount is a signed dollar delta: negative reduces the
 * estimated balance, positive increases it.
 *   npm run log-adjustment -- -0.08 "3 untracked test calls during Sonnet 5 diagnosis"
 */
import { logAdjustment } from "../lib/usage-log";

const [amountArg, ...noteParts] = process.argv.slice(2);
const amount = Number(amountArg);
const note = noteParts.join(" ");

if (!amountArg || Number.isNaN(amount) || !note) {
  console.error('Usage: npm run log-adjustment -- <signed amount> "note (required)"');
  process.exit(1);
}

logAdjustment(amount, note).then(() => {
  console.log(`Logged a $${amount.toFixed(4)} adjustment (${note}).`);
});
