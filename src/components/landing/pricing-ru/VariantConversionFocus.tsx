import React from 'react';
import { BadgeCheck } from 'lucide-react';
import Button from '@/components/shared/Button';
import {
  formatEurPerMonth,
  formatFullPriceLine,
  RU_PRICING_PRIMARY_CTA_LABEL_BY_PLAN,
} from './data';
import { RuPricingPlan, RuPricingVariantProps } from './types';

const visualByPlan: Record<
  RuPricingPlan['id'],
  {
    frame: string;
    valueText: string;
  }
> = {
  foundation: {
    frame: 'border-blue-100 bg-white',
    valueText: 'Идеальный старт для тех, кто готовится самостоятельно',
  },
  advanced: {
    frame: 'border-accent bg-gradient-to-b from-accent/20 via-white to-white shadow-xl ring-2 ring-accent/50',
    valueText: 'Оптимальный баланс практики, сопровождения и обратной связи',
  },
  mentorship: {
    frame: 'border-red-200 bg-gradient-to-b from-red-50/70 to-white',
    valueText: 'Максимум персонального внимания и стратегической поддержки',
  },
};

const includeLabelByPlan: Record<RuPricingPlan['id'], string> = {
  foundation: 'Что включено',
  advanced: 'Всё из Foundation, а также',
  mentorship: 'Всё из Advanced, а также',
};

const VariantConversionFocus: React.FC<RuPricingVariantProps> = ({
  plans,
  onBuy,
}) => {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {plans.map((plan) => {
        const visual = visualByPlan[plan.id];
        const isRecommended = plan.id === 'advanced';
        const showTopBadge = plan.badge && plan.badge !== 'Количество мест ограничено';

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
            <p className="mt-2 text-sm font-medium text-gray-800">{visual.valueText}</p>

            <div className="mt-5 border-y border-gray-200 py-4">
              <div className="flex items-end gap-1.5 text-primary">
                <span className="text-5xl font-bold leading-none">€{formatEurPerMonth(plan.price)}</span>
                <span className="pb-1 text-sm font-semibold">/мес</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {formatFullPriceLine(plan.price, plan.priceRub)}
              </div>
            </div>

            <div className="mt-4 min-h-6">
              <p
                className={`text-sm font-semibold ${
                  isRecommended ? 'text-primary' : 'text-primary/85'
                }`}
              >
                {includeLabelByPlan[plan.id]}
              </p>
            </div>

            <ul className="mt-3 flex-1 space-y-2.5 text-sm text-gray-700">
              {plan.summary.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 flex-none text-green-600" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-1.5">
              <Button
                variant={isRecommended ? 'primary' : 'outline'}
                fullWidth
                onClick={() => onBuy(plan)}
              >
                {RU_PRICING_PRIMARY_CTA_LABEL_BY_PLAN[plan.id]}
              </Button>
              <p className="text-center text-xs font-medium text-gray-500">
                Доступна рассрочка
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default VariantConversionFocus;
