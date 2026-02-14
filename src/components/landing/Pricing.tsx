import React, { useState } from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/shared/Button';
import PaymentModal from '@/components/shared/PaymentModal';
import PricingRu from '@/components/landing/pricing-ru/PricingRu';
import { PlanTier } from '@/types';

interface PricingProps {
  locale?: 'en' | 'ru';
}

const getTiers = (locale: 'en' | 'ru' = 'ru'): PlanTier[] => [
  {
    name: locale === 'en' ? 'Start' : 'Старт',
    price: 690,
    priceRub: 75000,
    features: locale === 'en' ?
      ['Access to the platform with video lessons, practice tasks, and theory'] :
      ['Доступ к платформе с видео, задачками и теорией'],
    missingFeatures: locale === 'en' ?
      ['Mentor with bi-weekly check-ins', 'Saturday school: group classes with instructors', 'Instructor answers and assignment discussions in the forum', '20 personal sessions with instructors', 'Personal mentor calls, chat, and anytime support', 'Strategic sessions with the school founders'] :
      ['Ментор с check-in каждые 2 недели', 'Субботняя школа: занятия с преподавателями в группе', 'Ответы от преподавателей и обсуждение заданий в форуме', '20 персональных занятий с преподавателями', 'Персональные созвоны с ментором, чат и поддержка в любое время', 'Стратегические сессии с основательницами школы'],
  },
  {
    name: locale === 'en' ? 'Full' : 'Полный',
    price: 1190,
    priceRub: 130000,
    recommended: true,
    features: locale === 'en' ?
      ['Platform access', 'A mentor tracks progress: bi-weekly check-ins to review and adjust your roadmap', 'Saturday school: group classes with instructors', 'Instructor answers and assignment discussions in the forum'] :
      ['Доступ к платформе', 'Ментор, который следит за прогрессом: check-in каждые две недели для проверки выполнения роадмапа и его доработки', 'Субботняя школа: занятия с преподавателями в группе', 'Ответы от преподавателей, обсуждение заданий в форуме'],
    missingFeatures: locale === 'en' ?
      ['20 personal sessions with instructors (5 months x 4 sessions)', 'Personal mentor calls, chat, and anytime support', 'Strategic sessions with the school founders'] :
      ['20 персональных занятий с преподавателями (5 мес х 4 занятия)', 'Персональные созвоны с ментором, чат и поддержка в любое время', 'Стратегические сессии с основательницами школы'],
  },
  {
    name: 'Мастер',
    price: 2750,
    priceRub: 300000,
    features: locale === 'en' ?
      ['Everything in the Full plan', '20 personal sessions with instructors (5 months x 4 sessions)', 'Personal mentor calls, chat, and anytime support', 'Strategic sessions with the school founders'] :
      ['Все, что в тарифе «Полный»', '20 персональных занятий с преподавателями (5 мес х 4 занятия)', 'Персональные созвоны с ментором, чат и поддержка в любое время', 'Стратегические сессии с основательницами школы'],
    missingFeatures: [],
  }
];

const translations = {
  en: {
    heading: 'Choose your preparation plan',
    most_popular: 'Most popular',
    buy: 'Buy',
    per_month: '/mo',
    installment: '≈ €{price}/mo · 6-month installment',
    help_text: 'Need help choosing or with payment?',
    cta: 'Book a free consultation',
  },
  ru: {
    heading: 'Выбери свой способ подготовки',
    most_popular: 'Самый популярный',
    buy: 'Купить',
    per_month: '/мес',
    installment: '≈ {price}₽ · рассрочка на 6 мес',
    help_text: 'Нужна помощь с выбором или оплатой?',
    cta: 'Запишись на бесплатную консультацию',
  },
};

const Pricing: React.FC<PricingProps> = ({ locale = 'ru' }) => {
  if (locale === 'ru') {
    return <PricingRu />;
  }

  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
  const t = translations[locale];
  const TIERS = getTiers(locale);

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary">{t.heading}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`
                relative bg-white rounded-2xl p-8 transition-all duration-300
                ${tier.recommended ? 'border-2 border-accent shadow-xl md:scale-105 z-10' : 'border border-gray-200 shadow-sm hover:shadow-lg'}
              `}
            >
              {tier.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-primary font-bold px-6 py-1.5 rounded-full text-sm whitespace-nowrap">
                  {t.most_popular}
                </div>
              )}

              <h3 className="text-2xl font-display font-bold text-primary mb-2">{tier.name}</h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">€{tier.price}</span>
                  <span className="text-sm text-gray-400">{locale === 'en' ? 'or' : 'или'}</span>
                  <span className="text-lg font-bold text-green-600">€{Math.round(tier.price / 6)}{t.per_month}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {locale === 'en' ? `≈ €${Math.round(tier.price/6)}/mo · 6-month installment` : `≈ ${tier.priceRub.toLocaleString('ru-RU')}&nbsp;₽ · рассрочка на 6 мес`}
                </div>
              </div>

              <Button
                variant={tier.recommended ? 'primary' : 'outline'}
                fullWidth
                onClick={() => setSelectedTier(tier)}
                className="mb-8"
              >
                {t.buy}
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
              <div className="text-sm font-bold text-primary">{t.help_text}</div>
              <div className="text-xs text-gray-500">{t.cta}</div>
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
