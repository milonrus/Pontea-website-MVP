# Pontea

> **Note**: This is the **main branch** containing the MVP landing page. For the full educational platform, see the [develop branch](https://github.com/milonrus/Pontea-website-MVP/tree/develop).

Pontea MVP is a minimal landing page built with Next.js 15, React 19, TypeScript, and Tailwind CSS. This branch contains only the public-facing marketing pages without authentication or database dependencies.

## Branch Strategy

This repository uses a **branch-based deployment approach**:

- **`main` branch** (you are here) → Production landing page at `pontea.com`
  - Landing page with hero, features, pricing
  - Methodology page explaining the exam prep approach
  - Consultation booking page for lead capture
  - No authentication, no database, minimal dependencies

- **`develop` branch** → Full platform at `pontea-dev.vercel.app`
  - Complete educational platform with auth, tests, admin dashboard
  - Student practice sessions and timed tests
  - Question management and bulk imports
  - Supabase backend for data and authentication

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

## Features (Main Branch)

- Responsive landing page with hero section
- Pricing tiers with feature comparison
- Team showcase
- FAQ section
- Methodology page explaining exam preparation approach
- Consultation booking form

## Tech Stack

- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS (custom theme with Pontea branding)
- No database or authentication on this branch

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Run the dev server
```bash
npm run dev
```

App will be available at `http://localhost:3000`.

**Note**: This branch does not require environment variables for local development.

## Scripts
```bash
npm run dev           # start dev server
npm run build         # production build (outputs to dist/)
npm run start         # run production server
npm run test:e2e       # Playwright tests
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:install # install Playwright browsers
```

## Project Structure
- `src/app/` Next.js App Router routes and layouts
  - Route groups include `(admin)`, `(auth)`, `(dashboard)`, `(test)` and `api/`
- `src/views/` Page-level view components
- `src/components/` Reusable UI components
- `src/contexts/` React context providers (auth)
- `src/hooks/` Custom hooks (test session, auth, timers)
- `src/lib/` Core utilities (Supabase clients, db mappers, test logic)
- `src/types/` Central domain types
- `src/utils/` Shared helpers
- `public/` Static assets
- `tests/` Playwright specs
- `docs/` Project docs and schema snapshot

## Architecture Notes
- Data is stored in Supabase with snake_case columns. Mapping to camelCase models is handled in `src/lib/db.ts`. Use these mappers for reads and writes.
- Auth is managed by `AuthContext` with `useAuth()` for client access. Admin is determined via `userProfile.role === 'admin'`.
- Timed tests are managed by `useTestSession`, which keeps timers synced with server time via `/api/test/sync` to prevent client-side drift or cheating.

## Database
- Supabase migrations live in `supabase/migrations`.
- Schema snapshot and RLS notes are recorded in `docs/db-schema-snapshot-20260125.md`.

## Testing
Playwright runs from `tests/`. You can point tests at a deployed environment by setting `PLAYWRIGHT_BASE_URL`.

## Styling
Tailwind CSS with a custom palette and fonts defined in `tailwind.config.cjs`.

## Deployment
This is a standard Next.js app (see `vercel.json`). In production, builds go to the `dist/` directory (see `next.config.mjs`).

---

If you need deeper implementation details, see `CLAUDE.md` for a guided architecture overview.
