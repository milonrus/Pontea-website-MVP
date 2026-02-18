'use client';

import React, { useEffect, useMemo } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getRequiredPublicEnv } from '@/lib/env/public';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { getPricingPlans } from './data';
import PricingEurInvoiceFlow from './PricingEurInvoiceFlow';
import { InvoiceRequestMode, PricingLocale, RuPricingPlan } from './types';
import { isEurPlanId, PRICING_MODAL_TEXT } from './pricingLeadShared';

interface InvoiceRequestPageClientProps {
  locale?: PricingLocale;
}

type EurPlan = RuPricingPlan & { id: 'foundation' | 'advanced' | 'mentorship' };
const DEFAULT_PLAN_ID: EurPlan['id'] = 'advanced';
const isInvoiceRequestMode = (value: string | null): value is InvoiceRequestMode =>
  value === 'default' || value === 'prepayment';

const InvoiceRequestPageClient: React.FC<InvoiceRequestPageClientProps> = ({ locale = 'ru' }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const supportTelegramUrl = getRequiredPublicEnv('NEXT_PUBLIC_SUPPORT_TELEGRAM_URL');
  const t = PRICING_MODAL_TEXT[locale];
  const homePath = locale === 'en' ? '/' : '/ru/';

  const eurPlans = useMemo(
    () =>
      getPricingPlans(locale).filter(
        (plan): plan is EurPlan =>
          plan.id === 'foundation' || plan.id === 'advanced' || plan.id === 'mentorship'
      ),
    [locale]
  );

  const modeParam = searchParams.get('mode');
  const mode: InvoiceRequestMode = isInvoiceRequestMode(modeParam) ? modeParam : 'default';

  const pageTitle = mode === 'prepayment'
    ? t.invoicePageTitlePrepayment
    : t.invoicePageTitle;

  const planParam = searchParams.get('plan');
  const normalizedPlanParam = planParam === 'individual' ? 'mentorship' : planParam;
  const selectedPlanId: EurPlan['id'] = isEurPlanId(normalizedPlanParam)
    ? normalizedPlanParam
    : DEFAULT_PLAN_ID;
  const selectedPlan = eurPlans.find((plan) => plan.id === selectedPlanId)
    || eurPlans.find((plan) => plan.id === DEFAULT_PLAN_ID)
    || eurPlans[0]
    || null;

  useEffect(() => {
    if (mode === 'prepayment') {
      return;
    }

    if (isEurPlanId(normalizedPlanParam) && planParam === normalizedPlanParam) {
      return;
    }

    const nextSearch = new URLSearchParams(searchParams.toString());
    nextSearch.set('plan', isEurPlanId(normalizedPlanParam) ? normalizedPlanParam : DEFAULT_PLAN_ID);
    router.replace(`${pathname}?${nextSearch.toString()}`, { scroll: false });
  }, [mode, normalizedPlanParam, pathname, planParam, router, searchParams]);

  const handleBackToPricingModal = () => {
    if (mode === 'prepayment') {
      router.push(`${homePath}#pricing-cards`);
      return;
    }

    const nextSearch = new URLSearchParams();
    nextSearch.set('openPricing', '1');
    if (selectedPlan) {
      nextSearch.set('pricingPlan', selectedPlan.id);
    }

    router.push(`${homePath}?${nextSearch.toString()}#pricing-cards`);
  };

  const handleCloseToPricing = () => {
    router.push(`${homePath}#pricing-cards`);
  };

  const missingPlanText = locale === 'en'
    ? 'EUR plans are temporarily unavailable.'
    : 'Тарифы в EUR временно недоступны.';

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1240px] px-3 pb-8 pt-3 sm:px-5 sm:pb-10 sm:pt-4 lg:px-8 lg:pb-16 lg:pt-6">
        <div className="mx-auto w-full max-w-[940px] lg:max-w-[980px] xl:max-w-[1040px]">
          <header className="border-b border-gray-200 pb-4 sm:pb-5">
            <div className="flex flex-col gap-3 md:hidden">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleBackToPricingModal}
                  className="inline-flex h-9 w-9 flex-none items-center justify-center gap-0 rounded-md px-0 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 min-[400px]:w-auto min-[400px]:gap-1 min-[400px]:px-1.5"
                  aria-label={t.back}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden text-[14px] font-medium min-[400px]:inline">{t.back}</span>
                </button>
                <a
                  href={supportTelegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex h-9 items-center whitespace-nowrap rounded-md border border-gray-200 px-2 text-[11px] font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  {t.support}
                </a>
                <LanguageSwitcher className="[&>button]:h-9 [&>button]:min-h-9 [&>button]:min-w-9 [&>button]:px-2" />
                <button
                  type="button"
                  onClick={handleCloseToPricing}
                  className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                  aria-label={t.close}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <h1 className="text-[28px] font-display font-bold leading-tight text-primary">
                {pageTitle}
              </h1>
            </div>

            <div className="hidden md:flex lg:hidden md:items-center md:justify-between md:gap-4">
              <div className="min-w-0 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBackToPricingModal}
                  className="inline-flex h-10 flex-none items-center gap-1 rounded-md px-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t.back}</span>
                </button>

                <h1 className="min-w-0 text-xl font-display font-bold leading-tight text-primary lg:text-2xl">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <a
                  href={supportTelegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-gray-200 px-4 text-sm font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  {t.support}
                </a>
                <LanguageSwitcher className="[&>button]:h-10 [&>button]:min-h-10 [&>button]:min-w-10 [&>button]:px-3" />
                <button
                  type="button"
                  onClick={handleCloseToPricing}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                  aria-label={t.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
              <div className="relative min-w-0 flex-1 lg:pl-[118px] xl:pl-[114px]">
                <button
                  type="button"
                  onClick={handleBackToPricingModal}
                  className="absolute left-0 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1 rounded-md px-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t.back}</span>
                </button>

                <h1 className="min-w-0 text-2xl font-display font-bold leading-tight text-primary">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <a
                  href={supportTelegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center whitespace-nowrap rounded-lg border border-gray-200 px-4 text-sm font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  {t.support}
                </a>
                <LanguageSwitcher className="[&>button]:h-10 [&>button]:min-h-10 [&>button]:min-w-10 [&>button]:px-3" />
                <button
                  type="button"
                  onClick={handleCloseToPricing}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                  aria-label={t.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>
        </div>

        <section className="mx-auto mt-5 w-full max-w-[940px] lg:mt-6 lg:max-w-[980px] xl:max-w-[1040px]">
          {selectedPlan || mode === 'prepayment' ? (
            <PricingEurInvoiceFlow
              plan={selectedPlan}
              mode={mode}
              locale={locale}
              onClose={handleCloseToPricing}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-slate-600">
              {missingPlanText}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InvoiceRequestPageClient;
