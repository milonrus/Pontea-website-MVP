import React, { useState } from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/shared/Button';
import PaymentModal from '@/components/shared/PaymentModal';
import { PlanTier } from '@/types';

const TIERS: PlanTier[] = [
  {
    name: 'База',
    price: 690,
    priceRub: 75000,
    features: ['Конспекты теории (250+ страниц)', '1000+ тренировочных вопросов', 'Пробные экзамены'],
    missingFeatures: ['Видеолекции', 'Живые семинары', 'Отслеживание прогресса', 'Чат с поддержкой', 'Индивидуальные занятия 1-на-1'],
  },
  {
    name: 'Полный курс',
    price: 1190,
    priceRub: 130000,
    recommended: true,
    features: ['Конспекты теории (250+ страниц)', '1000+ тренировочных вопросов', 'Пробные экзамены', '40+ часов видеолекций', 'Еженедельные живые семинары', 'Мониторинг прогресса', 'Групповой чат поддержки'],
    missingFeatures: ['Персональная программа подготовки', 'Индивидуальные занятия 1-на-1'],
  },
  {
    name: 'VIP',
    price: 2750,
    priceRub: 300000,
    features: ['Все из тарифа «Полный курс»', 'Персональная программа подготовки', 'Индивидуальные занятия с преподавателями 1-на-1', '3 консультации с основателями', 'Приоритетная поддержка'],
    missingFeatures: [],
  }
];

const Pricing: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary">Выбери свой способ подготовки</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`
                relative bg-white rounded-2xl p-8 transition-all duration-300
                ${tier.recommended ? 'border-2 border-accent shadow-xl scale-105 z-10' : 'border border-gray-200 shadow-sm hover:shadow-lg'}
              `}
            >
              {tier.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-primary font-bold px-6 py-1.5 rounded-full text-sm whitespace-nowrap">
                  Самый популярный
                </div>
              )}

              <h3 className="text-2xl font-display font-bold text-primary mb-2">{tier.name}</h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">€{tier.price}</span>
                  <span className="text-sm text-gray-400">или</span>
                  <span className="text-lg font-bold text-green-600">€{Math.round(tier.price / 6)}/мес</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  ≈ {tier.priceRub.toLocaleString('ru-RU')}&nbsp;₽ · рассрочка на 6 мес
                </div>
              </div>

              <Button
                variant={tier.recommended ? 'primary' : 'outline'}
                fullWidth
                onClick={() => setSelectedTier(tier)}
                className="mb-8"
              >
                Купить
              </Button>

              <div className="space-y-4">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
                {tier.missingFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-50">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                      <X className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-gray-500 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-xl mx-auto mt-12">
          <Link
            href="/consultation"
            className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-primary">Нужна помощь с выбором или оплатой?</div>
              <div className="text-xs text-gray-500">Запишись на бесплатную консультацию</div>
            </div>
            <span className="text-primary text-lg flex-shrink-0">&rarr;</span>
          </Link>
        </div>
      </div>

      {selectedTier && (
        <PaymentModal
          isOpen={!!selectedTier}
          onClose={() => setSelectedTier(null)}
          tierName={selectedTier.name}
          price={selectedTier.price}
        />
      )}
    </section>
  );
};

export default Pricing;
