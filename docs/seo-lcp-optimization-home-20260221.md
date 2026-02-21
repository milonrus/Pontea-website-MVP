# Home SEO/LCP Optimization (EN/RU)

Last updated: 2026-02-21  
Status: Implemented (Phase 1 + Phase 2)  
Scope: Homepage EN `/` and RU `/ru/`

Related render-blocking track:
- `docs/seo-render-blocking-home-20260221.md`

## 1. Проблема (baseline)

- SEO-аудит показал провал Largest Contentful Paint (LCP): `13.48s`.
- LCP-элемент: заголовок блока платформы (`Everything you need to get in, in one platform`).
- Целевой ориентир: LCP <= `2.5s` (mobile-first), минимально приемлемо после фикса <= `4.0s`.

## 2. Root-cause analysis

1. LCP-текст рендерился с hidden initial state через Framer Motion (render delay).
2. Above-the-fold hero тоже имел стартовое скрытие/анимацию.
3. В root layout были render-blocking внешние стили (Google Fonts + KaTeX CDN).
4. Платформенные `.webm` видео могли конкурировать за сеть/CPU слишком рано.
5. Middleware матчил все пути, включая asset-роуты.
6. Ниже первого экрана было много `<img>` без lazy/async hints.

## 3. Что реализовано

### 3.1 LCP render-delay fixes

- Убран hidden motion wrapper у hero lead блока.
  - `src/components/landing/Hero.tsx`
- Убран hidden motion wrapper у заголовка LCP-секции.
  - `src/components/landing/PlatformShowcaseVariations.tsx`

### 3.2 Video loading optimization

- Введена явная логика: грузить видео только после входа секции во viewport и только для активной карточки.
- Изменен контракт `PlatformVideo`:
  - добавлены `shouldLoad` и `placeholderLabel`.
- Автозапуск видео зависит от `isActive + isVisible + shouldLoad`.
- `preload` переведен в `metadata`.
- Добавлен lightweight placeholder до готовности видео.
  - `src/components/landing/PlatformShowcaseVariations.tsx`
  - `src/components/landing/PlatformVideo.tsx`

### 3.3 Render-blocking CSS/font cleanup

- Убран ручной Google Fonts `<link>` из root layout.
- Подключен `Mulish` через локальный `@font-face` из `public/fonts` (`font-display: swap`, latin+cyrillic subsets).
- Убран глобальный KaTeX CDN stylesheet из root layout.
- Глобальные шрифты переключены на CSS variable `--font-mulish`.
  - `src/app/layout.tsx`
  - `src/app/globals.css`
  - `tailwind.config.cjs`

### 3.4 Middleware scope reduction

- Сужен matcher, исключены:
  - `api`
  - `_next/static`
  - `_next/image`
  - `favicon.ico`
  - `robots.txt`
  - `sitemap.xml`, `sitemap-en.xml`, `sitemap-ru.xml`
  - любые requests к файлам по паттерну `.*\..*`
- При этом сохранена текущая locale/cookie redirect логика страниц.
  - `src/middleware.ts`

### 3.5 Non-critical image loading hints

- Добавлены `loading="lazy"` + `decoding="async"` для нижефолдовых изображений:
  - `src/components/landing/ExperienceBanner.tsx`
  - `src/components/landing/Testimonials.tsx`
  - `src/components/landing/StressManagementTimeline.tsx`

## 4. Проверка и сборка

- Production build после изменений: успешно (`next build` completed).

## 5. Как тестировать локально (worktree)

```bash
cd /Users/mikhail/.codex/worktrees/37a8/Pontea-website-MVP
npm install
cp .env.production .env.local
PORT=3004 npm run dev
```

Проверяем:
- `http://localhost:3004/`
- `http://localhost:3004/ru/`

Production-like локально:

```bash
cd /Users/mikhail/.codex/worktrees/37a8/Pontea-website-MVP
npm run build
PORT=3004 npm run start
```

## 6. Lighthouse protocol (recommended)

Для каждой страницы (`/` и `/ru/`):
- 3 прогона Mobile
- 3 прогона Desktop
- сравнивать median по LCP

CLI пример (опционально):

```bash
npx lighthouse http://localhost:3004/ --preset=desktop --output=html --output-path=./lighthouse-home-desktop.html --chrome-flags="--headless"
npx lighthouse http://localhost:3004/ --preset=perf --output=html --output-path=./lighthouse-home-mobile.html --chrome-flags="--headless"
```

Повторить для `http://localhost:3004/ru/`.

## 7. Acceptance criteria

1. SEO-аудит перестает показывать red LCP для `/` и `/ru/`.
2. Улучшение не меньше 60% от baseline `13.48s` (минимум <= `5.4s`), целевой <= `2.5s`.
3. Нет регрессий в locale-роутинге, CTA, schema/FAQ и общей верстке.
4. Home head на `/` и `/ru/` содержит 1 blocking stylesheet (после удаления font-chunk split).
5. На home initial resources не содержат Supabase chunk.
6. Ранние `.webm` запросы до входа platform section во viewport отсутствуют.

## 8. Что оставлено как Phase 3 (опционально)

- Убрать зависимость root layout от `headers()` и пересобрать locale-resolution так, чтобы усилить static behavior.
- Делать только если после Phase 1/2 TTFB или LCP все еще выше целевых порогов.

## 9. Измененные файлы (Phase 1/2)

- `src/app/layout.tsx`
- `src/app/globals.css`
- `tailwind.config.cjs`
- `src/middleware.ts`
- `src/components/landing/Hero.tsx`
- `src/components/landing/PlatformShowcaseVariations.tsx`
- `src/components/landing/PlatformVideo.tsx`
- `src/components/landing/ExperienceBanner.tsx`
- `src/components/landing/Testimonials.tsx`
- `src/components/landing/StressManagementTimeline.tsx`
