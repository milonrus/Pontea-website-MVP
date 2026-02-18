'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getPricingPlans } from './data';
import { PricingLocale, RuPricingPlan } from './types';
import VariantConversionFocus from './VariantConversionFocus';
import PricingPrepaymentStrip from './PricingPrepaymentStrip';
import { getRequiredPublicEnv } from '@/lib/env/public';

const PricingLeadModal = dynamic(() => import('./PricingLeadModal'), { ssr: false });

const SUPPORT_TELEGRAM_URL = getRequiredPublicEnv('NEXT_PUBLIC_SUPPORT_TELEGRAM_URL');

interface PricingRuProps {
  locale?: PricingLocale;
}

const PricingRu: React.FC<PricingRuProps> = ({ locale = 'ru' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<RuPricingPlan | null>(null);
  const [isPrepaymentFlowOpen, setIsPrepaymentFlowOpen] = useState(false);
  const plans = getPricingPlans(locale);
  const t = locale === 'en'
    ? {
        heading: 'Choose your preparation format',
        discountHeading: 'Discount through March 7',
        supportTitle: 'Not sure which plan to choose?',
        supportSubtitle: 'We will help you choose based on your current level and admission goal',
      }
    : {
        heading: 'Выберите свой формат подготовки',
        discountHeading: 'Скидка до 7 марта',
        supportTitle: 'Не уверены, какой тариф выбрать?',
        supportSubtitle: 'Поможем подобрать формат под ваш уровень и цель поступления',
      };

  const handleBuy = (plan: RuPricingPlan) => {
    setSelectedPlan(plan);
  };

  useEffect(() => {
    if (searchParams.get('openPricing') !== '1') {
      return;
    }

    const planId = searchParams.get('pricingPlan');
    const planFromQuery = plans.find((plan) => plan.id === planId);

    if (planFromQuery) {
      setSelectedPlan(planFromQuery);
    }

    const nextSearch = new URLSearchParams(searchParams.toString());
    nextSearch.delete('openPricing');
    nextSearch.delete('pricingPlan');

    const nextQuery = nextSearch.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, plans, router, searchParams]);

  const variantProps = {
    plans,
    onBuy: handleBuy,
    locale,
  };

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto text-center">
          <h2 className="text-3xl font-display font-bold text-primary md:text-5xl lg:whitespace-nowrap">
            {t.heading}
          </h2>
          <p className="mt-3 text-base font-semibold text-primary md:text-2xl">
            {t.discountHeading}
          </p>
        </div>

        <div id="pricing-cards" className="mt-8 scroll-mt-12 md:scroll-mt-16">
          <VariantConversionFocus {...variantProps} />
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(260px,0.85fr)] lg:items-stretch">
          <PricingPrepaymentStrip
            locale={locale}
            onOpen={() => setIsPrepaymentFlowOpen(true)}
          />

          <a
            href={SUPPORT_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-primary">
                {t.supportTitle}
              </div>
              <div className="text-xs text-gray-500">
                {t.supportSubtitle}
              </div>
            </div>
          </a>
        </div>
      </div>

      <PricingLeadModal
        isOpen={isPrepaymentFlowOpen}
        onClose={() => setIsPrepaymentFlowOpen(false)}
        plan={null}
        locale={locale}
        mode="prepayment"
      />

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
