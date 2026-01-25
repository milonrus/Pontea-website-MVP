# Migration Progress Log

## Step 1: Baseline inventory
- Routes from `App.tsx`:
  - `/` (public)
  - `/methodology`
  - `/assessment`
  - `/results`
  - `/consultation`
  - `/auth` (public)
  - `/auth/callback`
  - `/dashboard` (protected)
  - `/exercise/new` (protected)
  - `/exercise/:setId` (protected)
  - `/exercise/:setId/results` (protected)
  - `/history` (protected)
  - `/progress` (protected)
  - `/settings` (protected)
  - `/admin` (admin)
  - `/admin/subjects` (admin)
  - `/admin/subjects/:subjectId/topics` (admin)
  - `/admin/questions` (admin)
  - `/admin/questions/new` (admin)
  - `/admin/questions/:id/edit` (admin)
  - `/admin/questions/import` (admin)
  - `/admin/reports` (admin)
  - `/admin/students` (admin)
  - `/admin/students/:id` (admin)
  - `*` -> `/`
- React Router usage located in `App.tsx`, `pages/**`, `components/**` (Link, Navigate, useNavigate, useLocation, useParams).
- Client-only usage:
  - `window`: `pages/AuthCallbackPage.tsx`, `pages/admin/BulkImportPage.tsx`, `pages/admin/QuestionsPage.tsx`, `pages/AuthPage.tsx`, `components/assessment/QuestionCard.tsx`, `components/landing/SchoolShowcase.tsx`, `components/shared/Header.tsx`, `components/shared/ScrollToTop.tsx`
  - `localStorage`: `pages/ResultsPage.tsx`, `components/assessment/AssessmentFlow.tsx`
- Env/config:
  - `.env` uses `VITE_*` vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`).
  - `supabase.ts` uses `import.meta.env.VITE_*`.
  - `vite.config.ts` present.

## Step 2: Lock framework versions
- Updated `package.json` scripts to `next dev/build/start` and pinned `next@15.0.0` with React 19.
- Removed Vite and React Router dependencies; added React type packages for Next.

## Step 3: Next.js scaffolding
- Added `app/` structure with `app/layout.tsx`, `app/providers.tsx`, `app/globals.css`, and `app/not-found.tsx`.
- Added `next-env.d.ts`, `next.config.mjs`, and updated `tsconfig.json` to Next defaults (kept `@/*` alias).
- Moved global HTML concerns into `app/layout.tsx` and CSS into `app/globals.css`.
- Added `public/vite.svg` to preserve the favicon reference from the old HTML.

## Step 4: Port routes + router APIs
- Renamed `pages/` to `views/` and created `app/**/page.tsx` wrappers for all routes to preserve paths.
- Replaced React Router APIs with Next equivalents (`next/link`, `useRouter`, `useParams`, `usePathname`).
- Added `ProtectedRoute`, `PublicRoute`, and updated `AdminRoute` to use `useAuth` + Next router.
- Updated shared utilities like `ScrollToTop` and `Header` for Next navigation.

## Step 5: Env vars, assets, cleanup
- Renamed `VITE_*` to `NEXT_PUBLIC_*` in `.env` and updated `supabase.ts`/`views/AuthPage.tsx`.
- Removed Vite entry points/config (`index.tsx`, `index.html`, `vite.config.ts`) and old `App.tsx`.
- Removed `vercel.json` to allow Next auto-detection on Vercel.

## Step 6: Parity validation checklist
- Pending manual verification of core flows after dependency install/build.
  - Landing, methodology, consultation, assessment, results
  - Auth (email/password + Google OAuth callback)
  - Dashboard, student exercises, results, history, progress, settings
  - Admin CRUD (questions, subjects, topics, students, reports, CSV import)
  - Styling, fonts, KaTeX rendering

## Step 7: Post-migration fixes
- Added Tailwind build pipeline (Tailwind + PostCSS configs, `@tailwind` directives) and restored theme tokens.
- Removed Tailwind CDN injection from `app/layout.tsx`.
- Fixed leftover React Router props (`to`) and `navigate` calls to use Next router APIs.
- `next build` passes after fixes.
