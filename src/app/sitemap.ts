import type { MetadataRoute } from 'next';
import { isRuOnlyMode } from '@/lib/i18n/mode';

const MULTILINGUAL_PUBLIC_SITEMAP_PATHS = [
  '/en',
  '/ru',
  '/consultation',
  '/methodology',
  '/ru/assessment',
  '/ru/for-parents',
  '/ru/refund',
  '/ru/legal',
  '/ru/legal/privacy',
  '/ru/legal/consent',
  '/ru/legal/terms',
  '/ru/legal/cookies'
];

const RU_ONLY_PUBLIC_SITEMAP_PATHS = [
  '/ru',
  '/ru/assessment',
  '/ru/for-parents',
  '/ru/refund',
  '/ru/legal',
  '/ru/legal/privacy',
  '/ru/legal/consent',
  '/ru/legal/terms',
  '/ru/legal/cookies'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const publicSitemapPaths = isRuOnlyMode()
    ? RU_ONLY_PUBLIC_SITEMAP_PATHS
    : MULTILINGUAL_PUBLIC_SITEMAP_PATHS;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pontea.school';
  const now = new Date();

  return publicSitemapPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now
  }));
}
