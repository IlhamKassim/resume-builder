# Resume Builder — Implementation Plan

> Historical planning doc (v1). The LinkedIn-scraping pipeline in Slice 3 was scrapped early
> (commit `ad223f4`) in favor of a hardcoded local profile file. Slice 5 (PDF) shipped as
> `window.print()` on the live preview instead of a separate render pipeline. See `SPEC.md`
> and `docs/adr/0003-...md` for what actually shipped and why.

## Dependency Graph (as built)

```
[1] Project Scaffold
        ↓
[2] Type Definitions (ProfileData, ResumeData, CoverLetterData)
        ↓
   ┌────┴────┐
[3] Hardcoded  [4] Claude Tailoring +
   Profile        Cover Letter Pipeline
   └────┬────┘
        ↓
[5] Preview + window.print() (no PDF render pipeline)
        ↓
[6] End-to-End UI (wire all pipelines)
        ↓
[7] Cost Tracking
        ↓
[8] Error Handling + Fallbacks
```

Each slice is a vertical cut — working code from input to output. No horizontal layers (don't build all APIs then all UI).

---

## Slices

### Slice 1 — Project Scaffold
**Goal:** A running Next.js app you can open in a browser.

**Tasks:**
- Initialise Next.js (App Router) with TypeScript strict mode
- Install and configure Tailwind CSS + shadcn/ui
- Install dependencies: `@anthropic-ai/sdk`, `zod`
- Set up `.env.local` with `ANTHROPIC_API_KEY` placeholder

**Acceptance criteria:**
- [x] `npm run dev` runs without errors
- [x] `npm run build` compiles without errors
- [x] TypeScript strict mode on (`strict: true` in tsconfig)

---

### Slice 2 — Type Definitions
**Goal:** Shared data contracts every other slice depends on.

**Tasks:**
- Define `ProfileData`, `ResumeData`, `TailorRequest`, `CoverLetterData` types in `lib/types.ts`
- Validate all types with Zod schemas

**Acceptance criteria:**
- [x] `lib/types.ts` exports all types
- [x] Zod schemas parse valid fixtures without errors
- [x] Zod schemas reject invalid fixtures with actionable error messages
- [x] Unit tests pass for schema validation

---

### Slice 3 — Profile Data (hardcoded, not scraped)
**Goal:** A `ProfileData`-shaped source of truth, without the fragility of scraping a single external site for a single-user tool.

**Tasks:**
- Define `lib/my-profile.ts` matching `ProfileDataSchema` — kept out of git via `.gitignore`
- Commit `lib/my-profile.example.ts` as a fake placeholder so the repo is still buildable-in-shape for anyone reading the code
- Build `scripts/check-profile-fidelity.ts` to catch cases where generated output paraphrases a field that must be copied verbatim (job titles, locations, dates)

**Acceptance criteria:**
- [x] `lib/my-profile.ts` (real, local-only) satisfies `ProfileDataSchema`
- [x] `lib/my-profile.example.ts` (fake, committed) satisfies `ProfileDataSchema`
- [x] `npm run check:fidelity` flags verbatim-field mismatches

---

### ✅ Checkpoint A — Data layer is solid
Before continuing: manually verify the parsed profile output matches your actual resume content. Fix any gaps before building the AI layer on top.

---

### Slice 4 — Claude Tailoring + Cover Letter Pipeline
**Goal:** `ProfileData` + job description in → tailored `ResumeData` and `CoverLetterData` JSON out.

**Tasks:**
- Build `lib/claude.ts` — Anthropic SDK client + tailoring prompts
- Prompt must explicitly instruct Claude: only use facts from the provided profile, never invent; copy locations/dates/titles verbatim
- Claude output must be valid JSON matching the `ResumeData` / `CoverLetterData` schema
- Build `app/api/tailor/route.ts` and `app/api/cover-letter/route.ts` — validate input + output with Zod
- Share a `CORE_RULES` prompt block across both calls so Anthropic's prompt cache is reused instead of re-paying full cache-write cost per call (`docs/adr/0001-...md`)
- Ban em dashes and semicolons from generated text (ATS/recruiter AI-writing tells)

**Acceptance criteria:**
- [x] `POST /api/tailor` and `POST /api/cover-letter` return valid JSON matching their schemas
- [x] Zod validation rejects malformed Claude output before it reaches the UI
- [x] Manual accuracy test: run against real job descriptions, verify zero hallucinated facts
- [x] `ANTHROPIC_API_KEY` is never referenced in any client-side file

---

### ✅ Checkpoint B — AI output is trustworthy
Before continuing: run the manual accuracy test. If Claude invents any fact not in the profile, fix the prompt now.

---

### Slice 5 — Preview + Print (no PDF render pipeline)
**Goal:** `ResumeData` in → a document you'd actually send, with zero drift between what you see and what you download.

**Tasks:**
- Build `components/ResumePreview.tsx` / `components/CoverLetterPreview.tsx` as the literal document, styled for print
- `window.print()` on `app/preview/page.tsx` instead of a separate PDF-rendering library — the preview *is* the PDF source
- Only render sections that have data (no empty sections)
- Click-to-edit (`components/editable.ts`) so a bad AI phrase gets a manual fix instead of a full re-run

**Acceptance criteria:**
- [x] Print output matches the on-screen preview exactly
- [x] Empty sections are not rendered
- [x] Edited text persists through to the printed output

---

### Slice 6 — End-to-End UI
**Goal:** A complete flow from job description input to a document ready to send.

**Tasks:**
- Build `app/page.tsx` — job description textarea + "Generate" button
- Build `app/preview/page.tsx` — resume/cover-letter preview, click-to-edit, print
- Wire: job description → `/api/tailor` (+ optionally `/api/cover-letter`) → sessionStorage → preview
- Loading states for each async step

**Acceptance criteria:**
- [x] Full flow works end-to-end: job description → preview → print
- [x] Each step shows a loading indicator while waiting
- [x] Resume/cover-letter data persists in sessionStorage across the two pages
- [x] Preview renders all populated sections

---

### ✅ Checkpoint C — Golden path works ✅
Run the full flow with a real job description. Verify the printed output is accurate, well-formatted, and you would send it without editing.

---

### Slice 7 — Cost Tracking (added, not in original plan)
**Goal:** Know what each generation costs and track it against a running balance.

**Tasks:**
- `lib/usage-log.ts` — log every Claude call's token counts and cost to `usage-log.jsonl` (gitignored)
- `app/api/usage/route.ts` — expose running balance to the UI
- `scripts/log-topup.ts`, `scripts/log-adjustment.ts` — manual balance bookkeeping

**Acceptance criteria:**
- [x] Every Claude call appends a log entry
- [x] Balance reflects top-ups minus logged spend

---

### Slice 8 — Error Handling + Fallbacks
**Goal:** Every failure mode has a clear, actionable user-facing message.

**Tasks:**
- Claude API error (rate limit, timeout) → show retry message
- Zod validation failure on Claude output → show "generation failed, try again" with retry
- Network error mid-flow → preserve entered data, allow retry without re-entering
- All error states are visible in the UI (no silent failures)

**Acceptance criteria:**
- [ ] Simulate Claude timeout: UI shows actionable error, data is preserved
- [ ] No unhandled promise rejections in the browser console during any error scenario
- [ ] All error messages are user-facing (no raw stack traces, no "undefined" errors)

---

## Definition of Done (per slice)

- All acceptance criteria checked
- No TypeScript errors (`npm run build` clean)
- Relevant tests pass
- No hardcoded secrets or API keys
- Manual smoke test completed

## Out of Scope

- Editing UI beyond click-to-edit text fixes
- Multi-user / auth
- Job application tracking
- Custom template design
- Database persistence
- Live public deployment (would require moving `myProfile` behind a server boundary first — see `docs/adr/0003-...md`)
