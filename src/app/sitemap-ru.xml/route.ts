const EN_INDEXABLE_PATHS = [
  '/',
  '/assessment/',
  '/legal/',
  '/legal/privacy/',
  '/legal/consent/',
  '/legal/terms/',
  '/legal/cookies/'
] as const;

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pontea.school';
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

function toRuPath(enPath: string): string {
  return enPath === '/' ? '/ru/' : `/ru${enPath}`;
}

export async function GET() {
  const siteUrl = getSiteUrl();

  const urls = EN_INDEXABLE_PATHS
    .map((enPath) => `  <url><loc>${siteUrl}${toRuPath(enPath)}</loc></url>`)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
