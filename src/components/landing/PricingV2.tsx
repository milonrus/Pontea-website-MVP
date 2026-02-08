import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MessageCircle, Calculator } from 'lucide-react';
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

const ALL_FEATURES = [
  'Конспекты теории (250+ страниц)',
  '1000+ тренировочных вопросов',
  'Пробные экзамены',
  'Видеолекции (40+ часов)',
  'Еженедельные живые семинары',
  'Мониторинг прогресса',
  'Групповой чат поддержки',
  'Персональная программа подготовки',
  'Индивидуальные занятия 1-на-1',
  'Консультации с основателями',
  'Приоритетная поддержка',
];

const FEATURE_MAP: Record<string, boolean[]> = {
  'Конспекты теории (250+ страниц)':     [true, true, true],
  '1000+ тренировочных вопросов':         [true, true, true],
  'Пробные экзамены':                     [true, true, true],
  'Видеолекции (40+ часов)':              [false, true, true],
  'Еженедельные живые семинары':          [false, true, true],
  'Мониторинг прогресса':                 [false, true, true],
  'Групповой чат поддержки':              [false, true, true],
  'Персональная программа подготовки':    [false, false, true],
  'Индивидуальные занятия 1-на-1':        [false, false, true],
  'Консультации с основателями':          [false, false, true],
  'Приоритетная поддержка':               [false, false, true],
};

// Course duration in days (approx 6 months)
const COURSE_DAYS = 182;

const PricingV2: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
  const [isPerDay, setIsPerDay] = useState(false);
  const [tutorRate, setTutorRate] = useState(50);

  // Calculate savings vs tutoring (2 sessions/week for 6 months = ~52 sessions)
  const tutoringSessions = 52;
  const tutoringTotal = tutorRate * tutoringSessions;

  const formatPrice = (price: number) => {
    if (isPerDay) {
      return `€${(price / COURSE_DAYS).toFixed(2)}`;
    }
    return `€${price}`;
  };

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">
            Сравни тарифы и выбери свой
          </h2>
        </motion.div>

        {/* Price toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setIsPerDay(false)}
              className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all ${!isPerDay ? 'text-white' : 'text-gray-500 hover:text-primary'}`}
            >
              {!isPerDay && (
                <motion.div
                  layoutId="priceToggleBg"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">Полная стоимость</span>
            </button>
            <button
              onClick={() => setIsPerDay(true)}
              className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isPerDay ? 'text-white' : 'text-gray-500 hover:text-primary'}`}
            >
              {isPerDay && (
                <motion.div
                  layoutId="priceToggleBg"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">Стоимость в день</span>
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto -mx-4 px-4 pb-4">
          <div className="min-w-[700px]">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_repeat(3,160px)] gap-0">
              <div className="p-4" />
              {TIERS.map((tier, i) => (
                <div
                  key={tier.name}
                  className={`
                    p-5 text-center
                    ${tier.recommended
                      ? 'bg-primary text-white rounded-t-2xl shadow-lg relative z-10'
                      : 'bg-white border border-gray-100 rounded-t-2xl'
                    }
                  `}
                >
                  <h3 className={`text-lg font-display font-bold mb-2 ${tier.recommended ? 'text-white' : 'text-primary'}`}>
                    {tier.name}
                  </h3>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isPerDay ? 'perday' : 'total'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`text-2xl font-bold ${tier.recommended ? 'text-white' : 'text-primary'}`}>
                        {formatPrice(tier.price)}
                      </div>
                      {isPerDay && (
                        <div className={`text-xs mt-1 ${tier.recommended ? 'text-blue-200' : 'text-gray-400'}`}>
                          /день
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <div className={`text-xs mt-1 ${tier.recommended ? 'text-blue-200' : 'text-gray-400'}`}>
                    ≈ {tier.priceRub.toLocaleString('ru-RU')}&nbsp;₽
                  </div>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {ALL_FEATURES.map((feature, rowIdx) => (
              <div
                key={feature}
                className={`grid grid-cols-[1fr_repeat(3,160px)] gap-0 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <div className="p-4 text-sm text-gray-700 font-medium flex items-center">
                  {feature}
                </div>
                {FEATURE_MAP[feature]?.map((has, colIdx) => (
                  <div
                    key={colIdx}
                    className={`
                      p-4 flex items-center justify-center
                      ${TIERS[colIdx].recommended ? 'shadow-[inset_0_0_0_2px_#01278b20]' : ''}
                      ${has ? 'bg-green-50/60' : ''}
                    `}
                  >
                    {has ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </div>
                    ) : (
                      <X className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Installment row */}
            <div className="grid grid-cols-[1fr_repeat(3,160px)] gap-0 bg-green-50 border-t-2 border-green-200">
              <div className="p-4 text-sm text-green-800 font-semibold flex items-center">
                Рассрочка (6 мес)
              </div>
              {TIERS.map((tier) => (
                <div key={tier.name} className="p-4 text-center">
                  <div className="text-green-700 font-bold text-lg">
                    €{Math.round(tier.price / 6)}/мес
                  </div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="grid grid-cols-[1fr_repeat(3,160px)] gap-0">
              <div className="p-4" />
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-5 ${tier.recommended ? 'bg-primary/5 rounded-b-2xl' : 'bg-white rounded-b-2xl border-x border-b border-gray-100'}`}
                >
                  <Button
                    variant={tier.recommended ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => setSelectedTier(tier)}
                  >
                    Купить
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Savings Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-16"
        >
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-primary">Калькулятор экономии</h3>
                <p className="text-sm text-gray-500">Сравните с репетитором</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-3">
                <span>Стоимость репетитора в вашем городе</span>
                <span className="text-primary font-bold">€{tutorRate}/час</span>
              </label>
              <input
                type="range"
                min={20}
                max={100}
                value={tutorRate}
                onChange={(e) => setTutorRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>€20/час</span>
                <span>€100/час</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <div className="text-sm text-red-600 font-medium mb-1">Репетитор (52 занятия)</div>
                <div className="text-2xl font-bold text-red-700">€{tutoringTotal.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                <div className="text-sm text-green-600 font-medium mb-1">Pontea «Полный курс»</div>
                <div className="text-2xl font-bold text-green-700">€1,190</div>
              </div>
            </div>

            {tutoringTotal > 1190 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200 text-center"
              >
                <span className="text-green-800 font-bold text-lg">
                  Экономия: €{(tutoringTotal - 1190).toLocaleString()}
                </span>
                <span className="text-green-600 text-sm ml-2">
                  ({Math.round((1 - 1190 / tutoringTotal) * 100)}% дешевле)
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="text-center mt-12">
          <Link
            href="/consultation"
            className="inline-flex items-center gap-2 text-primary hover:text-highlight font-medium transition-colors text-base border-b-2 border-dashed border-primary/30 hover:border-highlight/50 pb-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            Нужна помощь с выбором или оплатой?
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

export default PricingV2;
