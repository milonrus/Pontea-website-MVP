import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import RootLanguageProfileRedirect from '@/components/shared/RootLanguageProfileRedirect';
import { Locale } from '@/lib/i18n/config';
import { getSuggestedLocaleFromAcceptLanguage } from '@/lib/i18n/routes';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true
  },
  alternates: {
    canonical: '/'
  }
};

const localeCardConfig: Record<Locale, {
  label: string;
  description: string;
  cta: string;
  href: string;
  flag: string;
}> = {
  ru: {
    label: 'Русский',
    description: 'Полный курс подготовки к экзамену TEST ARCHED',
    cta: 'Купить курс →',
    href: '/ru',
    flag: '🇷🇺'
  },
  en: {
    label: 'English',
    description: 'Full TEST ARCHED preparation course',
    cta: 'Register for early access →',
    href: '/en',
    flag: '🇬🇧'
  }
};

const LanguageGateway = async () => {
  const requestHeaders = await headers();
  const suggestedLocale = getSuggestedLocaleFromAcceptLanguage(
    requestHeaders.get('accept-language')
  );
  const suggestedLanguageLabel = suggestedLocale === 'ru' ? 'Русский' : 'English';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
      <RootLanguageProfileRedirect />
      <div className="max-w-2xl w-full mx-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            PONTEA
          </h1>
          <p className="text-xl text-white/80">
            TEST ARCHED Preparation Course
          </p>
          <p className="mt-3 text-sm text-white/80">
            Suggested language: <span className="font-semibold text-white">{suggestedLanguageLabel}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {(['ru', 'en'] as const).map((locale) => {
            const isSuggested = locale === suggestedLocale;
            const config = localeCardConfig[locale];

            return (
              <Link
                key={locale}
                href={config.href}
                className={`group rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                  isSuggested ? 'bg-blue-50 ring-2 ring-accent' : 'bg-white'
                }`}
              >
                <div className="text-4xl mb-4">{config.flag}</div>
                <h2 className="text-2xl font-bold text-primary mb-2">{config.label}</h2>
                <p className="text-gray-600 mb-4">{config.description}</p>
                <div className="text-primary font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  {config.cta}
                </div>
                {isSuggested && (
                  <div className="mt-3 inline-flex rounded-full bg-accent/20 px-2 py-1 text-xs font-semibold text-primary">
                    Suggested
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguageGateway;
