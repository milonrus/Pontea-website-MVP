import type { MetadataRoute } from 'next';
import { getRequiredPublicEnv } from '@/lib/env/public';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getRequiredPublicEnv('NEXT_PUBLIC_APP_URL');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/auth/',
        '/api/',
        '/en/results',
        '/en/results/',
        '/ru/results',
        '/ru/results/',
        '/en/thank-you',
        '/en/thank-you/',
        '/ru/thank-you',
        '/ru/thank-you/'
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
