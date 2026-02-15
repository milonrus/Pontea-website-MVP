# Pontea

Pontea is a Next.js-based educational platform for students and admins. Students can take practice sessions and timed tests, while admins manage question content and bulk imports. The app is built with React 19, TypeScript, Tailwind CSS, and Supabase for auth and data.

## Features
- Student practice sessions and timed, proctored-style tests
- Server-synced timers with drift detection and section locking
- Admin question management with CSV and image-based imports
- Supabase-backed auth and role-based access (admin vs student)
- App Router routes for auth, dashboard, tests, and admin tools

## Tech Stack
- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS
- Supabase (database, auth)
- Playwright for end-to-end tests

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create a `.env.local` file in the repo root (or start from `.env.example`):
```bash
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-user/your-event
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # required for server-side admin routes
OPENAI_API_KEY=...            # required for admin parsing/difficulty routes
ASSESSMENT_RESULTS_WEBHOOK_URL=...         # required webhook for assessment submissions
PRICING_LEAD_WEBHOOK_URL=...               # required webhook for EUR/Mentorship leads
PRICING_PAYMENT_INTENT_WEBHOOK_URL=...     # required webhook for RUB payment intents
NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION=... # required RU payment link for Foundation
NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED=...   # required RU payment link for Advanced
NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION_INSTALLMENT=... # optional, RU installment link for Foundation
NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED_INSTALLMENT=...   # optional, RU installment link for Advanced
NEXT_PUBLIC_SUPPORT_TELEGRAM_URL=...       # required, support button URL
LOCALE_MODE=multilingual      # multilingual | ru_only
OPENAI_PARSE_MODEL=gpt-5-mini
OPENAI_PARSE_STREAM_MODEL=gpt-4o-mini
OPENAI_DIFFICULTY_MODEL=gpt-4o-mini
PRICING_WEBHOOK_MAX_ATTEMPTS=3
WEBHOOK_TIMEOUT_MS=5000
```

### 3) Run the dev server
```bash
npm run dev
```

App will be available at `http://localhost:3000`.

### Locale Mode
- Locale mode defaults to `multilingual`.
- To temporarily run RU-only launch mode, set:
```bash
LOCALE_MODE=ru_only
```
- RU-only mode behavior:
  - `/` redirects to `/ru`
  - `/en...` redirects to `/ru` (or `/ru/thank-you` for `/en/thank-you`)
  - `/consultation` and `/methodology` redirect to `/ru`

### RU-Only Launch Checklist
Before RU-only production launch, set:
```bash
LOCALE_MODE=ru_only
APP_URL=https://<your-production-domain>
NEXT_PUBLIC_APP_URL=https://<your-production-domain>
```

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
