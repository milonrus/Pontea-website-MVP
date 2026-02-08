import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Check, X, MessageCircle, Clock, Users, Quote, Sparkles } from 'lucide-react';
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

const MINI_TESTIMONIALS = [
  { name: 'Рената', text: 'Курсы помогли и с мотивацией. Готовиться в разы легче!', image: '/testimonials/renata.jpg' },
  { name: 'Дарья', text: 'Вебинары и конспекты супер структурированные!', image: '/testimonials/darya.jpg' },
  { name: 'Милана', text: 'Постоянная практика в течение курса — это лучший подход.', image: '/testimonials/milana.jpg' },
  { name: 'Rusty', text: 'An essential tool for the entry exam preparation.', image: '/testimonials/rusty.jpg' },
];

// Countdown: target 12 days from a fixed reference
function useCountdown() {
  const [time, setTime] = useState({ days: 12, hours: 4, minutes: 32, seconds: 0 });

  useEffect(() => {
    const target = Date.now() + (12 * 24 * 60 * 60 + 4 * 60 * 60 + 32 * 60) * 1000;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

// Animated counter
function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const stepTime = (duration * 1000) / target;
    const timer = setInterval(() => {
      start++;
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

const FlipDigit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-12 h-14 bg-white rounded-lg shadow-md border border-gray-100 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          className="text-xl font-bold text-red-600 tabular-nums"
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className="text-[10px] text-gray-400 mt-1 font-medium">{label}</span>
  </div>
);

const PricingV5: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
  const [activeIndex, setActiveIndex] = useState(1); // Default to recommended
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const activeTier = TIERS[activeIndex];
  const countdown = useCountdown();

  // Auto-rotate testimonials
  useEffect(() => {
    const id = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % MINI_TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">
            Выбери свой способ подготовки
          </h2>
        </motion.div>

        {/* Tier selector pills */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-gray-100/80 backdrop-blur-sm border border-gray-200/60">
            {TIERS.map((tier, index) => {
              const isActive = index === activeIndex;
              return (
                <motion.button
                  key={tier.name}
                  onClick={() => setActiveIndex(index)}
                  className={`
                    relative px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200
                    ${isActive ? 'text-white' : 'text-gray-500 hover:text-primary hover:bg-white/60'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="pricingPillBg"
                      className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_2px_12px_-2px_rgba(1,39,139,0.4)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{tier.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Main card */}
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Installment ribbon */}
            <div className="absolute top-5 right-[-35px] w-44 text-center text-xs font-bold py-1.5 bg-green-500 text-white rotate-45 shadow-md z-10">
              Рассрочка
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTier.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 md:p-10"
              >
                <h3 className="text-2xl font-display font-bold text-primary mb-4">{activeTier.name}</h3>

                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-6xl font-bold text-primary">€{activeTier.price}</span>
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  ≈ {activeTier.priceRub.toLocaleString('ru-RU')}&nbsp;₽
                </div>
                <div className="text-green-600 text-sm font-semibold mb-8">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  или {Math.round(activeTier.price / 6)} €/мес в рассрочку
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {activeTier.features.map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                  {activeTier.missingFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-40">
                      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-gray-500 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={() => setSelectedTier(activeTier)}
                  >
                    Купить
                  </Button>
                  <Link href="/consultation" className="flex-1">
                    <Button variant="outline" size="lg" fullWidth>
                      Записаться на консультацию
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Trust bar */}
        <div className="max-w-4xl mx-auto mt-10 grid md:grid-cols-3 gap-4">
          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-red-50 rounded-2xl p-5 border border-red-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">До повышения цен</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <FlipDigit value={countdown.days} label="дн" />
              <span className="text-red-300 text-xl font-bold mt-[-12px]">:</span>
              <FlipDigit value={countdown.hours} label="ч" />
              <span className="text-red-300 text-xl font-bold mt-[-12px]">:</span>
              <FlipDigit value={countdown.minutes} label="мин" />
              <span className="text-red-300 text-xl font-bold mt-[-12px]">:</span>
              <FlipDigit value={countdown.seconds} label="сек" />
            </div>
          </motion.div>

          {/* Student counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex flex-col items-center justify-center text-center"
          >
            <Users className="w-5 h-5 text-primary mb-2" />
            <div className="text-3xl font-bold text-primary mb-1">
              <AnimatedCounter target={87} />
            </div>
            <div className="text-xs text-blue-600 font-medium">учеников на этом цикле</div>
          </motion.div>

          {/* Mini testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden"
          >
            <Quote className="absolute top-3 right-3 w-8 h-8 text-gray-100" />
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-gray-600 italic mb-3 line-clamp-2 relative z-10">
                  &ldquo;{MINI_TESTIMONIALS[testimonialIndex].text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                    <img
                      src={MINI_TESTIMONIALS[testimonialIndex].image}
                      alt={MINI_TESTIMONIALS[testimonialIndex].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-primary">{MINI_TESTIMONIALS[testimonialIndex].name}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex gap-1.5 mt-3">
              {MINI_TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === testimonialIndex ? 'bg-primary w-4' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-10">
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

export default PricingV5;
