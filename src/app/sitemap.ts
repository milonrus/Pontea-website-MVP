import type { MetadataRoute } from 'next';

const PUBLIC_SITEMAP_PATHS = [
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

function isSeoLockEnabled() {
  return process.env.SEO_LOCK !== 'false';
}

export default function sitemap(): MetadataRoute.Sitemap {
  if (isSeoLockEnabled()) {
    return [];
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pontea.school';
  const now = new Date();

  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now
  }));
}
