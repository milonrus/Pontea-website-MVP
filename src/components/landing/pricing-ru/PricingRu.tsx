'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';
import { getPricingPlans } from './data';
import { PricingLocale, RuPricingPlan } from './types';
import VariantConversionFocus from './VariantConversionFocus';
import { getRequiredPublicEnv } from '@/lib/env/public';

const PricingLeadModal = dynamic(() => import('./PricingLeadModal'), { ssr: false });

const SUPPORT_TELEGRAM_URL = getRequiredPublicEnv('NEXT_PUBLIC_SUPPORT_TELEGRAM_URL');

interface PricingRuProps {
  locale?: PricingLocale;
}

const PricingRu: React.FC<PricingRuProps> = ({ locale = 'ru' }) => {
  const [selectedPlan, setSelectedPlan] = useState<RuPricingPlan | null>(null);
  const plans = getPricingPlans(locale);
  const t = locale === 'en'
    ? {
        heading: 'Choose your preparation format',
        supportTitle: 'Not sure which plan to choose?',
        supportSubtitle: 'We will help you choose based on your current level and admission goal',
      }
    : {
        heading: 'Выберите свой формат подготовки',
        supportTitle: 'Не уверены, какой тариф выбрать?',
        supportSubtitle: 'Поможем подобрать формат под ваш уровень и цель поступления',
      };

  const handleBuy = (plan: RuPricingPlan) => {
    setSelectedPlan(plan);
  };

  const variantProps = {
    plans,
    onBuy: handleBuy,
    locale,
  };

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto text-center">
          <h2 className="text-3xl font-display font-bold text-primary md:text-5xl md:whitespace-nowrap">
            {t.heading}
          </h2>
        </div>

        <div id="pricing-cards" className="mt-8 scroll-mt-12 md:scroll-mt-16">
          <VariantConversionFocus {...variantProps} />
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <a
            href={SUPPORT_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/15">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-primary">
                {t.supportTitle}
              </div>
              <div className="text-xs text-gray-500">
                {t.supportSubtitle}
              </div>
            </div>
            <span className="flex-shrink-0 text-lg text-primary">&rarr;</span>
          </a>
        </div>
      </div>

      <PricingLeadModal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan}
        locale={locale}
      />
    </section>
  );
};

export default PricingRu;
