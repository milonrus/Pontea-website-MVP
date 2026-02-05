import React from 'react';
import { motion } from 'framer-motion';

const CARDS = [
    {
        id: 1,
        tag: "я ничего не знаю",
        title: "Все вокруг что-то знают, а я с нуля",
        description: "Начнём с твоего уровня. Объясним всё простыми словами и визуальными примерами. Наставник ответит на любой вопрос - даже самый базовый",
        image: "/stress/unknown.png",
    },
    {
        id: 2,
        tag: "всё смешалось",
        title: "От Ренессанса до тригонометрии за месяц",
        description: "Разобьём подготовку на понятные блоки. Чёткий план для каждого раздела экзамена",
        image: "/stress/exams.png",
    },
    {
        id: 3,
        tag: "у меня нет сил",
        title: "Откладываю учёбу и чувствую вину",
        description: "Наставник поддержит в сложные моменты. Превратим подготовку в понятный процесс с чётким прогрессом",
        image: "/stress/tired.png",
    },
    {
        id: 4,
        tag: "не успею подготовиться",
        title: "Материала слишком много, времени мало",
        description: "Только нужное для экзамена - никакой воды. 98% наших учеников поступают туда, куда хотели",
        image: "/stress/time.png",
    },
    {
        id: 5,
        tag: "все забуду и провалюсь",
        title: "Страшно растеряться на экзамене",
        description: "Отработаешь формат до автоматизма. Пробники в реальных условиях + техники борьбы со стрессом от наставника",
        image: "/stress/failure.png",
    }
];

// Floating worry bubbles in the background
const WorryBubble = ({ delay, size, position }: { delay: number; size: number; position: { left: string; top: string } }) => (
    <motion.div
        className="absolute rounded-full bg-gradient-to-br from-blue-100/30 to-accent/10 backdrop-blur-sm"
        style={{
            width: size,
            height: size,
            left: position.left,
            top: position.top,
        }}
        animate={{
            y: [0, -20, 0],
            x: [0, 10, -10, 0],
            scale: [1, 1.05, 0.98, 1],
            opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
            duration: 8 + delay,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay * 0.5,
        }}
    />
);

const StressManagement = () => {
    return (
        <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-blue-50/30 via-white to-blue-50/40">
            {/* Animated worry bubbles background */}
            <div className="absolute inset-0 pointer-events-none">
                <WorryBubble delay={0} size={120} position={{ left: '8%', top: '15%' }} />
                <WorryBubble delay={1} size={80} position={{ left: '78%', top: '12%' }} />
                <WorryBubble delay={2} size={100} position={{ left: '88%', top: '65%' }} />
                <WorryBubble delay={1.5} size={60} position={{ left: '3%', top: '75%' }} />
            </div>

            {/* Main gradient orb */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 via-accent/3 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 lg:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="inline-block"
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary mb-6 leading-tight">
                            Страшно, что не получится?
                        </h2>

                        {/* Animated underline */}
                        <motion.div
                            className="h-1 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full mx-auto"
                            initial={{ width: 0, opacity: 0 }}
                            whileInView={{ width: '100%', opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        />
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl mx-auto"
                    >
                        Поможем справиться со стрессом и получить максимум
                    </motion.p>
                </div>

                {/* Cards Grid */}
                <div className="space-y-6">
                    {/* Top Row: 3 cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {CARDS.slice(0, 3).map((card, index) => (
                            <StressCard key={card.id} card={card} index={index} />
                        ))}
                    </div>

                    {/* Bottom Row: 2 cards centered */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:max-w-4xl md:mx-auto">
                        {CARDS.slice(3, 5).map((card, index) => (
                            <StressCard key={card.id} card={card} index={index + 3} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const StressCard = ({ card, index }: { card: typeof CARDS[0]; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
            }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group relative bg-white rounded-2xl p-6 lg:p-8 shadow-md hover:shadow-2xl border border-blue-50 transition-all duration-300 flex flex-col h-full"
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Image area */}
                <div className="relative mb-6">
                    <div className="relative h-40 lg:h-48 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/40 overflow-hidden flex items-center justify-center p-4">
                        <motion.img
                            src={card.image}
                            alt={card.tag}
                            className="w-full h-full object-contain mix-blend-multiply"
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Tag - positioned outside the card */}
                    <motion.div
                        className="absolute -top-3 -left-3 bg-accent text-secondary text-xs lg:text-sm font-bold px-3 lg:px-4 py-2 rounded-xl shadow-lg z-20"
                        whileHover={{ scale: 1.05, rotate: -3 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        {card.tag}
                        {/* Subtle paper texture */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-50 rounded-xl pointer-events-none" />
                    </motion.div>
                </div>

                {/* Text content */}
                <div className="flex-grow">
                    <h3 className="text-xl lg:text-2xl font-display font-bold text-gray-900 mb-3 leading-tight">
                        {card.title}
                    </h3>

                    <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                        {card.description}
                    </p>
                </div>
            </div>

            {/* Decorative corner element */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-2xl rounded-bl-full" />
        </motion.div>
    );
};

export default StressManagement;
