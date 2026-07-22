# Market-aware resume length via prompt inference, not a UI toggle

Status: accepted

Research into resume norms by region (deep-research pass, 2026-07-22) found that the strict one-page,
3-entry limit `RESUME_TASK_INSTRUCTIONS` enforces is a US/UK new-grad convention, not a universal one:
Singapore and Malaysia banking/graduate-programme resumes commonly run 1–2 pages even for fresh
graduates. Since this app's stated job-search scope is explicitly Malaysia, Singapore, and UK
(not US), the previous hard one-page cap was likely under-serving the banking/graduate-programme
track specifically.

**Decision:** extend `RESUME_TASK_INSTRUCTIONS` with a `MARKET-AWARE LENGTH` rule that mirrors the
existing `MARKET-AWARE TONE` rule already used for cover letters (rule 11 in
`COVER_LETTER_TASK_INSTRUCTIONS`): the model infers the target market directly from signals in the
pasted job posting itself (employer name, "Berhad", "GLC", "graduate programme", MY/SG location,
banking/finance sector language) and allows up to 5 experience entries / 3 projects / two pages when
detected, defaulting back to the strict one-page/3-entry limit otherwise. `ResumeDataSchema`'s
experience array max was relaxed from 3 to 5 to accommodate this (see `lib/types.ts`).

**Considered and rejected:**
- An explicit UI toggle/dropdown for the user to pick target region before generating. Rejected in
  favor of the inference approach because it required no new UI, schema field, or wiring, and this
  app already has a working, established pattern for exactly this kind of regional calibration
  (the cover-letter tone rule) — adding a second, inconsistent mechanism (manual for length,
  automatic for tone) for the same underlying "which market is this for" question would be a worse
  architecture than extending the one that already exists.

**Consequences:** this is inference, not a guarantee — an ambiguous job posting (e.g. a US company's
Malaysia office with no explicit MY/SG signals) could be misclassified with no manual override
available. If this proves unreliable in practice, the fallback is either sharpening the signal list
in the rule (cheap) or introducing an explicit UI control (see rejected option above) as a genuine
architecture change, not a quick fix.
