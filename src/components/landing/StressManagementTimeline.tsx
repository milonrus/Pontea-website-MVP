import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    return (
        <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-white via-blue-50/20 to-white">
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

                {/* Timeline - Desktop: Using flexbox with proper spacing */}
                <div className="hidden lg:block">
                    <div className="relative mx-auto" style={{ width: '1280px', height: '700px', maxWidth: '100%' }}>
                        {/* Card positioning with exact pixel values */}
                        <div className="absolute" style={{ left: '0px', top: '40px', width: '300px' }}>
                            <WorryCardWrapper worry={WORRIES[0]} index={0} hoveredId={hoveredId} setHoveredId={setHoveredId} />
                        </div>

                        <div className="absolute" style={{ left: '360px', top: '200px', width: '300px' }}>
                            <WorryCardWrapper worry={WORRIES[1]} index={1} hoveredId={hoveredId} setHoveredId={setHoveredId} />
                        </div>

                        <div className="absolute" style={{ left: '700px', top: '50px', width: '300px' }}>
                            <WorryCardWrapper worry={WORRIES[2]} index={2} hoveredId={hoveredId} setHoveredId={setHoveredId} />
                        </div>

                        <div className="absolute" style={{ left: '1060px', top: '180px', width: '300px' }}>
                            <WorryCardWrapper worry={WORRIES[3]} index={3} hoveredId={hoveredId} setHoveredId={setHoveredId} />
                        </div>
                    </div>
                </div>

                {/* Timeline - Mobile (vertical stack) */}
                <div className="lg:hidden space-y-8">
                    {WORRIES.map((worry, index) => (
                        <motion.div
                            key={worry.id}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <WorryCard worry={worry} index={index} isHovered={false} isNeighbor={false} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Wrapper to handle hover state management
const WorryCardWrapper = ({
    worry,
    index,
    hoveredId,
    setHoveredId
}: {
    worry: typeof WORRIES[0];
    index: number;
    hoveredId: number | null;
    setHoveredId: (id: number | null) => void;
}) => {
    const isHovered = hoveredId === worry.id;
    const isNeighbor = hoveredId !== null && Math.abs(WORRIES.findIndex(w => w.id === hoveredId) - index) === 1;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
                duration: 0.6,
                delay: index * 0.2,
                ease: [0.22, 1, 0.36, 1]
            }}
            onMouseEnter={() => setHoveredId(worry.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ zIndex: isHovered ? 50 : isNeighbor ? 30 : 10 }}
        >
            <WorryCard
                worry={worry}
                index={index}
                isHovered={isHovered}
                isNeighbor={isNeighbor}
            />
        </motion.div>
    );
};

const WorryCard = ({
    worry,
    index,
    isHovered,
    isNeighbor
}: {
    worry: typeof WORRIES[0];
    index: number;
    isHovered: boolean;
    isNeighbor: boolean;
}) => {
    // Цвет границы для визуального разнообразия
    const getBorderColor = (color: string) => {
        const colors = {
            blue: 'border-blue-200 hover:border-blue-300',
            orange: 'border-orange-200 hover:border-orange-300',
            yellow: 'border-yellow-200 hover:border-yellow-300',
            green: 'border-green-200 hover:border-green-300',
            teal: 'border-teal-200 hover:border-teal-300',
        };
        return colors[color as keyof typeof colors] || 'border-blue-200 hover:border-blue-300';
    };

    const getGlowColor = (color: string) => {
        const colors = {
            blue: 'shadow-blue-200/50',
            orange: 'shadow-orange-200/50',
            yellow: 'shadow-yellow-200/50',
            green: 'shadow-green-200/50',
            teal: 'shadow-teal-200/50',
        };
        return colors[color as keyof typeof colors] || 'shadow-blue-200/50';
    };

    return (
        <motion.div
            animate={{
                scale: isHovered ? 1.03 : isNeighbor ? 1.01 : 1,
                y: isHovered ? -6 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`
                relative bg-white rounded-2xl p-8 border-2 transition-all duration-300
                ${getBorderColor(worry.color)}
                ${isHovered ? `shadow-2xl ${getGlowColor(worry.color)}` : 'shadow-lg'}
                ${isNeighbor ? 'ring-2 ring-accent/30' : ''}
            `}
        >
            {/* Step number */}
            <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-base shadow-lg">
                {index + 1}
            </div>

            {/* Image */}
            <div className="relative h-56 mb-4 rounded-xl overflow-hidden">
                <motion.img
                    src={worry.image}
                    alt={worry.tag}
                    className="w-full h-full object-contain p-2 mix-blend-multiply"
                    animate={isHovered ? { scale: 1.08, rotate: 2 } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3 }}
                />

                {/* Animated glow on hover */}
                {isHovered && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </div>

            {/* Tag */}
            <motion.div
                className="inline-block bg-accent/15 text-secondary text-sm font-semibold px-3 py-1.5 rounded-lg mb-2"
                animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                {worry.tag}
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-display font-bold text-gray-900 mb-2 leading-tight">
                {worry.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-base leading-relaxed">
                {worry.description}
            </p>

            {/* Connection indicator for neighbors */}
            {isNeighbor && (
                <motion.div
                    className="absolute inset-0 border-2 border-accent/50 rounded-2xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </motion.div>
    );
};

export default StressManagementTimeline;
