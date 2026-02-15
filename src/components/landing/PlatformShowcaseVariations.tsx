import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Play, FileText, BookOpen, CheckSquare, Users, Heart } from 'lucide-react';
import PlatformVideo from './PlatformVideo';

interface PlatformTab {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  videoSrc: string;
}

const getPlatformTabs = (locale: 'en' | 'ru' = 'ru'): PlatformTab[] => [
  {
    id: 'video-lectures',
    title: locale === 'en' ? 'Video Lectures' : 'Видео-лекции',
    description: locale === 'en' ? 'translate' : '30+ часов записанных лекций с самыми доступными объяснениями',
    icon: <Play className="w-5 h-5" />,
    videoSrc: '/platform/video-lectures'
  },
  {
    id: 'notes',
    title: locale === 'en' ? 'Study Notes' : 'Конспекты',
    description: locale === 'en' ? 'translate' : '60 конспектов по всем темам для повторения материала',
    icon: <FileText className="w-5 h-5" />,
    videoSrc: '/platform/notes'
  },
  {
    id: 'question-bank',
    title: locale === 'en' ? 'Question Bank' : 'Банк заданий',
    description: locale === 'en' ? 'translate' : '1000+ упражнений для закрепления тем',
    icon: <BookOpen className="w-5 h-5" />,
    videoSrc: '/platform/question-bank'
  },
  {
    id: 'practice-exams',
    title: locale === 'en' ? 'Practice Exams' : 'Пробные экзамены',
    description: locale === 'en' ? 'transltate' : '10 полноценных пробных экзаменов с полным погружением в реальные условия тестирования',
    icon: <CheckSquare className="w-5 h-5" />,
    videoSrc: '/platform/practice-exams'
  },
  // {
  //   id: 'saturday-school',
  //   title: 'Субботняя школа',
  //   description: 'Онлайн занятия для обсуждения самых интересных тем и ответов на любые вопросы',
  //   icon: <Users className="w-5 h-5" />,
  //   videoSrc: '/platform/saturday-school'
  // },
  // {
  //   id: 'mentorship',
  //   title: 'Менторство',
  //   description: 'Разрабатываем персональный план подготовки. Помогаем с мотивацией и следим за прогрессом!',
  //   icon: <Heart className="w-5 h-5" />,
  //   videoSrc: '/platform/mentorship'
  // }
];

// ============================================================================
// Pill Tab Bar Selector
// ============================================================================

interface SelectorProps {
  activeIndex: number;
  onSelect: (index: number) => void;
  tabs: PlatformTab[];
}

const SelectorPills: React.FC<SelectorProps> = ({ activeIndex, onSelect, tabs }) => {
  return (
    <div className="relative mb-4">
      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-1 p-1.5 rounded-full bg-gray-100/80 backdrop-blur-sm border border-gray-200/60 max-w-full">
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex;
            return (
              <motion.button
                key={tab.id}
                onClick={() => onSelect(index)}
                className={`
                  relative flex items-center justify-center gap-2 px-3 sm:px-4 md:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap
                  flex-shrink-0 transition-all duration-200
                  ${isActive
                    ? 'text-white'
                    : 'text-gray-500 hover:text-primary hover:bg-white/60'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="selectorPillBg"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_2px_12px_-2px_rgba(1,39,139,0.4)]"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.title}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Platform Showcase - Floating Cards with Pill Selector
// ============================================================================

interface PlatformShowcaseProps {
  locale?: 'en' | 'ru';
}

const PlatformShowcase: React.FC<PlatformShowcaseProps> = ({ locale = 'ru' }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [videoResetKey, setVideoResetKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const hasEnteredView = useRef(false);
  const manualOverrideRef = useRef(false);

  const PLATFORM_TABS = getPlatformTabs(locale);

  // IntersectionObserver: start carousel only when section enters viewport (once)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEnteredView.current) {
          hasEnteredView.current = true;
          setActiveIndex(0);
          setVideoResetKey((k) => k + 1);
          setIsAutoAdvancing(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleVideoEnded = () => {
    if (manualOverrideRef.current) return;
    setActiveIndex((prev) => (prev + 1) % PLATFORM_TABS.length);
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
    manualOverrideRef.current = true;
    // Re-enable auto-advance after this video finishes
    setTimeout(() => { manualOverrideRef.current = false; }, 500);
  };

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-20 md:py-24 overflow-hidden bg-gradient-to-br from-[#f8faff] via-white to-[#fffbf0]">
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
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary mb-0 leading-tight">
            {locale === 'en' ? 'Everything you need to get in, in one platform' : (
              <>
                Все необходимое для поступления<br />
                <span className="bg-gradient-to-r from-primary via-teal to-accent bg-clip-text text-transparent">
                  в одной платформе
                </span>
              </>
            )}
            {locale === 'en' && (
              <span className="bg-gradient-to-r from-primary via-teal to-accent bg-clip-text text-transparent">
                {' '}
              </span>
            )}
          </h2>
        </motion.div>

        {/* Feature Selector */}
        <SelectorPills activeIndex={activeIndex} onSelect={handleCardClick} tabs={PLATFORM_TABS} />

        {/* 3D Card Stack */}
        <div className="relative h-[420px] sm:h-[500px] md:h-[700px] flex items-center justify-center perspective-[2000px]">
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
                  x: offset * 70,
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

                    {/* Platform Video */}
                    <div className="absolute inset-0 pt-12">
                      <PlatformVideo src={tab.videoSrc} isActive={isActive} resetKey={isActive ? videoResetKey : undefined} onEnded={isActive ? handleVideoEnded : undefined} />
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

export default PlatformShowcase;
