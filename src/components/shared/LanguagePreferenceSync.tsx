"use client";

import { useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser } from '@/lib/db';
import {
  LANGUAGE_COOKIE_MAX_AGE_SECONDS,
  LANGUAGE_COOKIE_NAME,
  isLocale
} from '@/lib/i18n/config';
import { getLocaleFromPathname } from '@/lib/i18n/routes';

function setLanguageCookie(locale: 'en' | 'ru') {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

const LanguagePreferenceSync = () => {
  const pathname = usePathname();
  const localeFromPath = useMemo(() => getLocaleFromPathname(pathname), [pathname]);
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const pendingLocale = useRef<string | null>(null);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!localeFromPath) {
      return;
    }

    setLanguageCookie(localeFromPath);

    if (!currentUser || !userProfile) {
      return;
    }

    const profileLanguage = userProfile.settings?.language;
    if (profileLanguage === localeFromPath || pendingLocale.current === localeFromPath) {
      return;
    }

    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(async () => {
      if (!isLocale(localeFromPath)) {
        return;
      }

      pendingLocale.current = localeFromPath;

      try {
        await updateUser(currentUser.id, {
          settings: {
            ...userProfile.settings,
            showResultAfterEach: userProfile.settings?.showResultAfterEach ?? false,
            language: localeFromPath
          }
        });
        await refreshProfile();
      } catch (error) {
        console.error('Failed to sync language preference', error);
      } finally {
        pendingLocale.current = null;
      }
    }, 250);

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [currentUser, localeFromPath, refreshProfile, userProfile]);

  return null;
};

export default LanguagePreferenceSync;

