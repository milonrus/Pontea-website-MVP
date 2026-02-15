import Link from 'next/link';
import { Locale, getActiveLocales } from '@/lib/i18n/config';

interface LanguageSelectorCardProps {
  suggestedLocale: Locale;
}

const localeOptionMap: Record<Locale, {
  locale: Locale;
  label: string;
  code: string;
  href: string;
}> = {
  ru: {
    locale: 'ru',
    label: 'Русский',
    code: 'RU',
    href: '/ru'
  },
  en: {
    locale: 'en',
    label: 'English',
    code: 'EN',
    href: '/en'
  }
};

function getLocaleOptions(): Array<{
  locale: Locale;
  label: string;
  code: string;
  href: string;
}> {
  return getActiveLocales().map((locale) => localeOptionMap[locale]);
}

function getOrderedLocaleOptions(suggestedLocale: Locale) {
  const localeOptions = getLocaleOptions();

  return [...localeOptions].sort((a, b) => {
    if (a.locale === suggestedLocale && b.locale !== suggestedLocale) {
      return -1;
    }
    if (b.locale === suggestedLocale && a.locale !== suggestedLocale) {
      return 1;
    }
    return 0;
  });
}

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

const PonteaLogo = ({ className, colorClass = 'bg-primary' }: { className?: string; colorClass?: string }) => (
  <div
    className={cn('h-8 w-44', colorClass, className)}
    style={{
      aspectRatio: '1056 / 122',
      WebkitMaskImage: 'url(/pontea-logo.webp)',
      WebkitMaskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskImage: 'url(/pontea-logo.webp)',
      maskSize: 'contain',
      maskRepeat: 'no-repeat',
      maskPosition: 'center'
    }}
    role="img"
    aria-label="Pontea"
  />
);

export const LanguageSelectorCard = ({ suggestedLocale }: LanguageSelectorCardProps) => {
  const orderedLocaleOptions = getOrderedLocaleOptions(suggestedLocale);

  return (
    <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_24px_70px_-45px_rgba(1,39,139,0.65)]">
      <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-gradient-to-b from-primary to-secondary px-6 py-8 text-white sm:px-8">
          <PonteaLogo colorClass="bg-white" />
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-blue-100">Language selector</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Choose your language</h1>
        </div>

        <div className="space-y-3 bg-white px-5 py-6 sm:px-7 sm:py-8">
          {orderedLocaleOptions.map((option) => {
            const isSuggested = option.locale === suggestedLocale;
            return (
              <Link
                key={option.locale}
                href={option.href}
                className={cn(
                  'group block cursor-pointer rounded-2xl border px-4 py-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  isSuggested
                    ? 'border-accent bg-amber-50'
                    : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50'
                )}
              >
                <div className="flex min-h-11 items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{option.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{option.code}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-0.5">
                    Select →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
