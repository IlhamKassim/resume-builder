# Resume Builder — Spec

## 1. Objective

A personal web tool that ingests your LinkedIn profile data and a target job description, then outputs a tailored, industry-formatted resume PDF — with zero manual editing required.

**Primary user:** You (personal use first, designed to open to others later)

**The problem it solves:**
- Manually tailoring resumes for each job is slow
- AI tools hallucinate experience or invent bullet points
- Online resume builders break formatting

**The bar for success:** Paste a job description → download a PDF → send it. No edits.

**Non-negotiable accuracy constraint:** The AI may only use real data from your LinkedIn profile. It must never invent, embellish, or infer experience that isn't explicitly in your profile.

---

## 2. Core Features (v1)

### F1 — Profile Ingestion
- User provides a LinkedIn profile URL
- App fetches and parses public profile data (name, headline, work history, education, skills, projects)
- Parsed data is stored in session for reuse across multiple job applications
- Fallback: user can manually paste/upload a LinkedIn PDF export if scraping is blocked

### F2 — Job Description Input
- Simple text area to paste a job description
- No parsing required — raw text is passed to the AI

### F3 — AI-Powered Tailoring
- Claude API receives: structured profile data + raw job description
- Output: a tailored resume structured as JSON (not raw prose)
- Strict prompt constraint: only use facts present in the profile, never invent
- Relevance ranking: surface the most relevant experience, skills, and projects for the specific role
- Tone: professional, concise, first-person implied (no "I" — standard resume voice)

### F4 — Resume PDF Generation
- Resume rendered from the JSON output using a fixed industry-standard template
- Template: clean single-column or two-column layout, ATS-friendly (no tables, no graphics)
- Sections: Contact, Summary, Experience, Education, Skills, Projects (only populated sections shown)
- One-click PDF download

### F5 — Preview
- Live preview of the rendered resume before download
- No editing UI in v1 — preview is read-only

---

## 3. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | SSR for PDF generation, scales to product later |
| Language | TypeScript | Type safety for resume data structures |
| Styling | Tailwind CSS + shadcn/ui | Clean UI fast, consistent design system |
| AI | Claude API (`claude-sonnet-4-6`) | Best accuracy for structured output, won't hallucinate |
| PDF | `@react-pdf/renderer` | React-native PDF rendering, no headless browser needed |
| LinkedIn | Scraping via server-side fetch + cheerio | Public profile data only |

---

## 4. Project Structure

```
resume-builder/
├── app/
│   ├── page.tsx                  # Main UI: profile input + job description
│   ├── preview/page.tsx          # Resume preview + download
│   └── api/
│       ├── profile/route.ts      # Fetch + parse LinkedIn profile
│       ├── tailor/route.ts       # Claude API: tailor resume to job
│       └── pdf/route.ts          # Generate + stream PDF
├── components/
│   ├── ProfileInput.tsx
│   ├── JobDescriptionInput.tsx
│   ├── ResumePreview.tsx
│   └── resume-template/
│       └── Template.tsx          # @react-pdf/renderer template
├── lib/
│   ├── linkedin.ts               # Profile scraping + parsing
│   ├── claude.ts                 # Claude API client + prompt
│   └── types.ts                  # ResumeData, ProfileData, etc.
├── SPEC.md
└── agent-skills/
```

---

## 5. Code Style

- TypeScript strict mode — no `any`
- Zod for validating all external data (LinkedIn scrape output, Claude JSON response)
- Named exports only — no default exports except Next.js pages/routes
- Server actions / route handlers for all AI and scraping calls — never expose API keys to client
- Error messages must be user-facing and actionable (not "something went wrong")
- No comments explaining what code does — only why, when non-obvious

---

## 6. Testing Strategy

| Type | What gets tested | Tool |
|------|-----------------|------|
| Unit | LinkedIn parser, Claude prompt output schema, resume data transforms | Vitest |
| Integration | `/api/tailor` end-to-end with a fixture profile + job description | Vitest + msw |
| Snapshot | Resume template renders correctly for each section combination | @react-pdf/renderer test utils |

**Accuracy test (manual):** After each change to the Claude prompt, run it against your real LinkedIn profile + 3 real job descriptions and verify no hallucinated facts.

---

## 7. Boundaries

**Always:**
- Validate Claude's JSON output against a Zod schema before rendering — never trust raw AI output
- Run all LinkedIn fetching server-side — never expose scraping logic or API keys to the browser
- Show a clear error if LinkedIn scraping fails, with a manual-upload fallback path

**Ask first:**
- Any change to the resume template layout (affects all users in the future)
- Adding new data sources beyond LinkedIn
- Storing profile data beyond the current session (privacy implication)

**Never:**
- Generate or include experience, skills, or achievements not present in the source profile
- Store raw LinkedIn data in a database without explicit user consent
- Use client-side rendering for PDF generation (performance + key exposure risk)
- Add editing UI in v1 — if the output needs editing, the AI prompt needs fixing instead
