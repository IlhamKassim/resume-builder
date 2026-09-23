# Cost guardrails

## Never call the job-dossier refresh API

`POST /api/job-dossier` (`generateJobDossier` in `lib/claude/index.ts`, wired to
the "Refresh Dossier" button / `components/RefreshDossierButton.tsx`) makes a
Claude API call with web search (up to 15 searches, ~300K input tokens per
call). This runs against the owner's own pay-as-you-go Anthropic API key —
**never trigger this endpoint or call `generateJobDossier` directly**, even to
"just refresh the dossier" or test the feature.

If the job dossier needs updating (new listings, dropping applied-to
companies, fixing stale/broken links):

1. Research listings yourself — `WebSearch`/`WebFetch`, or a task handed to
   another agent/worker the user is running.
2. Verify results before writing them in: check that links are live (not
   closed/expired reqs), that `type` (`direct`/`page`/`program`) accurately
   matches what the URL actually is, and — for Singapore and the UK — that
   sponsorship is real and specific to entry-level/new-grad hiring, not just
   the company's general sponsor-license status.
3. Hand-edit `job-listings.json` at the repo root directly (it's the live,
   gitignored store read by `lib/job-dossier-store.ts`; `lib/job-listings.ts`
   holds the schema plus a hardcoded seed used only before the first refresh
   ever runs). Validate against `JobDossierSchema` before considering it done.

This same "no paid API call" rule applies to any other action in this app
that's gated behind the user's own API key for a task an agent could instead
do itself with its own tools (websearch/fetch) or hand off to another agent —
check `lib/claude/index.ts` for what's API-gated before calling it on the
user's behalf.
