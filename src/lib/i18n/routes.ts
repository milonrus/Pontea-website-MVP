import { DEFAULT_LOCALE, Locale, getLocaleHome } from './config';

const RU_PREFIX_PATTERN = /^\/ru(\/|$)/;
const SWITCHABLE_STATIC_PATHS = new Set([
  '/',
  '/thank-you',
  '/assessment',
  '/legal',
  '/results',
  '/arched-prep-course',
]);

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  if (pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isSwitchableDynamicPath(pathWithoutLocale: string): boolean {
  if (pathWithoutLocale.startsWith('/legal/')) {
    return pathWithoutLocale.split('/').length === 3;
  }

  if (pathWithoutLocale.startsWith('/results/')) {
    return pathWithoutLocale.split('/').length === 3;
  }

  return false;
}

function isSwitchablePath(pathWithoutLocale: string): boolean {
  return SWITCHABLE_STATIC_PATHS.has(pathWithoutLocale) || isSwitchableDynamicPath(pathWithoutLocale);
}

function isEnglishLocalizedPath(pathname: string): boolean {
  return isSwitchablePath(pathname);
}

function ensureTrailingSlash(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const normalized = normalizePath(pathname);

  if (RU_PREFIX_PATTERN.test(normalized)) {
    return 'ru';
  }

  if (isEnglishLocalizedPath(normalized)) {
    return 'en';
  }

  return null;
}

function getPathWithoutLocalePrefix(pathname: string): string | null {
  const normalized = normalizePath(pathname);

  if (normalized === '/ru') {
    return '/';
  }

  if (normalized.startsWith('/ru/')) {
    return normalized.slice(3);
  }

  if (isEnglishLocalizedPath(normalized)) {
    return normalized;
  }

  return null;
}

function buildLocalePath(locale: Locale, pathWithoutLocale: string): string {
  if (pathWithoutLocale === '/') {
    return getLocaleHome(locale);
  }

  if (locale === 'en') {
    return ensureTrailingSlash(pathWithoutLocale);
  }

  return ensureTrailingSlash(`/ru${pathWithoutLocale}`);
}

export function getSwitchLocalePath(pathname: string, targetLocale: Locale): string {
  const pathWithoutLocale = getPathWithoutLocalePrefix(pathname);

  if (!pathWithoutLocale) {
    return getLocaleHome(targetLocale);
  }

  if (isSwitchablePath(pathWithoutLocale)) {
    return buildLocalePath(targetLocale, pathWithoutLocale);
  }

  return getLocaleHome(targetLocale);
}

export function getSuggestedLocaleFromAcceptLanguage(acceptLanguageHeader: string | null): Locale {
  if (!acceptLanguageHeader) {
    return DEFAULT_LOCALE;
  }

  const lowered = acceptLanguageHeader.toLowerCase();
  const languageRanges = lowered.split(',').map((entry) => entry.trim());

  for (const range of languageRanges) {
    if (range.startsWith('ru')) {
      return 'ru';
    }

    if (range.startsWith('en')) {
      return 'en';
    }
  }

  return DEFAULT_LOCALE;
}
