import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/shared/Button';

const WORRIES = [
    {
        id: 1,
        tag: "я вообще не в теме",
        title: "Все уже готовятся, а я только узнал про экзамен",
        description: "Разберёмся вместе. Шаг за шагом, и всё встанет на свои места.",
        image: "/stress/unknown.png",
        color: 'blue',
    },
    {
        id: 2,
        tag: "времени не хватит",
        title: "Не знаю свой уровень и успею ли вообще",
        description: "Выясним, где ты сейчас, и построим план, который реально успеть.",
        image: "/stress/time.png",
        color: 'orange',
    },
    {
        id: 3,
        tag: "готовлюсь вслепую",
        title: "Учусь, но не понимаю, туда ли иду",
        description: "Ментор будет рядом: проверит, подскажет, поддержит.",
        image: "/stress/tired.png",
        color: 'yellow',
    },
    {
        id: 4,
        tag: "а вдруг провалюсь",
        title: "Боюсь, что на экзамене всё вылетит из головы",
        description: "Прорешаешь десятки mock-тестов на время, и формат станет привычным.",
        image: "/stress/failure.png",
        color: 'green',
    }
];

// Волнистая соединительная линия
const WavyPath = () => {
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {/* Shadow/glow effect */}
            <motion.path
                d="M 100 140 Q 280 300, 460 380 Q 600 420, 800 250 Q 1000 330, 1200 360"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="10"
                opacity="0.25"
                filter="blur(6px)"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />
            {/* Main line */}
            <motion.path
                d="M 100 140 Q 280 300, 460 380 Q 600 420, 800 250 Q 1000 330, 1200 360"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="0"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#01278b" stopOpacity="1" />
                    <stop offset="33%" stopColor="#FFC857" stopOpacity="1" />
                    <stop offset="66%" stopColor="#FFC857" stopOpacity="1" />
                    <stop offset="100%" stopColor="#4ecca3" stopOpacity="1" />
                </linearGradient>
            </defs>
        </svg>
    );
};

const StressManagementTimeline = () => {
    return (
        <section className="relative pt-16 lg:pt-20 pb-20 overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white">
            {/* Animated background elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Gradient orbs representing emotional state */}
                <motion.div
                    className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-to-br from-red-200/30 to-orange-200/30 blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-gradient-to-br from-teal-200/30 to-green-200/30 blur-3xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary mb-4"
                    >
                        Страшно, что не получится?
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
                    >
                        Мы через это прошли и знаем, как помочь
                    </motion.p>
                </div>

                {/* Timeline - Desktop */}
                <div className="hidden lg:block">
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8 items-start">
                        {WORRIES.map((worry, index) => (
                            <div
                                key={worry.id}
                                className={index % 2 === 1 ? 'lg:mt-10 xl:mt-16' : ''}
                            >
                                <WorryCardWrapper worry={worry} index={index} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline - Mobile (vertical stack) */}
                <div className="lg:hidden space-y-8">
                    {WORRIES.map((worry, index) => (
                        <motion.div
                            key={worry.id}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: index * 0.06 }}
                        >
                            <WorryCard worry={worry} index={index} />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-14 lg:mt-16"
                >
                    <div className="relative overflow-hidden rounded-[2rem] border border-blue-100/90 bg-gradient-to-br from-[#f6fbff] via-white to-[#fff9ef] shadow-[0_22px_60px_-38px_rgba(1,39,139,0.55)]">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-accent/60 to-primary/10" />
                        <div className="absolute -top-16 -right-14 w-44 h-44 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

                        <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
                            <div className="grid gap-7 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                <div className="max-w-3xl text-center lg:text-left mx-auto lg:mx-0">
                                    <p className="text-2xl md:text-3xl lg:text-[2rem] font-display font-bold text-primary leading-tight">
                                        Оцени свой уровень и начни подготовку{' '}
                                        <span className="whitespace-nowrap">без хаоса</span>
                                    </p>
                                    <p className="text-sm md:text-base text-slate-600 mt-3">
                                        Короткая диагностика даст персональный план на ближайшие 4 месяца
                                    </p>
                                </div>

                                <div className="flex justify-center lg:justify-end">
                                    <Link href="/ru/assessment" className="block w-full max-w-[320px] lg:w-auto">
                                        <Button
                                            size="lg"
                                            variant="primary"
                                            className="h-14 w-full lg:w-auto lg:min-w-[280px] px-8 md:px-10 !rounded-xl shadow-[0_14px_32px_-16px_rgba(255,200,87,0.8)]"
                                        >
                                            Пройти опрос
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const WorryCardWrapper = ({
    worry,
    index
}: {
    worry: typeof WORRIES[0];
    index: number;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
                duration: 0.45,
                delay: index * 0.08,
                ease: "easeOut"
            }}
        >
            <WorryCard worry={worry} index={index} />
        </motion.div>
    );
};

const WorryCard = ({
    worry,
    index
}: {
    worry: typeof WORRIES[0];
    index: number;
}) => {
    // Цвет рамки для визуального разнообразия
    const getBorderColor = (color: string) => {
        const colors = {
            blue: 'border-blue-200',
            orange: 'border-orange-200',
            yellow: 'border-yellow-200',
            green: 'border-green-200',
            teal: 'border-teal-200',
        };
        return colors[color as keyof typeof colors] || 'border-blue-200';
    };

    return (
        <div
            className={`
                relative bg-white rounded-2xl p-8 border-2 shadow-sm
                ${getBorderColor(worry.color)}
            `}
        >
            {/* Step number */}
            <div className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-md">
                {index + 1}
            </div>

            {/* Image */}
            <div className="relative h-56 mb-4 rounded-xl overflow-hidden">
                <img
                    src={worry.image}
                    alt={worry.tag}
                    className="w-full h-full object-contain p-2 mix-blend-multiply"
                />
            </div>

            {/* Tag */}
            <div
                className="inline-block bg-accent/15 text-secondary text-sm font-semibold px-3 py-1.5 rounded-lg mb-2"
            >
                {worry.tag}
            </div>

            {/* Title */}
            <h3 className="text-xl font-display font-bold text-gray-900 mb-2 leading-tight">
                {worry.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-base leading-relaxed">
                {worry.description}
            </p>
        </div>
    );
};

export default StressManagementTimeline;
