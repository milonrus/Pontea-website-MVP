import { DEFAULT_LOCALE, Locale, getLocaleHome } from './config';

const LOCALE_PREFIX_PATTERN = /^\/(en|ru)(\/|$)/;

const PAIRED_ROUTE_MAP: Record<string, Record<Locale, string>> = {
  'home': {
    en: '/en',
    ru: '/ru'
  },
  'thank-you': {
    en: '/en/thank-you',
    ru: '/ru/thank-you'
  }
};

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

function getPairedRouteKey(pathname: string): keyof typeof PAIRED_ROUTE_MAP | null {
  const normalized = normalizePath(pathname);

  if (normalized === '/en' || normalized === '/ru') {
    return 'home';
  }

  if (normalized === '/en/thank-you' || normalized === '/ru/thank-you') {
    return 'thank-you';
  }

  return null;
}

export function getSwitchLocalePath(pathname: string, targetLocale: Locale): string {
  const normalized = normalizePath(pathname);
  const routeKey = getPairedRouteKey(normalized);

  if (routeKey) {
    return PAIRED_ROUTE_MAP[routeKey][targetLocale];
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

