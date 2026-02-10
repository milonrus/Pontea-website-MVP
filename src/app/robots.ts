import type { MetadataRoute } from 'next';

function isSeoLockEnabled() {
  return process.env.SEO_LOCK !== 'false';
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pontea.school';

  if (isSeoLockEnabled()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/'
      }
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/'
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
