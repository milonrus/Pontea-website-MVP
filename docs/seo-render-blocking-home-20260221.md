# Render-Blocking Recovery (Home EN `/` + RU `/ru/`)

Last updated: 2026-02-21  
Status: Implemented (Phase 1 + Phase 2 + docs)  
Scope: Homepage only (`/`, `/ru/`)

## 1) Baseline (before)

Lighthouse baseline for home showed CSS as render-blocking on first paint:

- `/_next/static/css/c00849edcd6ff54a.css` (~15.3KB transfer)
- `/_next/static/css/269cee5700895e2b.css` (~1.1KB transfer)
- `render-blocking-insight` estimated savings:
  - `/`: ~360ms
  - `/ru/`: ~250ms

## 2) Implemented Changes

### 2.1 CSS blocking reduction

1. Removed `next/font/google` from root layout and moved Mulish to local static `@font-face` with `font-display: swap`.
   - `src/app/layout.tsx`
   - `src/app/globals.css`
   - `public/fonts/mulish-latin.woff2`
   - `public/fonts/mulish-cyrillic.woff2`

2. Enabled Next CSS optimization.
   - `next.config.mjs`:
   - `experimental.optimizeCss: true`

3. Consolidated above-the-fold custom styles into global component classes (instead of per-component CSS chunks) to keep a single blocking stylesheet on home.
   - `src/app/globals.css`
   - `src/components/landing/Hero.tsx`
   - `src/components/landing/PlatformShowcaseVariations.tsx`

### 2.2 JS critical-path relief

4. Added `MarketingHeader` without auth/Supabase hooks for homepage.
   - `src/components/shared/MarketingHeader.tsx`
   - `src/views/LandingPage.tsx`

5. Removed global `LanguagePreferenceSync` from root providers to avoid auth/supabase coupling on homepage initial load.
   - `src/app/providers.tsx`

6. Set above-the-fold behavior to static in critical blocks (Hero and platform heading/card shell), removing Framer Motion from those components.
   - `src/components/landing/Hero.tsx`
   - `src/components/landing/PlatformShowcaseVariations.tsx`

7. Deferred heavy below-fold logic:
   - FAQ switched to native `<details>` (SSR content + FAQ schema preserved).
     - `src/components/landing/FAQ.tsx`
   - Pricing data loaded lazily via dynamic import after hydration/idle.
     - `src/components/landing/pricing-ru/PricingRu.tsx`

### 2.3 Related bandwidth protection

8. Platform videos remain gated by visibility and section intersection (`preload="metadata"`, no early `.webm` requests before viewport).
   - `src/components/landing/PlatformVideo.tsx`
   - `src/components/landing/PlatformShowcaseVariations.tsx`

## 3) Validation Snapshot (local, 2026-02-21)

### Build

- `npm run build` passes.

### Home head CSS count

- `/`: **1** stylesheet (`/_next/static/css/1fe1aaf4d3784416.css`)
- `/ru/`: **1** stylesheet (`/_next/static/css/1fe1aaf4d3784416.css`)

### Lighthouse (single local run, mobile preset)

- `/`:
  - LCP: `1.9s`
  - FCP: `1.9s`
  - `render-blocking-insight`: `Est savings of 370ms`
- `/ru/`:
  - LCP: `1.8s`
  - FCP: `1.8s`
  - `render-blocking-insight`: `Est savings of 500ms`

### Additional checks

- No `.webm` requests observed in Lighthouse network requests before section visibility on initial load (`/` and `/ru/`).
- Supabase chunks are not part of initial home chunk list.

## 4) Commands Used for Validation

```bash
# Build
npm run build

# Start
PORT=3014 npm run start

# Lighthouse
npx lighthouse http://localhost:3014/ --preset=perf --only-categories=performance --output=json --output-path=/tmp/lh-home-en.json --chrome-flags='--headless=new --no-sandbox'
npx lighthouse http://localhost:3014/ru/ --preset=perf --only-categories=performance --output=json --output-path=/tmp/lh-home-ru.json --chrome-flags='--headless=new --no-sandbox'
```

## 5) Rollback Plan

If needed, rollback by reverting:

- `next.config.mjs` (`experimental.optimizeCss`)
- `src/app/layout.tsx` + `src/app/globals.css` (font loading strategy)
- `src/components/shared/MarketingHeader.tsx` + `src/views/LandingPage.tsx`
- `src/app/providers.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/PlatformShowcaseVariations.tsx`
- `src/components/landing/FAQ.tsx`
- `src/components/landing/pricing-ru/PricingRu.tsx`

## 6) Notes

- Main blocker test is improved structurally (single CSS request instead of two), but `render-blocking-insight` can still stay above strict `<=150ms` target in throttled synthetic runs because the remaining global stylesheet is still blocking by definition.
- If strict pass threshold is required, next step is critical CSS inlining for first viewport and deferring non-critical styles (controlled FOUC strategy).
