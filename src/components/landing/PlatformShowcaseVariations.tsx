import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Play, FileText, BookOpen, CheckSquare, Users, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlatformTab {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  assetPath: string;
}

const PLATFORM_TABS: PlatformTab[] = [
  {
    id: 'video-lectures',
    title: 'Видео-лекции',
    description: '80 часов записанных лекций с самыми доступными объяснениями',
    icon: <Play className="w-5 h-5" />,
    assetPath: '/platform/video-lectures.gif'
  },
  {
    id: 'notes',
    title: 'Конспекты',
    description: '60 конспектов по каждой теме для повторения материала',
    icon: <FileText className="w-5 h-5" />,
    assetPath: '/platform/notes.gif'
  },
  {
    id: 'question-bank',
    title: 'Банк заданий',
    description: '1000 упражнений для закрепления тем',
    icon: <BookOpen className="w-5 h-5" />,
    assetPath: '/platform/question-bank.gif'
  },
  {
    id: 'practice-exams',
    title: 'Пробные экзамены',
    description: '10 пробных тестов для отслеживания прогресса и симуляции экзамены',
    icon: <CheckSquare className="w-5 h-5" />,
    assetPath: '/platform/practice-exams.gif'
  },
  {
    id: 'saturday-school',
    title: 'Субботняя школа',
    description: 'Онлайн занятия для обсуждения самых интересных тем и ответов на любые вопросы',
    icon: <Users className="w-5 h-5" />,
    assetPath: '/platform/saturday-school.gif'
  },
  {
    id: 'mentorship',
    title: 'Менторство',
    description: 'Разрабатываем персональный план подготовки. Помогаем с мотивацией и следим за прогрессом!',
    icon: <Heart className="w-5 h-5" />,
    assetPath: '/platform/mentorship.gif'
  }
];

// ============================================================================
// VARIATION 1: "FLOATING CARDS CAROUSEL" - Elegant 3D Card Stack
// ============================================================================
export const Variation1FloatingCards: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PLATFORM_TABS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
    setIsAutoRotating(false);
    setTimeout(() => setIsAutoRotating(true), 10000);
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[#f8faff] via-white to-[#fffbf0]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-accent/15 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-primary mb-6 leading-tight">
            Все необходимое для поступления<br />
            <span className="bg-gradient-to-r from-primary via-teal to-accent bg-clip-text text-transparent">
              в одной платформе
            </span>
          </h2>
        </motion.div>

        {/* 3D Card Stack */}
        <div className="relative h-[600px] md:h-[700px] flex items-center justify-center perspective-[2000px]">
          {PLATFORM_TABS.map((tab, index) => {
            const offset = index - activeIndex;
            const absOffset = Math.abs(offset);
            const isActive = index === activeIndex;

            return (
              <motion.div
                key={tab.id}
                className="absolute w-full max-w-4xl cursor-pointer"
                initial={false}
                animate={{
                  x: offset * 120,
                  z: -absOffset * 150,
                  rotateY: offset * 8,
                  scale: isActive ? 1 : 0.85 - absOffset * 0.05,
                  opacity: absOffset > 2 ? 0 : 1,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                onClick={() => handleCardClick(index)}
                style={{ zIndex: 10 - absOffset }}
              >
                <div
                  className={`
                    relative bg-white rounded-3xl overflow-hidden
                    shadow-[0_20px_60px_-15px_rgba(1,39,139,0.3)]
                    border-2 transition-colors duration-300
                    ${isActive ? 'border-primary' : 'border-gray-200'}
                  `}
                >
                  {/* Content Screenshot Area */}
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    {/* Browser Chrome */}
                    <div className="absolute top-0 inset-x-0 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center gap-2 z-10">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 ml-3 bg-gray-100 rounded-lg px-4 py-1.5 text-sm text-gray-600 flex items-center gap-2">
                        <Lock className="w-3 h-3 text-green-600" />
                        <span className="font-medium">pontea.school</span>
                      </div>
                    </div>

                    {/* Placeholder for screenshot */}
                    <div className="absolute inset-0 flex items-center justify-center pt-14">
                      <div className="text-center p-8">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white shadow-lg">
                          {tab.icon}
                        </div>
                        <div className="text-sm text-gray-400 italic">Screenshot placeholder: {tab.id}.gif</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-8 bg-white">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                        {tab.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-display font-bold text-primary mb-2">
                          {tab.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-3 mt-12">
          {PLATFORM_TABS.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleCardClick(index)}
              className={`
                h-2 rounded-full transition-all duration-300
                ${index === activeIndex ? 'w-12 bg-primary' : 'w-2 bg-gray-300 hover:bg-gray-400'}
              `}
              aria-label={`View ${tab.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// VARIATION 2: "VERTICAL TIMELINE SPLIT" - Magazine Editorial Layout
// ============================================================================
export const Variation2VerticalTimeline: React.FC = () => {
  const [activeTab, setActiveTab] = useState('video-lectures');
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setActiveTab((current) => {
        const currentIndex = PLATFORM_TABS.findIndex(t => t.id === current);
        return PLATFORM_TABS[(currentIndex + 1) % PLATFORM_TABS.length].id;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const activeTabData = PLATFORM_TABS.find(t => t.id === activeTab);

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      {/* Large Background Typography */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <div className="text-[20vw] font-display font-black text-primary">
          PONTEA
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-accent/20 text-primary text-sm font-bold mb-6 border-2 border-accent">
            ПЛАТФОРМА
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-primary mb-6 leading-tight max-w-4xl">
            Все необходимое для поступления в одной платформе
          </h2>
        </motion.div>

        {/* Split Layout */}
        <div className="grid lg:grid-cols-[400px,1fr] gap-8 lg:gap-12 items-start">
          {/* Left: Vertical Tab Navigation */}
          <div className="space-y-3">
            {PLATFORM_TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsAutoRotating(false);
                  }}
                  className={`
                    w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group
                    ${isActive
                      ? 'border-primary bg-gradient-to-br from-primary to-secondary text-white shadow-xl'
                      : 'border-gray-200 bg-white hover:border-primary/30 hover:shadow-lg'
                    }
                  `}
                >
                  {/* Number Badge */}
                  <div className={`
                    absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}
                  `}>
                    {index + 1}
                  </div>

                  <div className="flex items-start gap-4 pr-8">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                      ${isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-primary/10 to-teal/10 text-primary'}
                    `}>
                      {tab.icon}
                    </div>
                    <div>
                      <h3 className={`
                        text-xl font-display font-bold mb-2
                        ${isActive ? 'text-white' : 'text-primary'}
                      `}>
                        {tab.title}
                      </h3>
                      <p className={`
                        text-sm leading-relaxed
                        ${isActive ? 'text-white/90' : 'text-gray-600'}
                      `}>
                        {tab.description}
                      </p>
                    </div>
                  </div>

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right: Large Content Display */}
          <div className="lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Browser Mockup */}
                <div className="relative bg-white rounded-3xl shadow-[0_30px_80px_-20px_rgba(1,39,139,0.4)] overflow-hidden border border-gray-200">
                  {/* Chrome */}
                  <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 ml-3 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2 shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-green-600" />
                      <span className="font-medium">pontea.school</span>
                      <span className="text-gray-400 ml-1">/ {activeTab}</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary via-teal to-accent flex items-center justify-center text-white shadow-2xl rotate-3">
                        <div className="-rotate-3">
                          {activeTabData?.icon}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 italic">
                        {activeTabData?.id}.gif
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -bottom-6 -right-6 bg-accent rounded-2xl p-6 shadow-xl max-w-xs hidden lg:block"
                >
                  <div className="text-primary font-display font-bold text-lg mb-1">
                    {activeTabData?.title}
                  </div>
                  <div className="text-primary/80 text-sm">
                    Активная функция платформы
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// VARIATION 3: "GRID MOSAIC" - Dynamic Grid with Expanding Cards
// ============================================================================
export const Variation3GridMosaic: React.FC = () => {
  const [expandedTab, setExpandedTab] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <section className="relative py-24 bg-gradient-to-b from-[#00154a] via-[#01278b] to-[#00154a] overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,200,87,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,200,87,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Glowing Orbs */}
      <motion.div
        className="absolute top-20 right-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight">
            Все необходимое для поступления<br />
            <span className="text-accent">в одной платформе</span>
          </h2>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Наведите или нажмите на карточку, чтобы узнать больше
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[240px]">
          {PLATFORM_TABS.map((tab, index) => {
            const isExpanded = expandedTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            // Create varied grid layouts
            const spanClasses = [
              'md:col-span-2 md:row-span-2', // Large
              'md:col-span-1 md:row-span-1', // Small
              'md:col-span-1 md:row-span-2', // Tall
              'md:col-span-2 md:row-span-1', // Wide
              'md:col-span-1 md:row-span-1', // Small
              'md:col-span-1 md:row-span-1', // Small
            ];

            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`
                  ${spanClasses[index]}
                  ${isExpanded ? 'md:col-span-3 md:row-span-3 fixed inset-4 z-50' : ''}
                `}
                layoutId={tab.id}
              >
                <motion.button
                  className="w-full h-full relative overflow-hidden rounded-3xl group cursor-pointer"
                  onClick={() => setExpandedTab(isExpanded ? null : tab.id)}
                  onHoverStart={() => setHoveredTab(tab.id)}
                  onHoverEnd={() => setHoveredTab(null)}
                  whileHover={{ scale: isExpanded ? 1 : 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  {/* Background Gradient */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br transition-all duration-500
                    ${isHovered || isExpanded
                      ? 'from-accent via-accent/80 to-accent/60'
                      : 'from-white/10 via-white/5 to-transparent'
                    }
                  `} />

                  {/* Border Glow */}
                  <div className={`
                    absolute inset-0 rounded-3xl transition-all duration-300
                    ${isHovered || isExpanded
                      ? 'shadow-[0_0_0_2px_rgba(255,200,87,1),0_20px_60px_-10px_rgba(255,200,87,0.6)]'
                      : 'shadow-[0_0_0_1px_rgba(255,255,255,0.1)]'
                    }
                  `} />

                  {/* Content */}
                  <div className="relative h-full p-8 flex flex-col justify-between">
                    {/* Number & Icon */}
                    <div className="flex items-start justify-between">
                      <motion.div
                        className="text-white/40 text-6xl font-display font-black leading-none"
                        animate={{ scale: isHovered ? 1.1 : 1 }}
                      >
                        0{index + 1}
                      </motion.div>
                      <motion.div
                        className={`
                          w-14 h-14 rounded-2xl flex items-center justify-center
                          ${isHovered || isExpanded ? 'bg-primary text-white' : 'bg-white/10 text-white'}
                        `}
                        animate={{ rotate: isHovered ? 10 : 0 }}
                      >
                        {tab.icon}
                      </motion.div>
                    </div>

                    {/* Title & Description */}
                    <div className="text-left">
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3 leading-tight">
                        {tab.title}
                      </h3>
                      <AnimatePresence>
                        {(isHovered || isExpanded) && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-white/90 leading-relaxed"
                          >
                            {tab.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 bg-white rounded-2xl p-6 text-center"
                      >
                        <div className="text-gray-400 italic text-sm">
                          Screenshot: {tab.id}.gif
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Hover Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ mixBlendMode: 'overlay' }}
                  />
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Close Button for Expanded */}
        {expandedTab && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setExpandedTab(null)}
            className="fixed top-8 right-8 z-[60] w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
          >
            ✕
          </motion.button>
        )}
      </div>
    </section>
  );
};

// ============================================================================
// VARIATION 4: "HORIZONTAL SCROLL THEATER" - Cinematic Widescreen Experience
// ============================================================================
export const Variation4HorizontalTheater: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  useEffect(() => {
    if (!isAutoScrolling) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PLATFORM_TABS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoScrolling]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth / PLATFORM_TABS.length;
      container.scrollTo({
        left: scrollWidth * activeIndex,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % PLATFORM_TABS.length);
    setIsAutoScrolling(false);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + PLATFORM_TABS.length) % PLATFORM_TABS.length);
    setIsAutoScrolling(false);
  };

  return (
    <section className="relative py-24 bg-black overflow-hidden">
      {/* Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/20 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-8"
          >
            <div className="text-8xl md:text-9xl font-display font-black bg-gradient-to-r from-white via-accent to-teal bg-clip-text text-transparent leading-none">
              PLATFORM
            </div>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white/90 max-w-3xl mx-auto leading-relaxed">
            Все необходимое для поступления в одной платформе
          </h2>
        </motion.div>

        {/* Cinematic Scroll Container */}
        <div className="relative">
          {/* Main Theater Display */}
          <div className="relative rounded-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(255,200,87,0.4)] border-4 border-accent/30">
            {/* Film Grain Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-30 pointer-events-none z-10" />

            <div
              ref={scrollContainerRef}
              className="flex overflow-x-hidden scroll-smooth"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {PLATFORM_TABS.map((tab, index) => (
                <div
                  key={tab.id}
                  className="flex-shrink-0 w-full scroll-snap-align-start"
                >
                  <div className="relative aspect-[21/9] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                    {/* Content Display */}
                    <div className="absolute inset-0 flex items-center justify-center p-16">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: index === activeIndex ? 1 : 0.3, scale: index === activeIndex ? 1 : 0.9 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                      >
                        <div className="w-40 h-40 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary via-teal to-accent flex items-center justify-center text-white shadow-2xl rotate-6">
                          <div className="-rotate-6 scale-150">
                            {tab.icon}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 italic mb-8">
                          {tab.id}.gif
                        </div>
                        <div className="max-w-2xl mx-auto">
                          <h3 className="text-4xl font-display font-bold text-white mb-4">
                            {tab.title}
                          </h3>
                          <p className="text-xl text-gray-400">
                            {tab.description}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Scene Number Overlay */}
                    <div className="absolute top-8 left-8 text-8xl font-display font-black text-white/5">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-20 group"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-20 group"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Film Strip Navigation */}
          <div className="flex items-center justify-center gap-4 mt-12">
            {PLATFORM_TABS.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => {
                  setActiveIndex(index);
                  setIsAutoScrolling(false);
                }}
                className={`
                  relative overflow-hidden rounded-lg transition-all duration-300
                  ${index === activeIndex
                    ? 'w-32 h-20 ring-2 ring-accent shadow-lg shadow-accent/50'
                    : 'w-20 h-12 opacity-50 hover:opacity-100'
                  }
                `}
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal" />
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Reel Counter */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-8 text-accent font-mono text-sm"
        >
          REEL {String(activeIndex + 1).padStart(2, '0')} / {String(PLATFORM_TABS.length).padStart(2, '0')}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================================================
// VARIATION 5: "RADIAL ORBIT" - Futuristic Circular Navigation
// ============================================================================
export const Variation5RadialOrbit: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PLATFORM_TABS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const activeTab = PLATFORM_TABS[activeIndex];

  return (
    <section className="relative py-32 bg-gradient-to-b from-gray-50 via-white to-blue-50 overflow-hidden">
      {/* Radial Grid Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full">
          <defs>
            <pattern id="radial-grid" x="50%" y="50%" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="1" fill="currentColor" className="text-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#radial-grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-primary mb-6 leading-tight">
            Все необходимое<br />для поступления
          </h2>
          <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary to-teal text-white font-bold text-lg shadow-lg">
            в одной платформе
          </div>
        </motion.div>

        {/* Central Orbit System */}
        <div className="relative flex items-center justify-center" style={{ minHeight: '700px' }}>
          {/* Central Display */}
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative z-20"
          >
            {/* Main Browser Display */}
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-[0_40px_120px_-30px_rgba(1,39,139,0.5)] overflow-hidden border-2 border-gray-200">
              {/* Browser Chrome */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200 px-6 py-4 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400 shadow-sm" />
                </div>
                <div className="flex-1 ml-4 bg-white rounded-xl px-5 py-2.5 text-sm text-gray-700 flex items-center gap-3 shadow-inner border border-gray-200">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">pontea.school</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-primary">{activeTab.id}</span>
                </div>
              </div>

              {/* Content Area */}
              <div className="aspect-[16/9] bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-12"
                >
                  <div className="w-32 h-32 mb-8 rounded-3xl bg-gradient-to-br from-primary via-teal to-accent flex items-center justify-center text-white shadow-2xl rotate-6 relative">
                    <div className="absolute inset-0 rounded-3xl bg-white/20 animate-pulse" />
                    <div className="-rotate-6 scale-[2] relative z-10">
                      {activeTab.icon}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 italic mb-6">
                    {activeTab.id}.gif
                  </div>
                  <h3 className="text-3xl font-display font-bold text-primary mb-4 text-center">
                    {activeTab.title}
                  </h3>
                  <p className="text-gray-600 text-center max-w-lg leading-relaxed">
                    {activeTab.description}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Orbiting Tab Selectors */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {PLATFORM_TABS.map((tab, index) => {
              const angle = (index / PLATFORM_TABS.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 380;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isActive = index === activeIndex;

              return (
                <motion.button
                  key={tab.id}
                  className="absolute pointer-events-auto"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: x,
                    y: y,
                    scale: isActive ? 1.2 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  onClick={() => {
                    setActiveIndex(index);
                    setIsAutoRotating(false);
                  }}
                  whileHover={{ scale: isActive ? 1.3 : 1.1 }}
                >
                  {/* Orbit Node */}
                  <div className="relative">
                    {/* Connection Line to Center */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-primary/10 origin-left"
                      style={{
                        width: `${radius}px`,
                        transform: `translate(-${radius}px, -50%) rotate(${angle + Math.PI}rad)`,
                      }}
                      animate={{
                        opacity: isActive ? 0.6 : 0.2,
                      }}
                    />

                    {/* Node Circle */}
                    <div
                      className={`
                        relative w-20 h-20 rounded-full flex items-center justify-center
                        transition-all duration-300 shadow-xl
                        ${isActive
                          ? 'bg-gradient-to-br from-primary to-teal text-white ring-4 ring-accent/50'
                          : 'bg-white text-primary border-2 border-gray-200 hover:border-primary'
                        }
                      `}
                    >
                      <div className="scale-125">
                        {tab.icon}
                      </div>

                      {/* Pulse Effect */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/30"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <motion.div
                      className={`
                        absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap
                        px-4 py-2 rounded-lg text-sm font-bold transition-all
                        ${isActive
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-white text-primary border border-gray-200'
                        }
                      `}
                      animate={{
                        opacity: isActive ? 1 : 0.7,
                        y: isActive ? 0 : 5,
                      }}
                    >
                      {tab.title}
                    </motion.div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Center Pulse Ring */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-[760px] h-[760px] rounded-full border-2 border-dashed border-primary/20" />
          </motion.div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center items-center gap-3 mt-16">
          {PLATFORM_TABS.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => {
                setActiveIndex(index);
                setIsAutoRotating(false);
              }}
              className={`
                relative overflow-hidden transition-all duration-300
                ${index === activeIndex
                  ? 'w-16 h-3 bg-gradient-to-r from-primary to-teal rounded-full'
                  : 'w-3 h-3 bg-gray-300 hover:bg-gray-400 rounded-full'
                }
              `}
            >
              {index === activeIndex && (
                <motion.div
                  className="absolute inset-0 bg-accent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 4.5, ease: "linear" }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// DEMO CONTAINER - Allows switching between all 5 variations
// ============================================================================
export const PlatformShowcaseDemo: React.FC = () => {
  const [selectedVariation, setSelectedVariation] = useState(1);

  const variations = [
    { id: 1, name: 'Floating Cards', component: <Variation1FloatingCards /> },
    { id: 2, name: 'Vertical Timeline', component: <Variation2VerticalTimeline /> },
    { id: 3, name: 'Grid Mosaic', component: <Variation3GridMosaic /> },
    { id: 4, name: 'Horizontal Theater', component: <Variation4HorizontalTheater /> },
    { id: 5, name: 'Radial Orbit', component: <Variation5RadialOrbit /> },
  ];

  return (
    <>
      {/* Variation Selector (Only for demo - remove in production) */}
      <div className="fixed top-4 right-4 z-[100] bg-white rounded-2xl shadow-2xl p-4 border-2 border-primary">
        <div className="text-xs font-bold text-primary mb-2 uppercase">Select Variation</div>
        <div className="flex flex-col gap-2">
          {variations.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVariation(v.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedVariation === v.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {v.id}. {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Render Selected Variation */}
      {variations.find(v => v.id === selectedVariation)?.component}
    </>
  );
};

// Default export for easy integration
export default PlatformShowcaseDemo;
