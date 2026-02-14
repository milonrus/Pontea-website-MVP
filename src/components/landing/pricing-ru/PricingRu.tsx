import React, { useState } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import PaymentModal from '@/components/shared/PaymentModal';
import { RU_PRICING_PLANS } from './data';
import { RuPricingPlan } from './types';
import VariantConversionFocus from './VariantConversionFocus';

const PricingRu: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<RuPricingPlan | null>(null);

  const handleBuy = (plan: RuPricingPlan) => {
    setSelectedPlan(plan);
  };

  const variantProps = {
    plans: RU_PRICING_PLANS,
    onBuy: handleBuy,
  };

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-display font-bold text-primary md:text-5xl">
            Тарифы подготовки к ARCHED
          </h2>
          <p className="mt-3 text-sm text-gray-600 md:text-base">
            Сравните форматы по глубине сопровождения и выберите подходящий путь к поступлению.
          </p>
        </div>

        <div className="mt-8">
          <VariantConversionFocus {...variantProps} />
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <Link
            href="/consultation"
            className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/15">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-primary">
                Не уверены, какой тариф выбрать?
              </div>
              <div className="text-xs text-gray-500">
                Поможем подобрать формат под ваш уровень и цель поступления
              </div>
            </div>
            <span className="flex-shrink-0 text-lg text-primary">&rarr;</span>
          </Link>
        </div>
      </div>

      {selectedPlan && (
        <PaymentModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          tierName={`${selectedPlan.name} · Полная стоимость`}
          price={selectedPlan.price}
        />
      )}
    </section>
  );
};

export default PricingRu;
