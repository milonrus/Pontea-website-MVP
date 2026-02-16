"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LANGUAGE_COOKIE_MAX_AGE_SECONDS, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/config';

const DISMISSED_STORAGE_KEY = 'pontea_ru_suggestion_dismissed';

function getCookieValue(name: string): string | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function browserPrefersRussian(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const languageRanges = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languageRanges.some((language) => language.toLowerCase().startsWith('ru'));
}

function setLanguageCookie(locale: 'en' | 'ru') {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

const PreferRussianBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!browserPrefersRussian()) {
      return;
    }

    if (window.localStorage.getItem(DISMISSED_STORAGE_KEY) === '1') {
      return;
    }

    const cookieLocale = getCookieValue(LANGUAGE_COOKIE_NAME);
    if (cookieLocale === 'ru') {
      return;
    }

    setIsVisible(true);
  }, []);

  if (!isVisible) {
    return null;
  }

  const hideBanner = () => {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, '1');
    setIsVisible(false);
  };

  const handleStayInEnglish = () => {
    setLanguageCookie('en');
    hideBanner();
  };

  const handleSwitchToRussian = () => {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, '1');
  };

  return (
    <section
      aria-label="Language suggestion"
      className="mb-8 rounded-2xl border border-blue-200 bg-white/90 p-4 shadow-sm backdrop-blur"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700">
          Prefer Russian? You can switch to the full Russian version.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/ru/"
            onClick={handleSwitchToRussian}
            className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Switch to Russian
          </Link>
          <button
            type="button"
            onClick={handleStayInEnglish}
            className="inline-flex min-h-10 items-center rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Stay in English
          </button>
        </div>
      </div>
    </section>
  );
};

export default PreferRussianBanner;
