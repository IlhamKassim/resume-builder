# Resume Builder — Implementation Plan

## Dependency Graph

```
[1] Project Scaffold
        ↓
[2] Type Definitions (ProfileData, ResumeData)
        ↓
   ┌────┴────┐
[3] LinkedIn  [4] Claude Tailoring
  Pipeline      Pipeline
   └────┬────┘
        ↓
[5] PDF Generation
        ↓
[6] End-to-End UI (wire all pipelines)
        ↓
[7] Error Handling + Fallbacks
```

Each slice is a vertical cut — working code from input to output. No horizontal layers (don't build all APIs then all UI).

---

## Slices

### Slice 1 — Project Scaffold
**Goal:** A running Next.js app you can open in a browser.

**Tasks:**
- Initialise Next.js 14 (App Router) with TypeScript strict mode
- Install and configure Tailwind CSS + shadcn/ui
- Install dependencies: `@anthropic-ai/sdk`, `@react-pdf/renderer`, `cheerio`, `zod`
- Set up `.env.local` with `ANTHROPIC_API_KEY` placeholder
- Verify: `npm run dev` opens a blank page with no TypeScript errors

**Acceptance criteria:**
- [ ] `npm run dev` runs without errors
- [ ] `npm run build` compiles without errors
- [ ] TypeScript strict mode on (`strict: true` in tsconfig)
- [ ] shadcn/ui Button renders on the home page (smoke test)

---

### Slice 2 — Type Definitions
**Goal:** Shared data contracts every other slice depends on.

**Tasks:**
- Define `ProfileData` type (name, headline, location, summary, experience[], education[], skills[], projects[])
- Define `ResumeData` type (the tailored output Claude produces — same shape, ranked/filtered)
- Define `TailorRequest` type (ProfileData + jobDescription string)
- Validate all types with Zod schemas

**Acceptance criteria:**
- [ ] `lib/types.ts` exports all three types
- [ ] Zod schemas parse valid fixtures without errors
- [ ] Zod schemas reject invalid fixtures with actionable error messages
- [ ] Unit tests pass for schema validation

---

### Slice 3 — LinkedIn Profile Pipeline
**Goal:** LinkedIn URL in → structured `ProfileData` out.

**Tasks:**
- Build `lib/linkedin.ts` — server-side fetch + cheerio parse of public LinkedIn profile
- Build `app/api/profile/route.ts` — POST handler that calls `linkedin.ts` and returns `ProfileData`
- Validate scrape output against `ProfileData` Zod schema
- Return user-facing error if profile is private or scraping is blocked

**Acceptance criteria:**
- [ ] `POST /api/profile` with a real LinkedIn URL returns valid `ProfileData` JSON
- [ ] Unit test: parser correctly extracts name, headline, 1+ job, 1+ education, skills from a fixture HTML
- [ ] Returns `{ error: "Profile is private or couldn't be fetched. Please upload your LinkedIn PDF instead." }` when scraping fails
- [ ] No LinkedIn fetching logic runs client-side

---

### ✅ Checkpoint A — Data layer is solid
Before continuing: manually hit `POST /api/profile` with your real LinkedIn URL and verify the parsed output matches your actual profile. Fix any parsing gaps before building the AI layer on top.

---

### Slice 4 — Claude Tailoring Pipeline
**Goal:** `ProfileData` + job description in → tailored `ResumeData` JSON out.

**Tasks:**
- Build `lib/claude.ts` — Anthropic SDK client + tailoring prompt
- Prompt must explicitly instruct Claude: only use facts from the provided profile, never invent
- Claude output must be valid JSON matching the `ResumeData` schema
- Build `app/api/tailor/route.ts` — POST handler, validates input + output with Zod
- Handle Claude API errors gracefully with user-facing messages

**Acceptance criteria:**
- [ ] `POST /api/tailor` with fixture `ProfileData` + job description returns valid `ResumeData` JSON
- [ ] Zod validation rejects malformed Claude output before it reaches the UI
- [ ] Integration test: fixture profile + fixture job description → `ResumeData` passes schema validation
- [ ] Manual accuracy test: run against your real LinkedIn + 2 job descriptions, verify zero hallucinated facts
- [ ] `ANTHROPIC_API_KEY` is never referenced in any client-side file

---

### ✅ Checkpoint B — AI output is trustworthy
Before continuing: run the manual accuracy test. If Claude invents any fact not in your LinkedIn profile, fix the prompt now. Do not proceed to UI until this passes.

---

### Slice 5 — PDF Generation
**Goal:** `ResumeData` in → downloadable PDF out.

**Tasks:**
- Build `components/resume-template/Template.tsx` — `@react-pdf/renderer` template
- Template sections: Contact, Summary, Experience, Education, Skills, Projects
- Only render sections that have data (no empty sections)
- ATS-friendly: no tables, no images, standard fonts (Inter or Helvetica)
- Build `app/api/pdf/route.ts` — POST handler that renders template to PDF stream
- Snapshot test: each section combination renders without errors

**Acceptance criteria:**
- [ ] `POST /api/pdf` with fixture `ResumeData` returns a valid PDF binary
- [ ] PDF opens correctly in a browser PDF viewer
- [ ] Empty sections are not rendered
- [ ] Snapshot tests pass for: full resume, experience-only, no projects
- [ ] PDF text is selectable (ATS-friendly — not an image)

---

### Slice 6 — End-to-End UI
**Goal:** A complete flow from URL input to PDF download in the browser.

**Tasks:**
- Build `app/page.tsx` — two-step UI: (1) LinkedIn URL input, (2) job description input + "Generate" button
- Build `app/preview/page.tsx` — read-only resume preview + "Download PDF" button
- Build `components/ProfileInput.tsx`, `JobDescriptionInput.tsx`, `ResumePreview.tsx`
- Wire: ProfileInput → `/api/profile` → store in sessionStorage → JobDescriptionInput → `/api/tailor` → `/api/pdf` → preview
- Loading states for each async step
- Session storage for `ProfileData` so re-generating for a new job doesn't re-fetch LinkedIn

**Acceptance criteria:**
- [ ] Full flow works end-to-end: LinkedIn URL → job description → preview → download
- [ ] Each step shows a loading indicator while waiting
- [ ] `ProfileData` persists in sessionStorage — a second job description skips the LinkedIn fetch
- [ ] Preview renders all populated sections
- [ ] "Download PDF" triggers a browser file download

---

### ✅ Checkpoint C — Golden path works
Run the full flow with your real LinkedIn profile and a real job description. Verify the downloaded PDF is accurate, well-formatted, and you would send it without editing.

---

### Slice 7 — Error Handling + Fallbacks
**Goal:** Every failure mode has a clear, actionable user-facing message.

**Tasks:**
- LinkedIn scrape fails → show upload prompt, accept LinkedIn PDF export
- Claude API error (rate limit, timeout) → show retry message
- Zod validation failure on Claude output → show "generation failed, try again" with retry
- Network error mid-flow → preserve entered data, allow retry without re-entering
- All error states are visible in the UI (no silent failures)

**Acceptance criteria:**
- [ ] Simulate LinkedIn block: upload fallback renders and parses correctly
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

## Out of Scope (v1)

- Editing UI
- Multi-user / auth
- Cover letter generation
- Job application tracking
- Custom template design
- Database persistence
