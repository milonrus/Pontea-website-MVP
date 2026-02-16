import type { MetadataRoute } from 'next';
import { isRuOnlyMode } from '@/lib/i18n/mode';

const DEFAULT_SITEMAP_LAST_MODIFIED = '2026-01-25';
const PUBLIC_PATHS_WITHOUT_LOCALE = [
  '/',
  '/assessment',
  '/for-parents',
  '/refund',
  '/legal',
  '/legal/privacy',
  '/legal/consent',
  '/legal/terms',
  '/legal/cookies'
];

function localePath(locale: 'en' | 'ru', path: string): string {
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pontea.school';
  const lastModified =
    process.env.NEXT_PUBLIC_SITEMAP_LASTMOD || DEFAULT_SITEMAP_LAST_MODIFIED;

  if (isRuOnlyMode()) {
    return PUBLIC_PATHS_WITHOUT_LOCALE.map((path) => ({
      url: `${siteUrl}${localePath('ru', path)}`,
      lastModified
    }));
  }

  return PUBLIC_PATHS_WITHOUT_LOCALE.flatMap((path) => {
    const enPath = localePath('en', path);
    const ruPath = localePath('ru', path);
    const alternates = {
      languages: {
        en: `${siteUrl}${enPath}`,
        ru: `${siteUrl}${ruPath}`,
        'x-default': `${siteUrl}${enPath}`
      }
    };

    return [
      {
        url: `${siteUrl}${enPath}`,
        lastModified,
        alternates
      },
      {
        url: `${siteUrl}${ruPath}`,
        lastModified,
        alternates
      }
    ];
  });
}
