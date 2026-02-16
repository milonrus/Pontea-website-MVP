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

function inferLocaleFromCanonical(canonical: string): 'en' | 'ru' | null {
  if (canonical === '/en' || canonical.startsWith('/en/')) {
    return 'en';
  }

  if (canonical === '/ru' || canonical.startsWith('/ru/')) {
    return 'ru';
  }

  return null;
}

function withXDefault(languages?: LanguageAlternates): LanguageAlternates | undefined {
  if (!languages) {
    return undefined;
  }

  if ('x-default' in languages) {
    return languages;
  }

  if ('en' in languages && typeof languages.en === 'string') {
    return {
      ...languages,
      'x-default': languages.en
    } as LanguageAlternates;
  }

  return languages;
}

export function buildPageMetadata({
  title,
  description,
  canonical,
  languages,
  robots
}: BuildPageMetadataOptions): Metadata {
  const normalizedLanguages = withXDefault(languages);
  const pageLocale = inferLocaleFromCanonical(canonical);
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
      canonical,
      ...(normalizedLanguages ? { languages: normalizedLanguages } : {})
    },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: 'website',
      ...(openGraphLocale ? { locale: openGraphLocale } : {}),
      ...(alternateLocale.length > 0 ? { alternateLocale } : {}),
      title,
      description,
      url: canonical,
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
