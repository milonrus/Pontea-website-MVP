import React from 'react';
import Button from '@/components/shared/Button';
import { formatRub } from './data';
import { RuPricingVariantProps } from './types';

const VariantLearningPath: React.FC<RuPricingVariantProps> = ({
  plans,
  onBuy,
}) => {
  return (
    <div className="relative space-y-6 md:space-y-8">
      <div className="pointer-events-none absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-blue-200 via-accent to-red-200 md:block" />

      {plans.map((plan, index) => (
        <article
          key={plan.id}
          className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:ml-12 md:p-8"
        >
          <div className="absolute -left-[57px] top-8 hidden h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-white text-sm font-bold text-primary md:flex">
            {index + 1}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-display font-bold text-primary">{plan.name}</h3>
                {plan.badge && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                    {plan.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">{plan.subtitle}</p>
              {plan.includesFrom && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {plan.includesFrom}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 md:min-w-[210px]">
              <div className="text-4xl font-bold leading-none text-primary">€{plan.price}</div>
              <div className="mt-2 text-xs text-gray-500">{formatRub(plan.priceRub)}</div>
              {plan.installmentAvailable && (
                <div className="mt-3 rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                  Доступна рассрочка
                </div>
              )}
            </div>
          </div>

          <ul className="mt-5 grid gap-2 text-sm text-gray-700 md:grid-cols-3">
            {plan.summary.map((point) => (
              <li key={point} className="rounded-xl bg-gray-50 px-3 py-2">
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            {plan.groups.slice(0, 3).map((group) => (
              <span
                key={group.title}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600"
              >
                {group.icon} {group.title}
              </span>
            ))}
          </div>

          <div className="mt-5">
            <Button
              variant={plan.id === 'advanced' ? 'primary' : 'outline'}
              fullWidth
              onClick={() => onBuy(plan)}
            >
              Купить
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default VariantLearningPath;
