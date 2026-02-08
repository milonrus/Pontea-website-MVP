import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, RotateCcw, Sparkles, MessageCircle } from 'lucide-react';
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

const TAGLINES = ['Основа знаний', 'Все для успеха', 'Персональный подход'];

const GRADIENTS = [
  'from-blue-100 to-blue-50',
  'from-primary to-secondary',
  'from-amber-100 via-accent/30 to-yellow-50',
];

interface FlipCardProps {
  tier: PlanTier;
  index: number;
  tagline: string;
  gradient: string;
  onSelect: (tier: PlanTier) => void;
}

const FlipCard: React.FC<FlipCardProps> = ({ tier, index, tagline, gradient, onSelect }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isDark = index === 1; // The "Полный курс" card has dark gradient

  return (
    <div className="relative w-full aspect-[5/6] perspective-1000 group">
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* FRONT */}
        <div className={`absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-br ${gradient} overflow-hidden flex flex-col items-center justify-center p-8 text-center cursor-pointer shadow-xl hover:shadow-2xl transition-shadow`}
          onClick={() => setIsFlipped(true)}
        >
          {/* Recommended ribbon */}
          {tier.recommended && (
            <div className="absolute top-0 right-0 overflow-hidden w-28 h-28">
              <div className="absolute top-4 right-[-35px] w-40 text-center text-xs font-bold py-1.5 bg-accent text-primary rotate-45 shadow-md">
                Популярный
              </div>
            </div>
          )}

          <h3 className={`text-3xl font-display font-bold mb-3 ${isDark ? 'text-white' : 'text-primary'}`}>
            {tier.name}
          </h3>

          <div className={`text-5xl font-bold mb-2 ${isDark ? 'text-white' : 'text-primary'}`}>
            €{tier.price}
          </div>
          <div className={`text-sm mb-6 ${isDark ? 'text-blue-200' : 'text-gray-500'}`}>
            ≈ {tier.priceRub.toLocaleString('ru-RU')}&nbsp;₽
          </div>

          <p className={`text-lg font-medium mb-8 ${isDark ? 'text-blue-100' : 'text-gray-600'}`}>
            {tagline}
          </p>

          <div className={`inline-flex items-center gap-2 font-semibold text-base ${isDark ? 'text-accent' : 'text-primary'}`}>
            Узнать больше
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 backface-hidden rounded-3xl bg-white p-6 md:p-8 flex flex-col shadow-2xl border border-gray-100"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {/* Flip-back button */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-primary hover:text-white transition-all z-10"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <h3 className="text-2xl font-display font-bold text-primary mb-1">{tier.name}</h3>
          <div className="text-sm text-gray-400 mb-4">{tagline}</div>

          {/* Features */}
          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {tier.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Installment box */}
          <div className="bg-green-50 rounded-lg p-3 mt-4 mb-4 text-center">
            <div className="text-green-700 text-sm font-semibold">
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              Рассрочка: {Math.round(tier.price / 6)} €/мес
            </div>
          </div>

          {/* CTA */}
          <Button
            variant={tier.recommended ? 'primary' : 'secondary'}
            fullWidth
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSelect(tier); }}
          >
            Купить
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const PricingV4: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">
            Выбери свой способ подготовки
          </h2>
          <p className="text-gray-500 text-lg">Нажми на карточку, чтобы узнать подробности</p>
        </motion.div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 font-semibold px-5 py-2.5 rounded-full text-sm">
            <span className="text-lg">✓</span>
            Доступна рассрочка на все тарифы
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <FlipCard
                tier={tier}
                index={index}
                tagline={TAGLINES[index]}
                gradient={GRADIENTS[index]}
                onSelect={setSelectedTier}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link
            href="/consultation"
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

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </section>
  );
};

export default PricingV4;
