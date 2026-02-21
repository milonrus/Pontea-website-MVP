import React, { useState, useEffect, useRef } from 'react';
import { Lock, Play, FileText, BookOpen, CheckSquare } from 'lucide-react';
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
    description: locale === 'en' ? '30+ hours of recorded lectures with clear, exam-focused explanations.' : '30+ часов записанных лекций с самыми доступными объяснениями',
    icon: <Play className="w-5 h-5" />,
    videoSrc: '/platform/video-lectures'
  },
  {
    id: 'notes',
    title: locale === 'en' ? 'Study Notes' : 'Конспекты',
    description: locale === 'en' ? '60 concise notes across all topics for fast review and retention.' : '60 конспектов по всем темам для повторения материала',
    icon: <FileText className="w-5 h-5" />,
    videoSrc: '/platform/notes'
  },
  {
    id: 'question-bank',
    title: locale === 'en' ? 'Question Bank' : 'Банк заданий',
    description: locale === 'en' ? '1000+ targeted exercises to strengthen every exam topic.' : '1000+ упражнений для закрепления тем',
    icon: <BookOpen className="w-5 h-5" />,
    videoSrc: '/platform/question-bank'
  },
  {
    id: 'practice-exams',
    title: locale === 'en' ? 'Practice Exams' : 'Пробные экзамены',
    description: locale === 'en' ? '10 full mock exams that simulate real test timing and pressure.' : '10 полноценных пробных экзаменов с полным погружением в реальные условия тестирования',
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
        <div className="platform-selector-pills">
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelect(index)}
                className={`platform-selector-button ${isActive ? 'platform-selector-button-active' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {tab.icon}
                  {tab.title}
                </span>
              </button>
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
  const [videoResetKey, setVideoResetKey] = useState(0);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
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
          setHasEnteredViewport(true);
          setVideoResetKey((k) => k + 1);
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
    setVideoResetKey((k) => k + 1);
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
    manualOverrideRef.current = true;
    setVideoResetKey((k) => k + 1);
    // Re-enable auto-advance after this video finishes
    window.setTimeout(() => { manualOverrideRef.current = false; }, 500);
  };

  const activeTab = PLATFORM_TABS[activeIndex];

  return (
    <section ref={sectionRef} className="platform-showcase-section relative py-16 sm:py-20 md:py-24 overflow-hidden">
      <div className="platform-showcase-top-orb" />
      <div className="platform-showcase-bottom-orb" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="platform-showcase-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary mb-0 leading-tight">
            {locale === 'en' ? 'Everything you need to get in, in one platform' : (
              <>
                Все необходимое для поступления<br />
                <span className="platform-showcase-heading-accent">
                  в одной платформе
                </span>
              </>
            )}
          </h2>
        </div>

        {/* Feature Selector */}
        <SelectorPills activeIndex={activeIndex} onSelect={handleCardClick} tabs={PLATFORM_TABS} />

        <div className="relative mx-auto w-full max-w-4xl">
          <div className="platform-showcase-card-shell">
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
                <PlatformVideo
                  key={activeTab.id}
                  src={activeTab.videoSrc}
                  isActive
                  shouldLoad={hasEnteredViewport}
                  placeholderLabel={activeTab.title}
                  resetKey={videoResetKey}
                  onEnded={handleVideoEnded}
                />
              </div>
            </div>

            {/* Card Info */}
            <div className="p-8 bg-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  {activeTab.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-display font-bold text-primary mb-2">
                    {activeTab.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {activeTab.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-3 mt-12">
          {PLATFORM_TABS.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
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
