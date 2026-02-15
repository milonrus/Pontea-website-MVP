import React from 'react';
import { Check, X } from 'lucide-react';
import Button from '@/components/shared/Button';
import { RU_PRICING_FEATURE_ROWS, formatRub } from './data';
import { RuPricingVariantProps } from './types';

const VariantDecisionMatrix: React.FC<RuPricingVariantProps> = ({
  plans,
  onBuy,
}) => {
  return (
    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[280px_repeat(3,minmax(0,1fr))] border-b border-gray-200">
          <div className="sticky left-0 z-20 bg-white px-5 py-5">
            <h3 className="text-lg font-display font-bold text-primary">Сравнение тарифов</h3>
            <p className="mt-2 text-xs text-gray-500">
              Выберите формат подготовки по глубине сопровождения
            </p>
          </div>

          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border-l border-gray-200 px-4 py-5 ${
                plan.id === 'advanced' ? 'bg-accent/5' : 'bg-white'
              }`}
            >
              {plan.badge && (
                <div className="mb-3 inline-flex rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">
                  {plan.badge}
                </div>
              )}
              <h4 className="text-xl font-display font-bold text-primary">{plan.name}</h4>
              <p className="mt-1 min-h-[36px] text-xs text-gray-600">{plan.subtitle}</p>

              <div className="mt-4 text-3xl font-bold text-primary">€{plan.price}</div>
              <div className="mt-1 text-xs text-gray-500">{formatRub(plan.priceRub)}</div>

              <div className="mt-2 min-h-[20px] text-xs font-semibold text-green-700">
                {plan.installmentAvailable ? 'Доступна рассрочка' : ''}
              </div>

              <div className="mt-3 space-y-2">
                <Button
                  variant={plan.id === 'advanced' ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => onBuy(plan)}
                >
                  Купить
                </Button>
              </div>
            </div>
          ))}
        </div>

        {RU_PRICING_FEATURE_ROWS.map((row, rowIndex) => (
          <div
            key={row.label}
            className="grid grid-cols-[280px_repeat(3,minmax(0,1fr))] border-b border-gray-100 last:border-b-0"
          >
            <div
              className={`sticky left-0 z-10 border-r border-gray-200 px-5 py-3 text-sm text-gray-700 ${
                rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              {row.label}
            </div>
            {plans.map((plan) => {
              const hasFeature = row.availability[plan.id];

              return (
                <div
                  key={plan.id + row.label}
                  className={`flex items-center justify-center border-l border-gray-100 px-4 py-3 ${
                    rowIndex % 2 === 0 ? 'bg-gray-50/70' : 'bg-white'
                  }`}
                >
                  {hasFeature ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <X className="h-4 w-4" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariantDecisionMatrix;
