function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pontea.school';
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

export async function GET() {
  const siteUrl = getSiteUrl();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap-en.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-ru.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
