# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds the Next.js App Router routes (page and layout files). Example: `src/app/(test)/test/[attemptId]/page.tsx`.
- `src/views/` contains page-level view components wired into routes.
- `src/components/` contains reusable UI pieces; `src/components/test/` is product “test” UI, not automated tests.
- `src/lib/`, `src/hooks/`, `src/contexts/`, `src/utils/`, and `src/types/` contain shared logic and typing helpers.
- `public/` stores static assets.
- `tests/` holds Playwright end-to-end specs; `playwright.config.ts` configures the runner.
- Root SQL files (`supabase-*.sql`) capture Supabase schema/migration snapshots.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the local Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` runs the production server from `.next/`.
- `npm run test:e2e` runs Playwright tests against a local dev server.
- `npm run test:e2e:ui` runs Playwright in UI mode.
- `npm run test:e2e:install` installs Playwright browsers (first-time setup).

## Coding Style & Naming Conventions
- TypeScript + React with Next.js 15 App Router.
- Use 2-space indentation and follow existing file formatting.
- Component files use `PascalCase.tsx` (e.g., `AuthPage.tsx`). Hooks use `useX` naming.
- Tailwind CSS is the primary styling system; prefer utility classes over inline styles.
- No repo-wide lint/format script is configured—match the local style in adjacent files.

## Testing Guidelines
- Playwright is the end-to-end test runner. Specs live in `tests/*.spec.ts`.
- First-time setup requires `npm run test:e2e:install` to download browsers.
- Use `PLAYWRIGHT_BASE_URL` to point tests at a deployed environment instead of running the local dev server.

## Commit & Pull Request Guidelines
- Recent commits use short, descriptive subjects; some use conventional prefixes (e.g., `chore:`). Keep messages imperative and concise.
- PRs should include: a brief summary, what was tested, and screenshots for UI changes.
- Link related issues or tasks when applicable.

## Configuration & Secrets
- Local secrets live in `.env.local` (e.g., `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Do not commit secrets. Verify OAuth redirect URLs match your local or deployed origin.

## Supabase Database Summary (User-Provided)
- Snapshot stored at `docs/db-schema-snapshot-20260125.md` (tables, columns, policies, grants, functions, RLS status, extensions).
- Public tables: attempt_questions, attempt_sections, practice_answers, practice_sessions, question_reports, questions, subjects, test_attempts, test_sections, test_templates, topics, users.
- RLS: enabled on all public tables (forcerowsecurity false).
- Triggers: none.
- Functions: admin_update_user_role, handle_new_user, submit_answer.
- Extensions: pg_graphql 1.5.11, pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1.
- Note: provided columns list omitted `topics` and `users`.
