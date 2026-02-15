import React from 'react';
import Button from '@/components/shared/Button';
import { formatRub } from './data';
import { RuPricingVariantProps } from './types';

const VariantMentorSpotlight: React.FC<RuPricingVariantProps> = ({
  plans,
  onBuy,
}) => {
  const foundation = plans.find((plan) => plan.id === 'foundation');
  const advanced = plans.find((plan) => plan.id === 'advanced');
  const mentorship = plans.find((plan) => plan.id === 'mentorship');

  if (!foundation || !advanced || !mentorship) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1.1fr_1.4fr]">
      {[foundation, advanced].map((plan) => (
        <article
          key={plan.id}
          className={`rounded-3xl border bg-white p-6 shadow-sm ${
            plan.id === 'advanced' ? 'border-accent/60 bg-accent/5' : 'border-gray-200'
          }`}
        >
          {plan.badge && (
            <div className="mb-3 inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
              {plan.badge}
            </div>
          )}

          <h3 className="text-2xl font-display font-bold text-primary">{plan.name}</h3>
          <p className="mt-2 text-sm text-gray-600">{plan.subtitle}</p>
          {plan.includesFrom && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {plan.includesFrom}
            </p>
          )}

          <div className="mt-5 border-y border-gray-200 py-4">
            <div className="text-4xl font-bold text-primary">€{plan.price}</div>
            <div className="mt-1 text-xs text-gray-500">{formatRub(plan.priceRub)}</div>
            {plan.installmentAvailable && (
              <div className="mt-3 inline-flex rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                Доступна рассрочка
              </div>
            )}
          </div>

          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            {plan.summary.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary/60" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2">
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

      <article className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-amber-50 p-6 shadow-xl md:p-7">
        <div className="mb-3 inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
          {mentorship.badge}
        </div>
        <h3 className="text-3xl font-display font-bold text-primary">{mentorship.name}</h3>
        <p className="mt-2 text-sm text-gray-700">{mentorship.subtitle}</p>

        <div className="mt-5 rounded-2xl border border-primary/15 bg-white p-4">
          <div className="text-5xl font-bold leading-none text-primary">€{mentorship.price}</div>
          <div className="mt-2 text-xs text-gray-500">{formatRub(mentorship.priceRub)}</div>
          <div className="mt-3 inline-flex rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            Доступна рассрочка
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {mentorship.includesFrom}
        </p>

        <div className="mt-4 space-y-3">
          {mentorship.groups.map((group) => (
            <section key={group.title} className="rounded-2xl border border-red-100 bg-white/80 p-3.5">
              <h4 className="text-sm font-bold text-primary">
                {group.icon} {group.title}
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {group.items.slice(0, 2).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {mentorship.bonus && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Бонус</p>
            <p className="mt-1 text-sm text-red-900">{mentorship.bonus}</p>
          </div>
        )}

        <div className="mt-5 space-y-2">
          <Button variant="primary" fullWidth onClick={() => onBuy(mentorship)}>
            Купить
          </Button>
        </div>
      </article>
    </div>
  );
};

export default VariantMentorSpotlight;
