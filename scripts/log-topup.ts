/**
 * Records a real-world Anthropic Console credit top-up so the app can estimate
 * a running balance (sum of topups - sum of logged generation costs).
 *
 * Anthropic's API has no endpoint for remaining prepaid balance — this is a
 * local estimate, not authoritative. Run after adding credits in the Console:
 *   npm run log-topup -- 10
 *   npm run log-topup -- 10 "auto-reload"
 */
import { logTopup } from "../lib/usage-log";

const [amountArg, ...noteParts] = process.argv.slice(2);
const amount = Number(amountArg);

if (!amountArg || Number.isNaN(amount) || amount <= 0) {
  console.error('Usage: npm run log-topup -- <amount> ["note"]');
  process.exit(1);
}

const note = noteParts.join(" ") || undefined;

logTopup(amount, note).then(() => {
  console.log(`Logged a $${amount.toFixed(2)} top-up${note ? ` (${note})` : ""}.`);
});
