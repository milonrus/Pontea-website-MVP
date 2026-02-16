export const SUPPORTED_LOCALES = ['en', 'ru'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LANGUAGE_COOKIE_NAME = 'pontea_lang';
export const LANGUAGE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const LOCALE_HOMES: Record<Locale, string> = {
  en: '/',
  ru: '/ru/'
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && SUPPORTED_LOCALES.includes(value as Locale);
}

export function getLocaleHome(locale: Locale): string {
  return LOCALE_HOMES[locale];
}

export function getActiveLocales(): readonly Locale[] {
  return SUPPORTED_LOCALES;
}
