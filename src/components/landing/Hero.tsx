import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/shared/Button';
import { BookOpen, GraduationCap, PlayCircle, Trophy, Users } from 'lucide-react';

const StatBox = ({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white p-4 rounded-xl shadow-sm border border-blue-50 flex items-center gap-4"
  >
    <div className="p-3 bg-blue-50 rounded-lg text-primary">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
    </div>
  </motion.div>
);

const Hero: React.FC = () => {
  return (
    <section className="relative pt-20 pb-12 lg:pt-28 lg:pb-16 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-white">
      <div className="absolute top-0 right-0 w-[780px] h-[780px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-blue-100 text-primary text-sm font-bold mb-8">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              Набор на цикл 2026/2027 открыт
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary leading-[1.05] tracking-tight mb-6">
              Онлайн-школа <br />
              подготовки к{' '}
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-primary">
                ARCHED и TIL-A
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
              Подгтовим с любого уровня на высокий балл!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl items-start">
              <div className="w-full sm:w-[360px]">
                <Link href="/ru/assessment" className="block">
                  <Button
                    size="lg"
                    variant="primary"
                    className="shadow-xl shadow-accent/20 w-full h-16 border-transparent !text-base whitespace-nowrap"
                  >
                    Получить план подготовки
                  </Button>
                </Link>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Ответь на 5 вопросов
                </p>
              </div>

              <div className="w-full sm:w-[260px]">
                <Link href="#pricing" className="block">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-16 border-2 border-primary/10 hover:border-primary text-primary hover:bg-blue-50 !text-base"
                  >
                    Купить курс
                  </Button>
                </Link>
              </div>
            </div>

          </motion.div>

          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-[3rem] -rotate-3 transform scale-90" />

            <div className="grid grid-cols-2 gap-5 relative z-10 w-full max-w-lg">
              <motion.div
                className="space-y-5 pt-12"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-primary p-6 rounded-2xl text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/20 rounded-full -mr-10 -mt-10" />
                  <div className="relative z-10">
                    <Trophy className="w-8 h-8 text-accent mb-3" />
                    <div className="text-4xl font-display font-bold text-white mb-1 leading-none tracking-tight">
                      96%
                      <sup className="ml-1 text-base md:text-lg text-accent/95 align-super relative -top-1 font-semibold">*</sup>
                    </div>
                    <div className="text-blue-100 text-sm font-medium">Поступают в целевые вузы</div>
                    <div className="text-blue-200/90 text-[11px] leading-snug mt-2">
                      *среди тех, кто прошел курс до конца
                    </div>
                  </div>
                </div>
                <StatBox icon={PlayCircle} value="80" label="часов видеоуроков" />
                <StatBox icon={BookOpen} value="1000+" label="упражнений" />
              </motion.div>

              <motion.div
                className="space-y-5"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-bold text-green-600 uppercase">МЕНТОР НА СВЯЗИ</span>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Корректируем план и поддерживаем мотивацию
                  </div>
                </div>
                <StatBox icon={GraduationCap} value="90+" label="Учатся в Италии" />
                <StatBox icon={Users} value="6" label="Преподавателей" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
