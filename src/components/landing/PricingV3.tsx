import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, MessageCircle, Star, Zap } from 'lucide-react';
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

// Reverse: VIP at top, Base at bottom
const TIERS_REVERSED = [...TIERS].reverse();

const JOURNEY_LABELS = ['Вершина', 'Цель', 'Старт'];
const JOURNEY_ICONS = [
  <Crown key="crown" className="w-5 h-5" />,
  <Star key="star" className="w-5 h-5" />,
  <Zap key="zap" className="w-5 h-5" />,
];

const PricingV3: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);

  return (
    <section id="pricing" className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-accent/5 via-white to-blue-50/30">
      {/* SVG Path */}
      <svg className="absolute left-0 top-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          <linearGradient id="journeyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFC857" />
            <stop offset="50%" stopColor="#01278b" />
            <stop offset="100%" stopColor="#4ecca3" />
          </linearGradient>
        </defs>
        {/* Glow layer */}
        <motion.line
          x1="80" y1="120"
          x2="80" y2="95%"
          stroke="url(#journeyGradient)"
          strokeWidth="8"
          opacity="0.15"
          filter="blur(8px)"
          className="hidden md:block"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        {/* Main line */}
        <motion.line
          x1="80" y1="120"
          x2="80" y2="95%"
          stroke="url(#journeyGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          className="hidden md:block"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </svg>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary mb-4">
            Твой путь к поступлению
          </h2>
          <p className="text-gray-500 text-lg">Каждый тариф — шаг к цели</p>
        </motion.div>

        <div className="space-y-8 md:space-y-12">
          {TIERS_REVERSED.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              {/* Journey marker - desktop */}
              <div className="hidden md:flex absolute left-[-52px] top-8 items-center">
                <motion.div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center z-10 border-4
                    ${tier.recommended
                      ? 'bg-primary text-white border-primary shadow-lg'
                      : index === 0
                        ? 'bg-gradient-to-br from-accent to-yellow-400 text-primary border-accent shadow-lg'
                        : 'bg-white text-primary border-gray-200'
                    }
                  `}
                  animate={tier.recommended ? { scale: [1, 1.1, 1] } : undefined}
                  transition={tier.recommended ? { duration: 2, repeat: Infinity } : undefined}
                >
                  {JOURNEY_ICONS[index]}
                </motion.div>
                {tier.recommended && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Card */}
              <div
                className={`
                  md:ml-12 rounded-2xl border-2 overflow-hidden transition-all duration-300
                  ${tier.recommended
                    ? 'border-primary shadow-xl bg-white'
                    : index === 0
                      ? 'border-accent/40 shadow-lg bg-white'
                      : 'border-gray-200 shadow-sm bg-white hover:shadow-md'
                  }
                `}
              >
                {/* VIP gold top border */}
                {index === 0 && (
                  <div className="h-1.5 bg-gradient-to-r from-accent via-yellow-400 to-accent" />
                )}

                {tier.recommended && (
                  <div className="bg-primary text-white text-center py-2 text-sm font-bold">
                    Самый популярный выбор
                  </div>
                )}

                <div className="p-6 md:p-8">
                  {/* Mobile journey label */}
                  <div className="md:hidden flex items-center gap-2 mb-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${tier.recommended ? 'bg-primary text-white' : index === 0 ? 'bg-accent text-primary' : 'bg-gray-100 text-primary'}
                    `}>
                      {JOURNEY_ICONS[index]}
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{JOURNEY_LABELS[index]}</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Left: price + CTA */}
                    <div className="md:w-1/3 flex-shrink-0">
                      <h3 className="text-2xl font-display font-bold text-primary mb-1">{tier.name}</h3>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-bold text-primary">€{tier.price}</span>
                      </div>
                      <div className="text-sm text-gray-400 mb-1">
                        ≈ {tier.priceRub.toLocaleString('ru-RU')}&nbsp;₽
                      </div>
                      <div className="text-green-600 text-sm font-medium mb-4">
                        или {Math.round(tier.price / 6)} €/мес в рассрочку
                      </div>
                      <Button
                        variant={tier.recommended ? 'primary' : 'outline'}
                        fullWidth
                        onClick={() => setSelectedTier(tier)}
                      >
                        Купить
                      </Button>
                    </div>

                    {/* Right: features as pills */}
                    <div className="md:w-2/3 flex flex-wrap gap-2">
                      {tier.features.map((feature, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-14"
        >
          <Link
            href="/ru"
            className="inline-flex items-center gap-2 text-primary hover:text-highlight font-medium transition-colors text-base border-b-2 border-dashed border-primary/30 hover:border-highlight/50 pb-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            Нужна помощь с выбором или оплатой?
          </Link>
        </motion.div>
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

export default PricingV3;
