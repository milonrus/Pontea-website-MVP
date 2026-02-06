import React from 'react';
import { motion } from 'framer-motion';
import { Map, Route, MessageCircle } from 'lucide-react';

interface MentorStep {
  title: string;
  description: string;
  icon: React.ElementType;
}

const MENTOR_STEPS: MentorStep[] = [
  {
    title: 'Персональный план',
    description: 'На старте ментор оценивает твой уровень и формирует маршрут подготовки под цель поступления.',
    icon: Map,
  },
  {
    title: 'Пошаговое ведение',
    description: 'Ты двигаешься по понятному плану: что учить, что тренировать и где набирать баллы в первую очередь.',
    icon: Route,
  },
  {
    title: 'Связь каждые 2 недели',
    description: 'Регулярный check-in в чате: корректировка плана, обратная связь по прогрессу и фокус на слабых темах.',
    icon: MessageCircle,
  },
];

const MentorSupport: React.FC = () => {
  return (
    <section className="section-padding bg-gradient-to-b from-white via-blue-50/30 to-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] gap-8 lg:gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="rounded-3xl border border-blue-100 bg-white p-7 md:p-10 shadow-[0_18px_48px_-30px_rgba(1,39,139,0.5)]"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary leading-tight">
              Ментор всегда рядом
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mt-5">
              Ты не остаёшься один: ментор собирает персональный план, ведёт по шагам и помогает не терять темп.
            </p>
          </motion.div>

          <div className="space-y-5">
            {MENTOR_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="rounded-3xl border border-blue-100 bg-white p-6 md:p-7 shadow-[0_14px_36px_-26px_rgba(1,39,139,0.45)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-display font-bold text-primary leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mt-2">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-8 rounded-3xl border border-blue-100 bg-white/90 px-6 py-4 text-center shadow-[0_12px_30px_-24px_rgba(1,39,139,0.45)]"
        >
          <p className="text-primary font-semibold text-base md:text-lg">
            Регулярный check-in каждые 2 недели с ментором в чате.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MentorSupport;
