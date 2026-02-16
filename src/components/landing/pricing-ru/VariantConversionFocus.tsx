import React from 'react';
import { BadgeCheck } from 'lucide-react';
import Button from '@/components/shared/Button';
import {
  formatEurPerMonth,
  getPlanInstallmentMonthlyRub,
  getPricingPrimaryCtaLabel,
} from './data';
import { RuPricingPlan, RuPricingVariantProps } from './types';

const visualByPlan: Record<
  RuPricingPlan['id'],
  {
    frame: string;
  }
> = {
  foundation: {
    frame: 'border-blue-100 bg-white',
  },
  advanced: {
    frame: 'border-accent bg-gradient-to-b from-accent/20 via-white to-white shadow-xl ring-2 ring-accent/50',
  },
  mentorship: {
    frame: 'border-red-200 bg-gradient-to-b from-red-50/70 to-white',
  },
};

const VariantConversionFocus: React.FC<RuPricingVariantProps> = ({
  plans,
  onBuy,
  locale,
}) => {
  const formatRubAmount = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

  const inheritedPlanPoints = locale === 'en'
    ? ['Includes everything in Starter', 'Includes everything in Core']
    : ['Включает всё из Стартового', 'Включает всё из Основного'];

  const t = locale === 'en'
    ? {
        installmentHint: 'Installments available',
      }
    : {
        installmentHintPrefix: 'Доступна оплата частями от',
        installmentHintSuffix: 'в мес',
      };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {plans.map((plan) => {
        const visual = visualByPlan[plan.id];
        const isRecommended = plan.id === 'advanced';
        const showTopBadge = plan.badge && plan.id !== 'mentorship';

        return (
          <article
            key={plan.id}
            className={`flex h-full flex-col rounded-3xl border p-6 md:p-7 ${visual.frame}`}
          >
            <div className="mt-3 flex items-start justify-between gap-3">
              <h4 className="text-2xl font-display font-bold text-primary">{plan.name}</h4>
              {showTopBadge && (
                <div className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-gray-800">{plan.subtitle}</p>

            <div className="mt-5 border-y border-gray-200 py-4">
              <div className="flex items-end gap-2 text-primary">
                <span className="text-3xl font-bold leading-none md:text-4xl">€{plan.price}</span>
                <span className="pb-1 text-sm font-semibold text-primary/80">
                  = €{formatEurPerMonth(plan.price)}/{locale === 'en' ? 'mo' : 'мес'}
                </span>
              </div>
              {locale === 'ru' ? (
                <div className="mt-2 text-xs text-gray-500">
                  {`${plan.priceRub.toLocaleString('ru-RU')} ₽ за 5 месяцев`}
                </div>
              ) : null}
            </div>

            <ul className="mt-4 flex-1 space-y-2.5 text-sm text-gray-700">
              {plan.summary.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 flex-none text-green-600" />
                  <span
                    className={
                      inheritedPlanPoints.some((prefix) => point.startsWith(prefix))
                        ? 'font-bold text-gray-800'
                        : undefined
                    }
                  >
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-1.5">
              <Button
                variant={isRecommended ? 'primary' : 'outline'}
                fullWidth
                onClick={() => onBuy(plan)}
              >
                {getPricingPrimaryCtaLabel(locale, plan.id)}
              </Button>
              <p className="text-center text-xs font-medium text-gray-500">
                {locale === 'en'
                  ? t.installmentHint
                  : `${t.installmentHintPrefix} ${formatRubAmount(getPlanInstallmentMonthlyRub(plan))} ${t.installmentHintSuffix}`}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default VariantConversionFocus;
