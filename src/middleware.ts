import { NextRequest, NextResponse } from 'next/server';
import {
  LANGUAGE_COOKIE_MAX_AGE_SECONDS,
  LANGUAGE_COOKIE_NAME,
  isLocale
} from '@/lib/i18n/config';
import { getLocaleFromPathname } from '@/lib/i18n/routes';

const SEO_LOCK_HEADER_VALUE = 'noindex, nofollow, noarchive';

function isSeoLockEnabled() {
  return process.env.SEO_LOCK !== 'false';
}

function withLanguageCookie(response: NextResponse, locale: 'en' | 'ru') {
  response.cookies.set({
    name: LANGUAGE_COOKIE_NAME,
    value: locale,
    maxAge: LANGUAGE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax'
  });
}

function withSeoLockHeaders(response: NextResponse, pathname: string) {
  if (isSeoLockEnabled() && !pathname.startsWith('/_next/')) {
    response.headers.set('X-Robots-Tag', SEO_LOCK_HEADER_VALUE);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieLocale = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value;
  const seoLockEnabled = isSeoLockEnabled();

  if (seoLockEnabled && pathname === '/sitemap.xml') {
    return withSeoLockHeaders(
      new NextResponse('Not Found', {
        status: 404,
        headers: {
          'content-type': 'text/plain; charset=utf-8'
        }
      }),
      pathname
    );
  }

  if (pathname === '/' && isLocale(cookieLocale)) {
    const redirectUrl = new URL(`/${cookieLocale}`, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl, 302);
    withLanguageCookie(redirectResponse, cookieLocale);
    return withSeoLockHeaders(redirectResponse, pathname);
  }

  const localeFromPath = getLocaleFromPathname(pathname);
  if (localeFromPath) {
    const response = NextResponse.next();
    withLanguageCookie(response, localeFromPath);
    return withSeoLockHeaders(response, pathname);
  }

  return withSeoLockHeaders(NextResponse.next(), pathname);
}

export const config = {
  matcher: [
    '/:path*'
  ]
};
