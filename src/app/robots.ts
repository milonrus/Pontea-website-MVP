import type { MetadataRoute } from 'next';
import { getRequiredPublicEnv } from '@/lib/env/public';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getRequiredPublicEnv('NEXT_PUBLIC_APP_URL');

  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
