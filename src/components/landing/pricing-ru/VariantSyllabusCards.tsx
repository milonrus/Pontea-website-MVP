import React from 'react';
import Button from '@/components/shared/Button';
import { formatRub } from './data';
import { RuPricingPlan, RuPricingVariantProps } from './types';

const cardTheme: Record<RuPricingPlan['id'], string> = {
  foundation: 'border-blue-100 bg-white',
  advanced: 'border-accent/70 bg-accent/5 shadow-lg',
  mentorship: 'border-red-200 bg-red-50/40',
};

const VariantSyllabusCards: React.FC<RuPricingVariantProps> = ({
  plans,
  onBuy,
}) => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={`rounded-3xl border p-6 md:p-7 transition-shadow hover:shadow-xl ${cardTheme[plan.id]}`}
        >
          {plan.badge && (
            <div className="mb-4 inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
              {plan.badge}
            </div>
          )}

          <h3 className="text-2xl font-display font-bold text-primary">{plan.name}</h3>
          <p className="mt-2 text-sm text-gray-600">{plan.subtitle}</p>

          <div className="mt-5 border-y border-gray-200 py-4">
            <div className="text-5xl font-bold leading-none text-primary">€{plan.price}</div>
            <div className="mt-2 text-xs text-gray-500">{formatRub(plan.priceRub)}</div>
            {plan.installmentAvailable && (
              <div className="mt-3 inline-flex rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                Доступна рассрочка
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <Button
              variant={plan.id === 'advanced' ? 'primary' : 'outline'}
              fullWidth
              onClick={() => onBuy(plan)}
            >
              Купить
            </Button>
          </div>

          {plan.includesFrom && (
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {plan.includesFrom}
            </p>
          )}

          <div className="mt-4 space-y-4">
            {plan.groups.map((group) => {
              const visibleItems = group.items.slice(0, 3);
              const hiddenCount = group.items.length - visibleItems.length;

              return (
                <section key={group.title}>
                  <h4 className="mb-2 text-sm font-bold text-primary">
                    <span className="mr-1">{group.icon}</span>
                    {group.title}
                  </h4>
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {visibleItems.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {hiddenCount > 0 && (
                    <p className="mt-1 text-xs font-medium text-gray-500">
                      +{hiddenCount} пункта в полной программе
                    </p>
                  )}
                </section>
              );
            })}
          </div>

          {plan.bonus && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Бонус</p>
              <p className="mt-1 text-sm text-red-900">{plan.bonus}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default VariantSyllabusCards;
