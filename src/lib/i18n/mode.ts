export const LOCALE_MODES = ['multilingual', 'ru_only'] as const;

export type LocaleMode = (typeof LOCALE_MODES)[number];

const DEFAULT_LOCALE_MODE: LocaleMode = 'multilingual';

export function getLocaleMode(): LocaleMode {
  const mode = process.env.LOCALE_MODE;

  if (mode === 'multilingual' || mode === 'ru_only') {
    return mode;
  }

  return DEFAULT_LOCALE_MODE;
}

export function isRuOnlyMode(): boolean {
  return getLocaleMode() === 'ru_only';
}
