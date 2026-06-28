# Resume Builder — Task List

## Slice 1 — Project Scaffold ✅
- [x] Init Next.js 14 (App Router) + TypeScript strict mode
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Install dependencies: `@anthropic-ai/sdk`, `@react-pdf/renderer`, `cheerio`, `zod`
- [x] Add `.env.local` with `ANTHROPIC_API_KEY` placeholder
- [x] Smoke test: `npm run build` passes clean, shadcn/ui Button renders

## Slice 2 — Type Definitions ✅
- [x] Define `ProfileData`, `ResumeData`, `TailorRequest` in `lib/types.ts`
- [x] Write Zod schemas for all three types
- [x] Unit tests: schemas accept valid fixtures, reject invalid ones (15 tests)

## Slice 3 — LinkedIn Profile Pipeline ✅
- [x] Build `lib/linkedin.ts` (server-side fetch + cheerio parse)
- [x] Build `app/api/profile/route.ts`
- [x] Zod-validate scrape output
- [x] Return user-facing error on scrape failure
- [x] Unit test: parser extracts correct data from fixture HTML (17 tests)

## ✅ Checkpoint A — Manually verify real LinkedIn profile data

## Slice 4 — Claude Tailoring Pipeline
- [ ] Build `lib/claude.ts` (Anthropic SDK + prompt with no-hallucination constraint)
- [ ] Build `app/api/tailor/route.ts`
- [ ] Zod-validate Claude JSON output
- [ ] Integration test: fixture profile + job description → valid `ResumeData`
- [ ] Manual accuracy test: zero hallucinated facts

## ✅ Checkpoint B — Manually verify AI output accuracy

## Slice 5 — PDF Generation
- [ ] Build `components/resume-template/Template.tsx` (react-pdf, ATS-friendly)
- [ ] Build `app/api/pdf/route.ts`
- [ ] Only render populated sections
- [ ] Snapshot tests: full resume, experience-only, no projects

## Slice 6 — End-to-End UI
- [ ] Build `app/page.tsx` (two-step input UI)
- [ ] Build `app/preview/page.tsx` (read-only preview + download)
- [ ] Build `ProfileInput.tsx`, `JobDescriptionInput.tsx`, `ResumePreview.tsx`
- [ ] Wire full flow with loading states
- [ ] Session storage for `ProfileData`

## ✅ Checkpoint C — Full golden path with real data

## Slice 7 — Error Handling + Fallbacks
- [ ] LinkedIn block → PDF upload fallback
- [ ] Claude API error → retry with data preserved
- [ ] Zod validation failure → user-facing error + retry
- [ ] No unhandled promise rejections in any error scenario
