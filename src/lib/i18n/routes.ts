import { DEFAULT_LOCALE, Locale, getLocaleHome } from './config';
import { isRuOnlyMode } from './mode';

const LOCALE_PREFIX_PATTERN = /^\/(en|ru)(\/|$)/;
const SWITCHABLE_STATIC_PATHS = new Set([
  '/',
  '/thank-you',
  '/assessment',
  '/for-parents',
  '/refund',
  '/legal',
  '/results',
  '/arched-prep-course',
]);

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  if (pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const normalized = normalizePath(pathname);
  const match = normalized.match(LOCALE_PREFIX_PATTERN);

  if (!match) {
    return null;
  }

  const locale = match[1];
  return locale === 'en' || locale === 'ru' ? locale : null;
}

function getPathWithoutLocalePrefix(pathname: string): string | null {
  const normalized = normalizePath(pathname);
  const locale = getLocaleFromPathname(normalized);

  if (!locale) {
    return null;
  }

  if (normalized === `/${locale}`) {
    return '/';
  }

  return normalized.slice(3);
}

function buildLocalePath(locale: Locale, pathWithoutLocale: string): string {
  if (pathWithoutLocale === '/') {
    return getLocaleHome(locale);
  }

  return `/${locale}${pathWithoutLocale}`;
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

export function getSwitchLocalePath(pathname: string, targetLocale: Locale): string {
  if (isRuOnlyMode()) {
    return '/ru';
  }

  const pathWithoutLocale = getPathWithoutLocalePrefix(pathname);

  if (!pathWithoutLocale) {
    return getLocaleHome(targetLocale);
  }

  if (SWITCHABLE_STATIC_PATHS.has(pathWithoutLocale) || isSwitchableDynamicPath(pathWithoutLocale)) {
    return buildLocalePath(targetLocale, pathWithoutLocale);
  }

  return getLocaleHome(targetLocale);
}

export function getSuggestedLocaleFromAcceptLanguage(acceptLanguageHeader: string | null): Locale {
  if (isRuOnlyMode()) {
    return 'ru';
  }

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
