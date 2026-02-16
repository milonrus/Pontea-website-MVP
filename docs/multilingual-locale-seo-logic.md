# Pontea Multilingual Locale + SEO Logic

Last updated: 2026-02-16

This document is the source of truth for language routing, preference behavior, and SEO constraints.

## 1) URL Contract

- English canonical: `/`
- Russian canonical: `/ru/`
- Trailing slash is enforced globally (`next.config.mjs` uses `trailingSlash: true`)
- Legacy English prefix redirects permanently:
  - `/en` -> `/`
  - `/en/*` -> `/*/`

### Current public localized pages

- EN: `/`, `/assessment/`, `/legal/`, `/legal/{doc}/`, `/results/`, `/results/{token}/`, `/thank-you/`, `/arched-prep-course/`
- RU: `/ru/`, `/ru/assessment/`, `/ru/legal/`, `/ru/legal/{doc}/`, `/ru/results/`, `/ru/results/{token}/`, `/ru/thank-you/`, `/ru/arched-prep-course/`

### Removed pages (must stay 404)

- `/consultation/`
- `/methodology/`
- `/for-parents/`, `/refund/` and RU equivalents are currently removed too.

## 2) Redirect Rules (middleware)

Implementation: `src/middleware.ts`

### Rule A: Explicit query override (`?lang=en|ru`)

- If `lang=en|ru` is present:
  - set `pontea_lang` cookie to that locale
  - remove `lang` query param
  - respond with `307`
- Special case: `/?lang=ru` redirects to `/ru/` (still `307`).

### Rule B: Preference redirect on root only

- If request path is exactly `/` and cookie `pontea_lang=ru`:
  - `307` redirect to `/ru/`
  - headers:
    - `Cache-Control: private, no-store`
    - `Vary: Cookie`

### Rule C: No deep-page forced redirects

- `/assessment/` with RU cookie stays `/assessment/` (`200`)
- `/ru/assessment/` with EN cookie stays `/ru/assessment/` (`200`)
- URL intent always wins for deep pages.

### Rule D: No IP / geo / Accept-Language redirect logic

- Server redirect behavior does not depend on IP or `Accept-Language`.
- `Accept-Language` is used only by the optional client banner UX (section 5).

## 3) Locale Preference Storage

- Cookie name: `pontea_lang`
- Max age: 1 year
- Cookie flags used in app: `Path=/; SameSite=Lax`

Writers:
- `src/middleware.ts` (redirect and localized-route writes)
- `src/components/shared/LanguagePreferenceSync.tsx` (client sync when visiting localized routes)

## 4) Language Switcher Behavior

Implementation: `src/components/shared/LanguageSwitcher.tsx`

- Visible on localized public pages (via header/top bar usage).
- UI is globe button + dropdown menu.
- Menu entries are plain links (`English`, `Русский`) to mirrored paths.
- Path mapping comes from `src/lib/i18n/routes.ts`.

### Important RU -> EN root detail

- From RU homepage to EN homepage, switcher link uses `/?lang=en`.
- Reason: avoid immediate bounce back to `/ru/` when RU cookie exists.
- For deep pages, RU -> EN links do **not** add `?lang=en`; they switch directly to mirrored EN URL.

## 5) Optional UX Banner (non-forcing)

Implementation:
- `src/components/shared/PreferRussianBanner.tsx`
- Rendered from `src/components/landing/Hero.tsx` only when `locale === 'en'`

Behavior:
- Shown only on English homepage content.
- Requires browser language preference to include `ru`.
- Hidden if:
  - `pontea_lang=ru` cookie is present, or
  - local dismissal flag exists (`localStorage['pontea_ru_suggestion_dismissed'] === '1'`).
- Actions:
  - `Switch to Russian` -> navigate to `/ru/` (no forced redirect logic changed)
  - `Stay in English` -> set `pontea_lang=en` and hide banner

This banner must never force navigation by itself.

## 6) SEO Metadata + Indexation Contract

### hreflang/canonical

- Built with `src/lib/seo/metadata.ts`
- Indexable EN/RU pairs include:
  - `hreflang="en"`
  - `hreflang="ru"`
  - `hreflang="x-default"` pointing to `/`
- Canonical is self-referential per locale.
- No cross-language canonical collapsing.

### Noindex pages

- Results and thank-you pages are `noindex, nofollow`.
- No hreflang alternates should be emitted for noindex pages.

### Sitemap

- `/sitemap.xml` is a sitemap index.
- Child sitemaps:
  - `/sitemap-en.xml`
  - `/sitemap-ru.xml`
- Include only canonical, indexable URLs.
- Exclude redirects and removed pages.

### Robots

- `robots.txt` disallows:
  - `/admin/`, `/auth/`, `/api/`
  - EN + RU results and thank-you paths
- Includes sitemap pointer to `/sitemap.xml`.

## 7) Verification (Playwright)

Primary specs:
- `tests/language-preference.spec.ts`
- `tests/smoke.spec.ts`

Run:

```bash
npm run test:e2e -- tests/language-preference.spec.ts tests/smoke.spec.ts --reporter=list --workers=1
```

These specs validate:
- root EN default behavior
- root RU cookie redirect (temporary + private/no-store + vary cookie)
- no deep forced redirects
- `/en/*` permanent redirects
- language switcher mirrored links
- `?lang=` override flow
- RU-browser suggestion banner behavior on root
- hreflang/noindex/sitemap/robots contracts
- removed pages return `404`
