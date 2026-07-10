# Gitignore the real profile, keep the prompts public

Status: accepted

Before sharing this repo publicly (portfolio link on LinkedIn), `lib/my-profile.ts` was removed from git tracking and added to `.gitignore`; a fake `lib/my-profile.example.ts` is committed in its place. The real file still exists locally and the app runs exactly as before — only the public repo changes.

This was a deliberate split: the profile data (name, phone, email, work history) is personal and not the point of the portfolio, so it's gone. The Claude prompt engineering in `lib/claude.ts` (no-hallucination rules, shared-core-prompt caching from ADR-0001) stays fully visible, since that's the actual engineering being shown off. A side effect: cloning the repo now yields a non-functional skeleton (no `lib/my-profile.ts` to import) rather than a ready-to-run tool — intentional, not an oversight.

**Not done:** git history was left as-is. Commits back to `ad223f4` still contain the real phone number, email, and full work history in plaintext, recoverable via `git log -p -- lib/my-profile.ts`. Rewriting history (e.g. `git filter-repo`) was considered and explicitly declined.

**Consequence, needs revisiting if this ever changes:** `app/page.tsx` and `app/preview/page.tsx` are Client Components that import `myProfile` directly, so its contents are bundled into client-side JS and sent over `fetch`. That's fine for local-only use (no live deployment exists). If this app is ever deployed publicly, `myProfile` must be moved behind a server-only boundary (a route handler or Server Component) before deploying — otherwise contact info ships to every visitor's browser regardless of what's in the git repo.
