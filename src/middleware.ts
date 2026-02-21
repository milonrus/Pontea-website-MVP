import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_LOCALE,
  LANGUAGE_COOKIE_MAX_AGE_SECONDS,
  LANGUAGE_COOKIE_NAME
} from '@/lib/i18n/config';
import { getLocaleFromPathname } from '@/lib/i18n/routes';

const LOCALE_REQUEST_HEADER_NAME = 'x-site-locale';

function withLanguageCookie(response: NextResponse, locale: 'en' | 'ru') {
  response.cookies.set({
    name: LANGUAGE_COOKIE_NAME,
    value: locale,
    maxAge: LANGUAGE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax'
  });
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function withLocaleRequestHeader(request: NextRequest, locale: 'en' | 'ru'): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_REQUEST_HEADER_NAME, locale);
  return requestHeaders;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = normalizePath(pathname);
  const cookieLocale = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value;
  const localeFromPath = getLocaleFromPathname(pathname);
  const localeOverride = request.nextUrl.searchParams.get('lang');

  if (localeOverride === 'en' || localeOverride === 'ru') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('lang');

    // /?lang=ru should resolve to the RU homepage.
    if (localeOverride === 'ru' && normalizedPath === '/') {
      redirectUrl.pathname = '/ru/';
    }

    const response = NextResponse.redirect(redirectUrl, 307);
    withLanguageCookie(response, localeOverride);
    return response;
  }

  if (normalizedPath === '/' && cookieLocale === 'ru') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/ru/';
    const redirectResponse = NextResponse.redirect(redirectUrl, 307);
    redirectResponse.headers.set('Cache-Control', 'private, no-store');
    redirectResponse.headers.set('Vary', 'Cookie');
    withLanguageCookie(redirectResponse, 'ru');
    return redirectResponse;
  }

  const resolvedLocale: 'en' | 'ru' = localeFromPath ?? DEFAULT_LOCALE;
  const response = NextResponse.next({
    request: {
      headers: withLocaleRequestHeader(request, resolvedLocale)
    }
  });

  if (localeFromPath === 'en' || localeFromPath === 'ru') {
    withLanguageCookie(response, localeFromPath);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap-en.xml|sitemap-ru.xml|.*\\..*).*)'
  ]
};
