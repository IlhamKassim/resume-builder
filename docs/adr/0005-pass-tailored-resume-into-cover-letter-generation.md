# Pass the tailored resume into cover letter generation

Status: accepted

`generateCoverLetter` only ever received the full raw `ProfileData`, never the actual `ResumeData` that had just been tailored for the same application. `COVER_LETTER_TASK_INSTRUCTIONS` rule 2 says "never repeat resume bullets" — but the model had no way to know what was actually on the resume, since resume experience/project selection varies per generation and per job description. The rule was unenforceable, just aspirational.

Found in practice on a real application: a resume was tailored, then a cover letter was generated referencing a project. The resume's project selection was then manually revised to swap in a different project — the *same one* the cover letter had used as its main supporting evidence, since it was now a stronger fit for the role. The two documents became redundant, and regenerating the cover letter blind wouldn't reliably fix it, since the model had no signal telling it that project was now spoken for.

Fixed by adding an optional third parameter to `generateCoverLetter(profile, jobDescription, resume?)`. When a resume is passed, its experience titles/companies and project names are listed in the prompt as a "content already shown on this resume, do not repeat" block, and rule 2 was extended to reference it explicitly. Optional and backward-compatible: existing calls (tests, any future direct `lib/claude.ts` usage without a resume in hand) still work unchanged.

**Wired through:** `CoverLetterRequestSchema` (`lib/types.ts`) gained an optional `resume` field, `app/api/cover-letter/route.ts` passes it through, and `app/preview/page.tsx` sends the current `resumeData` state on every cover letter generation (it's always available by then, since the resume is generated first).

**Consequence:** the cover letter prompt is now coupled to whatever resume happens to be in the browser's session state at generation time. If a user regenerates just the resume after already generating a cover letter, the cover letter is now stale relative to the new resume selection and won't auto-refresh — regenerating the cover letter afterward is still a manual step.
