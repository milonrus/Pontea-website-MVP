"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Locale, getActiveLocales } from '@/lib/i18n/config';
import { getLocaleFromPathname, getSwitchLocalePath } from '@/lib/i18n/routes';

interface LanguageSwitcherProps {
  className?: string;
}

function buildLocaleHref(pathname: string, search: string, targetLocale: Locale): string {
  const nextPath = getSwitchLocalePath(pathname, targetLocale);
  return search ? `${nextPath}?${search}` : nextPath;
}

const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = getLocaleFromPathname(pathname);
  const activeLocales = getActiveLocales();

  if (!currentLocale || activeLocales.length < 2) {
    return null;
  }

  const search = searchParams.toString();

  return (
    <nav
      aria-label="Language selector"
      className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm ${className || ''}`}
    >
      {activeLocales.map((locale) => {
        const isActive = locale === currentLocale;
        const label = locale === 'en' ? 'EN' : 'RU';

        return (
          <Link
            key={locale}
            href={buildLocaleHref(pathname, search, locale)}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default LanguageSwitcher;
