import type { Metadata } from 'next';

type LanguageAlternates = NonNullable<NonNullable<Metadata['alternates']>['languages']>;

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  canonical: string;
  languages?: LanguageAlternates;
  robots?: Metadata['robots'];
};

const DEFAULT_SOCIAL_IMAGE = '/pontea-logo.webp';
const LOCALE_TO_OG_LOCALE = {
  en: 'en_US',
  ru: 'ru_RU'
} as const;

function ensureTrailingSlash(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  return path.endsWith('/') ? path : `${path}/`;
}

function inferLocaleFromCanonical(canonical: string): 'en' | 'ru' | null {
  if (canonical === '/ru/' || canonical === '/ru' || canonical.startsWith('/ru/')) {
    return 'ru';
  }

  if (canonical.startsWith('/')) {
    return 'en';
  }

  return null;
}

function normalizeLanguages(languages?: LanguageAlternates): LanguageAlternates | undefined {
  if (!languages) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(languages).map(([key, value]) => [key, ensureTrailingSlash(String(value))])
  ) as LanguageAlternates;
}

function withXDefault(languages?: LanguageAlternates): LanguageAlternates | undefined {
  if (!languages) {
    return undefined;
  }

  if ('x-default' in languages) {
    return languages;
  }

  return {
    ...languages,
    'x-default': '/'
  } as LanguageAlternates;
}

export function buildPageMetadata({
  title,
  description,
  canonical,
  languages,
  robots
}: BuildPageMetadataOptions): Metadata {
  const normalizedCanonical = ensureTrailingSlash(canonical);
  const normalizedLanguages = withXDefault(normalizeLanguages(languages));
  const pageLocale = inferLocaleFromCanonical(normalizedCanonical);
  const openGraphLocale = pageLocale ? LOCALE_TO_OG_LOCALE[pageLocale] : undefined;
  const alternateLocale = normalizedLanguages
    ? (Object.keys(normalizedLanguages) as Array<keyof typeof normalizedLanguages>)
        .filter((key) => key === 'en' || key === 'ru')
        .map((key) => LOCALE_TO_OG_LOCALE[key as 'en' | 'ru'])
        .filter((locale) => locale !== openGraphLocale)
    : [];

  return {
    title,
    description,
    alternates: {
      canonical: normalizedCanonical,
      ...(normalizedLanguages ? { languages: normalizedLanguages } : {})
    },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: 'website',
      ...(openGraphLocale ? { locale: openGraphLocale } : {}),
      ...(alternateLocale.length > 0 ? { alternateLocale } : {}),
      title,
      description,
      url: normalizedCanonical,
      siteName: 'PONTEA School',
      images: [{ url: DEFAULT_SOCIAL_IMAGE }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_SOCIAL_IMAGE]
    }
  };
}
