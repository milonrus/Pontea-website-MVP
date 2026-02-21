import React from 'react';
import Link from 'next/link';
import Hero from '@/components/landing/Hero';
import Testimonials from '@/components/landing/Testimonials';
import StressManagementTimeline from '@/components/landing/StressManagementTimeline';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import ExperienceBanner from '@/components/landing/ExperienceBanner';
import PlatformShowcase from '@/components/landing/PlatformShowcaseVariations';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import MarketingHeader from '@/components/shared/MarketingHeader';
import { getRequiredPublicEnv } from '@/lib/env/public';

interface LandingPageProps {
  locale?: 'en' | 'ru';
}

const LandingPage: React.FC<LandingPageProps> = ({ locale = 'ru' }) => {
  const localeHome = locale === 'en' ? '/' : '/ru/';
  const supportTelegramUrl = getRequiredPublicEnv('NEXT_PUBLIC_SUPPORT_TELEGRAM_URL');

  const footerT = {
    en: { tagline: 'Architecture Entrance Prep', methodology: 'Methodology', pricing: 'Pricing', contact: 'Contact' },
    ru: { tagline: 'Подготовка к архитектурным экзаменам', methodology: 'Методология', pricing: 'Цены', contact: 'Контакты' }
  }[locale];

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader locale={locale} />
      <Hero locale={locale} />
      <PlatformShowcase locale={locale} />
      <ExperienceBanner locale={locale} />
      <Testimonials locale={locale} />
      <StressManagementTimeline locale={locale} />
      <Pricing locale={locale} />
      <FAQ locale={locale} />

      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-2xl font-display font-bold mb-2">PONTEA</div>
              <p className="text-blue-200 text-sm">{footerT.tagline}</p>
            </div>
            <div className="flex gap-8 text-sm text-blue-200">
              <Link href={localeHome} className="hover:text-white py-2">{footerT.methodology}</Link>
              <a href="#pricing-cards" className="hover:text-white py-2">{footerT.pricing}</a>
              <a href={supportTelegramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white py-2">
                {footerT.contact}
              </a>
            </div>
            <div className="flex flex-col items-center md:items-end gap-3">
              <LanguageSwitcher className="bg-white/95" />
              <div className="text-xs text-blue-300">
                © 2025 Pontea School.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
