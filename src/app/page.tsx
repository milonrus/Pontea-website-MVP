import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import RootLanguageProfileRedirect from '@/components/shared/RootLanguageProfileRedirect';
import { LanguageSelectorCard } from '@/components/shared/LanguageSelectorVariants';
import { getSuggestedLocaleFromAcceptLanguage } from '@/lib/i18n/routes';
import { isRuOnlyMode } from '@/lib/i18n/mode';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true
  },
  alternates: {
    canonical: '/'
  }
};

const LanguageGateway = async () => {
  if (isRuOnlyMode()) {
    redirect('/ru');
  }

  const requestHeaders = await headers();
  const suggestedLocale = getSuggestedLocaleFromAcceptLanguage(
    requestHeaders.get('accept-language')
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10 sm:px-6 sm:py-14">
      <RootLanguageProfileRedirect />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center">
        <LanguageSelectorCard suggestedLocale={suggestedLocale} />
      </div>
    </main>
  );
};

export default LanguageGateway;
