import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Crown, Sparkles, MessageCircle } from 'lucide-react';
import Link from 'next/link';
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

const PricingV1: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);

  return (
    <section id="pricing" className="relative py-20 md:py-28 overflow-hidden bg-secondary">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-accent/15 to-transparent blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-highlight/10 to-transparent blur-[120px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Выбери свой способ подготовки
          </h2>
          <p className="text-blue-200/60 text-lg">Инвестиция в будущее, которая окупится</p>
        </motion.div>

        <div className="flex justify-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent font-semibold px-5 py-2.5 rounded-full text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Доступна рассрочка на все тарифы
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`
                relative rounded-3xl p-8 backdrop-blur-xl border transition-all duration-500
                ${tier.recommended
                  ? 'bg-white/10 border-accent/40 shadow-[0_0_60px_-10px_rgba(255,200,87,0.3)]'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                }
              `}
            >
              {/* Recommended glow animation */}
              {tier.recommended && (
                <>
                  <motion.div
                    className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ zIndex: -1 }}
                  />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <motion.div
                      className="flex items-center gap-2 bg-gradient-to-r from-accent to-yellow-400 text-primary font-bold px-5 py-1.5 rounded-full text-sm shadow-lg shadow-accent/30"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="w-4 h-4" />
                      Самый популярный
                    </motion.div>
                  </div>
                </>
              )}

              <h3 className="text-2xl font-display font-bold text-white mb-2">{tier.name}</h3>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                    €{tier.price}
                  </span>
                </div>
                <div className="text-sm text-blue-200/40 mt-1">
                  ≈ {tier.priceRub.toLocaleString('ru-RU')}&nbsp;₽
                </div>
              </div>

              <button
                onClick={() => setSelectedTier(tier)}
                className={`
                  w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-300 mb-8
                  ${tier.recommended
                    ? 'bg-gradient-to-r from-accent to-yellow-400 text-primary hover:shadow-lg hover:shadow-accent/30 hover:scale-[1.02]'
                    : 'border border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                  }
                `}
              >
                Купить
              </button>

              <div className="space-y-3.5">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-accent flex-shrink-0 mt-0.5 fill-accent" />
                    <span className="text-blue-100/80 text-sm">{feature}</span>
                  </div>
                ))}
                {tier.missingFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-white/15 flex-shrink-0 mt-0.5" />
                    <span className="text-white/20 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
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
            href="/ru"
            className="inline-flex items-center gap-2 text-blue-200/60 hover:text-accent font-medium transition-colors text-base border-b border-dashed border-blue-200/20 hover:border-accent/50 pb-0.5"
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

export default PricingV1;
