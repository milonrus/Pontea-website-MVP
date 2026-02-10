"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Locale, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { getLocaleFromPathname, getSwitchLocalePath } from '@/lib/i18n/routes';

interface LanguageSwitcherProps {
  className?: string;
}

function buildLocaleHref(pathname: string, targetLocale: Locale): string {
  return getSwitchLocalePath(pathname, targetLocale);
}

const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);

  if (!currentLocale) {
    return null;
  }

  return (
    <nav
      aria-label="Language selector"
      className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm ${className || ''}`}
    >
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === currentLocale;
        const label = locale === 'en' ? 'EN' : 'RU';

        return (
          <Link
            key={locale}
            href={buildLocaleHref(pathname, locale)}
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
