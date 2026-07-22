# Resume Builder — Task List

> The plan below is historical (v1 planning). The LinkedIn-scraping pipeline in Slice 3 was
> scrapped early (commit `ad223f4`) in favor of a hardcoded local profile file — see `SPEC.md`
> and `docs/adr/0003-...md`. Checkmarks reflect what actually shipped, not the original tasks.

## Slice 1 — Project Scaffold ✅
- [x] Init Next.js 16 (App Router) + TypeScript strict mode
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Install dependencies: `@anthropic-ai/sdk`, `zod`
- [x] Add `.env.local` with `ANTHROPIC_API_KEY` placeholder
- [x] Smoke test: `npm run build` passes clean

## Slice 2 — Type Definitions ✅
- [x] Define `ProfileData`, `ResumeData`, `TailorRequest`, `CoverLetterData` in `lib/types.ts`
- [x] Write Zod schemas for all types
- [x] Unit tests: schemas accept valid fixtures, reject invalid ones

## Slice 3 — Profile Data (scrapped LinkedIn scraping, hardcoded instead) ✅
- [x] Define `lib/my-profile.ts` matching the `ProfileData` schema (gitignored, real data, local only)
- [x] Commit `lib/my-profile.example.ts` as the public placeholder/template
- [x] `scripts/check-profile-fidelity.ts` — verify generated output copies verbatim fields (titles, locations, dates) instead of paraphrasing

## ✅ Checkpoint A — Manually verify real profile data renders correctly

## Slice 4 — Claude Tailoring Pipeline ✅
- [x] Build `lib/claude.ts` (Anthropic SDK + prompt with no-hallucination constraint)
- [x] Build `app/api/tailor/route.ts`
- [x] Build `app/api/cover-letter/route.ts`
- [x] Shared core prompt block across resume/cover-letter calls for prompt-cache reuse (`docs/adr/0001-...md`)
- [x] Zod-validate Claude JSON output
- [x] Manual accuracy test: zero hallucinated facts, verified against real job descriptions

## ✅ Checkpoint B — Manually verify AI output accuracy

## Slice 5 — PDF Generation ✅
- [x] `window.print()` on the live preview instead of a separate render pipeline — preview and PDF are always identical
- [x] Only render populated sections

## Slice 6 — End-to-End UI ✅
- [x] Build `app/page.tsx` (job description input)
- [x] Build `app/preview/page.tsx` (preview, click-to-edit, print)
- [x] Build `JobDescriptionInput.tsx`, `ResumePreview.tsx`, `CoverLetterPreview.tsx`
- [x] Wire full flow with loading states
- [x] Session storage for resume/cover-letter data between pages

## ✅ Checkpoint C — Full golden path with real data ✅

## Slice 7 — Cost Tracking (added, not in original plan) ✅
- [x] `lib/usage-log.ts` + `usage-log.jsonl` (gitignored) — per-call token/cost logging
- [x] `app/api/usage/route.ts`, `scripts/log-topup.ts`, `scripts/log-adjustment.ts` — running balance tracking

## Slice 8 — Error Handling + Fallbacks ✅
- [x] Claude API error → retry with data preserved (`mapClaudeCallError` in `lib/claude.ts`; retry button in `app/page.tsx` preserves `lastJobDescription`)
- [x] Zod validation failure → user-facing error + retry (`TailoringError` surfaced as a 422 with a readable message, same retry path)
- [x] No unhandled promise rejections in any error scenario (`handleGenerate`'s try/catch/finally covers the full async chain)
