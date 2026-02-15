import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_LOCALE,
  LANGUAGE_COOKIE_MAX_AGE_SECONDS,
  LANGUAGE_COOKIE_NAME,
  isLocale
} from '@/lib/i18n/config';
import { getLocaleFromPathname } from '@/lib/i18n/routes';
import { isRuOnlyMode } from '@/lib/i18n/mode';

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

function getRuOnlyRedirectPath(pathname: string): string | null {
  const normalized = normalizePath(pathname);

  if (normalized === '/') {
    return '/ru';
  }

  if (normalized === '/consultation' || normalized === '/methodology') {
    return '/ru';
  }

  if (normalized === '/en') {
    return '/ru';
  }

  if (normalized === '/en/thank-you') {
    return '/ru/thank-you';
  }

  if (normalized.startsWith('/en/')) {
    return '/ru';
  }

  return null;
}

function withLocaleRequestHeader(request: NextRequest, locale: 'en' | 'ru'): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_REQUEST_HEADER_NAME, locale);
  return requestHeaders;
}

function createLocaleRedirectResponse(
  request: NextRequest,
  targetPath: string,
  locale: 'en' | 'ru'
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = targetPath;
  const redirectResponse = NextResponse.redirect(redirectUrl, 302);
  withLanguageCookie(redirectResponse, locale);
  return redirectResponse;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieLocale = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value;
  const localeFromPath = getLocaleFromPathname(pathname);
  const ruOnlyMode = isRuOnlyMode();
  const fallbackLocale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const resolvedLocale: 'en' | 'ru' = ruOnlyMode ? 'ru' : (localeFromPath ?? fallbackLocale);

  if (ruOnlyMode) {
    const redirectPath = getRuOnlyRedirectPath(pathname);
    if (redirectPath) {
      return createLocaleRedirectResponse(request, redirectPath, 'ru');
    }
  }

  if (pathname === '/' && isLocale(cookieLocale)) {
    const redirectUrl = new URL(`/${cookieLocale}`, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl, 302);
    withLanguageCookie(redirectResponse, cookieLocale);
    return redirectResponse;
  }

  if (localeFromPath) {
    const response = NextResponse.next({
      request: {
        headers: withLocaleRequestHeader(request, localeFromPath)
      }
    });
    withLanguageCookie(response, localeFromPath);
    return response;
  }

  return NextResponse.next({
    request: {
      headers: withLocaleRequestHeader(request, resolvedLocale)
    }
  });
}

export const config = {
  matcher: [
    '/:path*'
  ]
};
