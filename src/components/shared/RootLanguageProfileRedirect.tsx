"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGE_COOKIE_NAME, isLocale, getLocaleHome } from '@/lib/i18n/config';

function hasLanguageCookie(): boolean {
  return document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .some((entry) => entry.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
}

const RootLanguageProfileRedirect = () => {
  const router = useRouter();
  const { userProfile } = useAuth();
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (window.location.pathname !== '/' || isRedirecting.current) {
      return;
    }

    if (hasLanguageCookie()) {
      return;
    }

    const preferredLanguage = userProfile?.settings?.language;
    if (!isLocale(preferredLanguage)) {
      return;
    }

    isRedirecting.current = true;
    router.replace(getLocaleHome(preferredLanguage));
  }, [router, userProfile]);

  return null;
};

export default RootLanguageProfileRedirect;

