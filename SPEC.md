# Resume Builder — Spec

> Note: this spec described a LinkedIn-URL-scraping design in v1 planning. That approach was
> dropped early (see commit `ad223f4`) in favor of a hardcoded profile file — scraping added
> fragility (LinkedIn blocks scrapers, HTML structure changes) for a tool with exactly one user.
> This doc reflects what was actually built.

## 1. Objective

A personal web tool that takes your profile data and a target job description, then outputs a tailored, industry-formatted resume PDF — with zero manual editing required.

**Primary user:** You (personal use)

**The problem it solves:**
- Manually tailoring resumes for each job is slow
- AI tools hallucinate experience or invent bullet points
- Online resume builders break formatting

**The bar for success:** Paste a job description → download a PDF → send it. No edits.

**Non-negotiable accuracy constraint:** The AI may only use real data from your profile. It must never invent, embellish, or infer experience that isn't explicitly in your profile.

---

## 2. Core Features (shipped)

### F1 — Profile Data
- Profile data lives in `lib/my-profile.ts`, a gitignored local file matching the `ProfileData` Zod schema (`lib/types.ts`)
- No scraping, no upload flow — you edit the file directly when your real profile changes
- `lib/my-profile.example.ts` is the committed template: copy it to `lib/my-profile.ts` and fill in your own data
- `scripts/check-profile-fidelity.ts` checks generated output against the profile for verbatim-field violations (job titles, locations, dates)

### F2 — Job Description Input
- Simple text area to paste a job description
- No parsing required — raw text is passed to the AI

### F3 — AI-Powered Tailoring
- Claude API receives: structured profile data + raw job description
- Output: a tailored resume structured as JSON (not raw prose), plus an optional cover letter (`app/api/cover-letter/route.ts`)
- Strict prompt constraint: only use facts present in the profile, never invent; locations/dates/titles copied verbatim
- Relevance ranking: surface the most relevant experience, skills, and projects for the specific role
- Tone: professional, concise, no em dashes or semicolons (recruiters/ATS tools flag them as AI-writing tells)

### F4 — Resume PDF Generation
- No PDF-rendering library — the browser preview *is* the resume, printed via `window.print()`, so preview and download are always pixel-identical
- Sections: Contact, Summary, Experience, Education, Skills, Projects (only populated sections shown)

### F5 — Preview + Light Editing
- Live preview of the rendered resume before "download" (print)
- Click-to-edit text in the preview (`components/editable.ts`) — a bad AI phrase gets fixed by hand instead of a full re-run

### F6 — Cost Tracking
- Every Claude call is logged to `usage-log.jsonl` (gitignored) with token counts and cost
- `app/api/usage/route.ts` + `scripts/log-topup.ts` / `log-adjustment.ts` track running balance against manual top-ups

---

## 3. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 (App Router) | |
| Language | TypeScript | Type safety for resume data structures |
| Styling | Tailwind CSS + shadcn/ui | Clean UI fast, consistent design system |
| AI | Claude API (`claude-sonnet-5`, see `docs/adr/0002-...md`) | Best accuracy for structured output, won't hallucinate |
| PDF | `window.print()` on the live preview | No rendering library needed; preview and output can't drift apart |
| Profile source | Hardcoded local file (`lib/my-profile.ts`, gitignored) | Single user, no scraping fragility — see `docs/adr/0003-...md` |

---

## 4. Project Structure

```
resume-builder/
├── app/
│   ├── page.tsx                  # Main UI: job description input
│   ├── preview/page.tsx          # Resume + cover-letter preview, click-to-edit, print
│   ├── jobs/page.tsx             # Curated static list of job listings (lib/job-listings.ts)
│   └── api/
│       ├── tailor/route.ts       # Claude API: tailor resume to job
│       ├── cover-letter/route.ts # Claude API: generate cover letter
│       └── usage/route.ts        # Cost/balance tracking
├── components/
│   ├── JobDescriptionInput.tsx
│   ├── ResumePreview.tsx
│   ├── CoverLetterPreview.tsx
│   └── editable.ts               # Click-to-edit helper
├── lib/
│   ├── my-profile.ts             # Real profile data — gitignored, not in repo
│   ├── my-profile.example.ts     # Fake placeholder, committed
│   ├── claude.ts                 # Claude API client + prompts
│   ├── fidelity-check.ts         # Generated-output-vs-profile fidelity check
│   ├── types.ts                  # ResumeData, ProfileData, etc.
│   ├── job-listings.ts           # Static data for /jobs
│   ├── pricing.ts                # Pricing formula + staleness check (pure, no fs)
│   └── usage-log.ts              # Cost tracking (persistence; pricing math lives in pricing.ts)
├── scripts/
│   └── check-profile-fidelity.ts # Verbatim-field fidelity check
├── docs/adr/                     # Architecture decisions
└── SPEC.md
```

---

## 5. Code Style

- TypeScript strict mode — no `any`
- Zod for validating all external data (Claude JSON responses)
- Named exports only — no default exports except Next.js pages/routes and the profile module
- Route handlers for all AI calls — never expose API keys to the client
- Error messages must be user-facing and actionable (not "something went wrong")
- No comments explaining what code does — only why, when non-obvious

---

## 6. Testing Strategy

| Type | What gets tested | Tool |
|------|-----------------|------|
| Unit | Zod schemas, resume data transforms | Vitest |
| Fidelity | Generated output vs. profile verbatim fields (titles, locations, dates) | `scripts/check-profile-fidelity.ts` |

**Accuracy test (manual):** After each change to the Claude prompt, run it against your real profile + a few real job descriptions and verify no hallucinated facts.

---

## 7. Boundaries

**Always:**
- Validate Claude's JSON output against a Zod schema before rendering — never trust raw AI output
- Keep `lib/my-profile.ts` out of git — real contact info and work history never get committed
- Run all AI calls server-side — never expose API keys to the browser

**Ask first:**
- Any change to the resume template layout (affects every generated resume)
- Deploying this app live (see `docs/adr/0003-...md` — `myProfile` is currently bundled client-side, which is fine for local-only use but not for a public deployment)

**Never:**
- Generate or include experience, skills, or achievements not present in the source profile
- Commit `lib/my-profile.ts`, `Profile.csv`, or any LinkedIn export to git
