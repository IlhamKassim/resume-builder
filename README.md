# Resume Builder

A personal AI-powered resume builder that takes a hardcoded LinkedIn profile and a pasted job description, then outputs a tailored, ATS-friendly one-page PDF — with zero manual editing.

## How it works

1. Paste a job description into the textarea
2. Click **Generate Resume**
3. Review the preview and click **Save as PDF**

The app uses Claude (`claude-sonnet-4-6`) to select and tailor the most relevant experience, projects, skills, and certifications from your profile for each specific role. The PDF is generated via `window.print()` so the preview and the download are always identical.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Anthropic SDK (`@anthropic-ai/sdk`)
- Zod for schema validation
- Vitest for testing

## Running locally

```bash
npm install
npm run dev
```

Requires an `ANTHROPIC_API_KEY` in `.env.local`.
