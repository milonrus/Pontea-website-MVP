import { NextRequest, NextResponse } from 'next/server';
import {
  LANGUAGE_COOKIE_MAX_AGE_SECONDS,
  LANGUAGE_COOKIE_NAME,
  isLocale
} from '@/lib/i18n/config';
import { getLocaleFromPathname } from '@/lib/i18n/routes';

function withLanguageCookie(response: NextResponse, locale: 'en' | 'ru') {
  response.cookies.set({
    name: LANGUAGE_COOKIE_NAME,
    value: locale,
    maxAge: LANGUAGE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax'
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieLocale = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value;

  if (pathname === '/' && isLocale(cookieLocale)) {
    const redirectUrl = new URL(`/${cookieLocale}`, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl, 302);
    withLanguageCookie(redirectResponse, cookieLocale);
    return redirectResponse;
  }

  const localeFromPath = getLocaleFromPathname(pathname);
  if (localeFromPath) {
    const response = NextResponse.next();
    withLanguageCookie(response, localeFromPath);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/en/:path*',
    '/ru/:path*'
  ]
};

