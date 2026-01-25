# Vite to Next.js Migration Plan (Pontea MVP)

## Goals
- Move from Vite + React Router SPA to Next.js App Router.
- Preserve all existing behavior and UI without adding new functionality.
- Keep Supabase client-side flow intact unless required for Next compatibility.
- Minimize downtime and regressions.

## Non-Goals
- No new features, API routes, server-side data layer, or UX changes.
- No database/schema changes beyond what is already required by the current app.
- No design system rework or styling overhaul.

## Current Scope (Repo Reality)
- Routes are defined in `App.tsx` and rendered from `pages/`.
- Supabase client uses `import.meta.env.VITE_*` in `supabase.ts`.
- Global HTML/styles live in `index.html` (Tailwind CDN config, fonts, KaTeX CSS, base styles).
- Auth + role logic lives in `contexts/AuthContext.tsx`.
- Data access lives in `services/db.ts` and `services/exercise.ts`.

## Decision
- Target framework: Next.js 15 (App Router).
- React version: keep React 19 (no downgrade).

## Step-by-Step Plan (Update Only, No New Functionality)
1) **Baseline inventory**
   - Freeze a route map from `App.tsx` and `pages/`.
   - List all `react-router-dom` usages (Link, Navigate, useNavigate, useParams, useLocation).
   - List client-only dependencies (`window`, `document`, `localStorage`) and pages using them.
   - Record current env vars and runtime config (`.env`, `supabase.ts`, `vite.config.ts`).

2) **Lock framework versions**
   - Use Next.js 15 with React 19.
   - Update `package.json` scripts to Next (`dev`, `build`, `start`) and remove Vite.

3) **Add Next.js App Router scaffolding in-place**
   - Add `app/`, `next-env.d.ts`, and `next.config.*`.
   - Align `tsconfig.json` with Next defaults while preserving the `@` alias.
   - Keep the repo structure; do not create a parallel app folder.

4) **Move global HTML/CSS from `index.html` into Next layout**
   - Create `app/layout.tsx` with `<html>`/`<body>` and title/viewport metadata.
   - Create `app/globals.css` containing the base CSS from `index.html`.
   - Preserve Tailwind CDN config, fonts, and KaTeX stylesheet links.

5) **Update environment variable usage**i 
   - Rename `VITE_*` to `NEXT_PUBLIC_*` and update `.env`.
   - Update `supabase.ts` and `pages/AuthPage.tsx` to use `process.env.*`.
   - Keep the same values and auth flow settings.

6) **Port routes to App Router (1:1 parity)**
   - Mirror each existing route with `app/**/page.tsx`.
   - Preserve route paths and dynamic segments (`/exercise/[setId]`, `/admin/subjects/[subjectId]/topics`).
   - Keep page components the same; only move/rename as needed.

7) **Replace React Router APIs with Next equivalents**
   - `Link` -> `next/link`
   - `Navigate` -> `redirect` or `router.replace`
   - `useNavigate` -> `useRouter`
   - `useLocation` -> `usePathname`
   - `useParams` -> `useParams` from `next/navigation`
   - Update `ScrollToTop` to use `usePathname`.

8) **Recreate route guards with the existing AuthContext**
   - Implement `ProtectedRoute` and `AdminRoute` as client wrappers using `useAuth` + `useRouter`.
   - Keep redirect behavior identical to `App.tsx`.

9) **Mark client components explicitly**
   - Add `"use client"` to pages/components that use hooks or browser APIs.
   - Guard `window`/`localStorage` access to prevent SSR errors.

10) **Assets and static files**
   - Move local images to `/public` if referenced by relative paths.
   - Keep remote image URLs unchanged.

11) **Deployment config update**
   - Update or remove `vercel.json` to let Vercel detect Next automatically.
   - Ensure build output and commands match Next.

12) **Parity validation checklist**
   - Landing, methodology, consultation, assessment, results.
   - Auth (email/password + Google OAuth callback).
   - Dashboard, student exercises, results, history, progress, settings.
   - Admin CRUD (questions, subjects, topics, students, reports, CSV import).
   - Styling, fonts, and KaTeX rendering.

13) **Cleanup**
   - Remove Vite entry points (`index.tsx`, `App.tsx`, `index.html`, `vite.config.ts`).
   - Remove unused Vite deps (`vite`, `@vitejs/plugin-react`, `react-router-dom`).

## Deliverables
- Next.js App Router version of the current app with identical behavior.
- Updated env and deployment config.
- Verified route parity and core flows.
