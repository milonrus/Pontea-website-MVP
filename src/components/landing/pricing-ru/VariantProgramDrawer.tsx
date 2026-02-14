import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '@/components/shared/Button';
import { formatRub } from './data';
import { RuPricingPlanId, RuPricingVariantProps } from './types';

const VariantProgramDrawer: React.FC<RuPricingVariantProps> = ({
  plans,
  onBuy,
}) => {
  const [openPlanId, setOpenPlanId] = useState<RuPricingPlanId | null>('advanced');

  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const isOpen = plan.id === openPlanId;

        return (
          <article
            key={plan.id}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-display font-bold text-primary">{plan.name}</h3>
                  {plan.badge && (
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{plan.subtitle}</p>
                {plan.includesFrom && (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {plan.includesFrom}
                  </p>
                )}

                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  {plan.summary.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary/60" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:min-w-[250px]">
                <div className="text-4xl font-bold leading-none text-primary">€{plan.price}</div>
                <div className="mt-2 text-xs text-gray-500">{formatRub(plan.priceRub)}</div>
                {plan.installmentAvailable && (
                  <div className="mt-3 inline-flex rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Доступна рассрочка
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <Button
                    variant={plan.id === 'advanced' ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => onBuy(plan)}
                  >
                    Купить
                  </Button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-primary hover:bg-gray-50"
              onClick={() => setOpenPlanId(isOpen ? null : plan.id)}
            >
              {isOpen ? 'Свернуть программу' : 'Смотреть программу'}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {plan.groups.map((group) => (
                  <section key={group.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h4 className="text-sm font-bold text-primary">
                      {group.icon} {group.title}
                    </h4>
                    <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary/60" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {isOpen && plan.bonus && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <span className="font-semibold">Бонус: </span>
                {plan.bonus}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default VariantProgramDrawer;
