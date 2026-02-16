"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Globe, ChevronDown } from 'lucide-react';
import { Locale, getActiveLocales } from '@/lib/i18n/config';
import { getLocaleFromPathname, getSwitchLocalePath } from '@/lib/i18n/routes';

interface LanguageSwitcherProps {
  className?: string;
}

const localeLabelMap: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский'
};

function buildLocaleHref(
  pathname: string,
  search: string,
  currentLocale: Locale,
  targetLocale: Locale
): string {
  const nextPath = getSwitchLocalePath(pathname, targetLocale);
  const searchParams = new URLSearchParams(search);

  // Clean stale locale override if it is present in the current URL.
  searchParams.delete('lang');

  // RU -> EN homepage switch requires explicit override,
  // otherwise middleware returns to /ru/ by cookie.
  if (currentLocale === 'ru' && targetLocale === 'en' && nextPath === '/') {
    searchParams.set('lang', 'en');
  }

  const nextSearch = searchParams.toString();
  return nextSearch ? `${nextPath}?${nextSearch}` : nextPath;
}

const LanguageSwitcherInner = ({ className }: LanguageSwitcherProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = getLocaleFromPathname(pathname);
  const activeLocales = getActiveLocales();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!currentLocale || activeLocales.length < 2) {
    return null;
  }

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!dropdownRef.current) {
        return;
      }

      const target = event.target as Node | null;
      if (target && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const search = searchParams.toString();

  return (
    <div ref={dropdownRef} className={`relative inline-flex ${className || ''}`}>
      <button
        type="button"
        aria-label="Open language menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-primary"
      >
        <Globe className="h-4 w-4" />
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Language selector"
          className="absolute right-0 top-full z-50 mt-2 min-w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {activeLocales.map((locale) => {
            const isActive = locale === currentLocale;

            return (
              <Link
                key={locale}
                href={buildLocaleHref(pathname, search, currentLocale, locale)}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
              >
                {localeLabelMap[locale]}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  return (
    <Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />}>
      <LanguageSwitcherInner className={className} />
    </Suspense>
  );
};

export default LanguageSwitcher;
