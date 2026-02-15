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

export function buildPageMetadata({
  title,
  description,
  canonical,
  languages,
  robots
}: BuildPageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical,
      ...(languages ? { languages } : {})
    },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: 'website',
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
