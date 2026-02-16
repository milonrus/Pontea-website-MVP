import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { BookOpen, CheckSquare, ArrowRight, MonitorPlay, FileText, BrainCircuit, ChevronLeft, ChevronRight, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '@/components/shared/Button';
import Link from 'next/link';

const FEATURES = [
    {
        id: 'video',
        tabLabel: 'Video Lessons',
        title: 'Cinematic Video Lectures',
        description: 'Forget boring slides. Our lessons feature expert instructors with dynamic overlays, architectural blueprint analysis, and visual explanations.',
        icon: MonitorPlay,
        image: 'https://res.cloudinary.com/dc9ms1vlb/image/upload/v1768806075/video_lessons_re3mg6.png',
        highlights: ['40+ Hours of Content', 'Visual Blueprint Analysis', 'Expert Instructors']
    },
    {
        id: 'material',
        tabLabel: 'Study Materials',
        title: 'Comprehensive Library',
        description: 'Access a vast library of structured theory summaries, history recaps, and downloadable PDFs. Everything is organized for rapid revision.',
        icon: FileText,
        image: 'https://res.cloudinary.com/dc9ms1vlb/image/upload/v1768806324/practical_ebooks_uk7wmq.png',
        highlights: ['250+ Pages of Theory', 'History Timelines', 'Downloadable PDFs']
    },
    {
        id: 'practice',
        tabLabel: 'Practice Lab',
        title: 'Infinite Practice Mode',
        description: 'Test your skills with thousands of exam-style questions. Our adaptive platform creates custom quizzes for Math, Logic, and Reading.',
        icon: BrainCircuit,
        image: 'https://res.cloudinary.com/dc9ms1vlb/image/upload/v1768806317/excerises_rmhqpj.png',
        highlights: ['1000+ Question Bank', 'Step-by-step Solutions', 'Performance Tracking']
    }
];

export default function SchoolShowcase() {
    const [activeTab, setActiveTab] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Ref to track if we are performing a manual click-to-scroll action
    const isManualScroll = useRef(false);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        // Only activate scroll switching on desktop AND if not manually scrolling
        if (window.innerWidth >= 1024 && !isManualScroll.current) {
            // Adjusted breakpoints: 
            // 0 - 0.25: Video
            // 0.25 - 0.75: Study Materials
            // 0.75 - 1.0: Practice

            if (latest < 0.25) {
                if (activeTab !== 0) setActiveTab(0);
            } else if (latest < 0.75) {
                if (activeTab !== 1) setActiveTab(1);
            } else {
                if (activeTab !== 2) setActiveTab(2);
            }
        }
    });

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
    }, []);

    const handleTabClick = (idx: number) => {
        if (window.innerWidth < 1024) {
            setActiveTab(idx);
            return;
        }

        // Lock auto-switching
        isManualScroll.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

        // Update UI immediately so user sees the target tab
        setActiveTab(idx);

        // Scroll to the corresponding section of the sticky container
        if (containerRef.current) {
            const sectionTop = containerRef.current.offsetTop;
            const sectionHeight = containerRef.current.offsetHeight;

            // Map indices to new centered scroll percentages:
            // 0 -> 0.125 (center of 0-0.25)
            // 1 -> 0.5   (center of 0.25-0.75)
            // 2 -> 0.875 (center of 0.75-1.0)
            let ratio = 0.125;
            if (idx === 1) ratio = 0.5;
            if (idx === 2) ratio = 0.875;

            window.scrollTo({
                top: sectionTop + (sectionHeight * ratio),
                behavior: 'smooth'
            });

            // Release lock after scroll animation (approx 800-1000ms)
            scrollTimeout.current = setTimeout(() => {
                isManualScroll.current = false;
            }, 1000);
        }
    };

    return (
        <section ref={containerRef} className="bg-white relative lg:h-[400vh]">
            <div className="lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col lg:justify-center lg:overflow-hidden">
                <div className="py-12 lg:py-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

                    {/* Section Header */}
                    <div className="text-center max-w-3xl mx-auto mb-8 lg:mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
                            Inside the Platform
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
                            Everything you need to <span className="text-accent">Pass</span>
                        </h2>
                        <p className="text-lg text-gray-600">
                            We've built a complete ecosystem for architecture preparation. No heavy textbooks, just a streamlined digital experience.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:items-center">

                        {/* Left Column: Navigation & Text */}
                        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
                            {/* Tabs - Mobile: Horizontal Scroll, Desktop: Vertical List */}
                            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x hide-scrollbar">
                                {FEATURES.map((feature, idx) => (
                                    <button
                                        key={feature.id}
                                        onClick={() => handleTabClick(idx)}
                                        className={`
                        text-left p-4 lg:p-6 rounded-xl transition-all duration-300 border flex items-center gap-3 lg:gap-4 group
                        min-w-[260px] lg:min-w-0 snap-center flex-shrink-0
                        ${activeTab === idx
                                                ? 'bg-primary text-white border-primary shadow-lg scale-[1.02] ring-2 ring-offset-2 ring-primary lg:ring-0 lg:ring-offset-0'
                                                : 'bg-white text-gray-600 border-gray-100 hover:border-blue-100 hover:bg-blue-50'}
                    `}
                                    >
                                        <div className={`
                        p-2 lg:p-3 rounded-lg flex-shrink-0 transition-colors
                        ${activeTab === idx ? 'bg-white/10 text-accent' : 'bg-gray-100 text-gray-400 group-hover:text-primary'}
                    `}>
                                            <feature.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                        </div>
                                        <div>
                                            <div className={`font-bold text-base lg:text-lg mb-0.5 lg:mb-1 ${activeTab === idx ? 'text-white' : 'text-primary'}`}>
                                                {feature.tabLabel}
                                            </div>
                                            <div className={`text-sm leading-relaxed ${activeTab === idx ? 'text-blue-100' : 'hidden lg:block text-gray-400'}`}>
                                                <span className="lg:hidden">
                                                    {activeTab === idx ? 'Selected' : ''}
                                                </span>
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="hidden lg:block"
                                                >
                                                    {feature.id === 'video' && 'Watch expert lessons.'}
                                                    {feature.id === 'material' && 'Read summaries.'}
                                                    {feature.id === 'practice' && 'Test your skills.'}
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Desktop Scroll Progress Indicator */}
                                        <div className="ml-auto hidden lg:block">
                                            {activeTab === idx && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 hidden lg:block">
                                <Link href="/assessment/">
                                    <Button size="lg" variant="primary" className="w-full shadow-xl shadow-accent/20">
                                        Try it Free
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Right Column: Display Area */}
                        <div className="lg:col-span-7 relative h-[450px] sm:h-[500px] bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 p-2 sm:p-4 shadow-2xl">
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full bg-white rounded-xl lg:rounded-2xl overflow-hidden relative flex flex-col shadow-inner"
                                >
                                    {/* Browser Header Visual */}
                                    <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-2 shrink-0 z-20 relative">
                                        <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-red-400"></div>
                                        <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-green-400"></div>
                                        <div className="ml-2 lg:ml-4 px-3 py-0.5 bg-white rounded-md text-[10px] text-gray-400 flex-1 text-center font-mono truncate">pontea.school/{FEATURES[activeTab].id}</div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 relative group bg-gray-900 overflow-hidden">
                                        {FEATURES[activeTab].id === 'video' ? (
                                            <iframe
                                                className="w-full h-full absolute inset-0"
                                                src="https://www.youtube.com/embed/5s6prUYmZSs?si=QLVhHbjLkc2gqawe"
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                                referrerPolicy="strict-origin-when-cross-origin"
                                            ></iframe>
                                        ) : FEATURES[activeTab].id === 'material' ? (
                                            <div className="absolute inset-0 overflow-y-auto bg-white p-4 lg:p-8 text-left">
                                                <div className="max-w-2xl mx-auto">
                                                    <span className="text-xs font-bold text-accent uppercase tracking-wider mb-2 block">Module 4.2: Art History</span>
                                                    <h3 className="text-xl lg:text-2xl font-display font-bold text-primary mb-4 lg:mb-6">The High Renaissance</h3>

                                                    <p className="text-sm lg:text-base text-gray-600 mb-6 leading-relaxed">
                                                        The Renaissance marked a conscious revival of Classical Roman principles: <strong>symmetry</strong>, <strong>proportion</strong>, and <strong>geometry</strong>. Unlike the verticality of Gothic style, Renaissance architects emphasized the human scale and rational order.
                                                    </p>

                                                    <div className="mb-8">
                                                        <h4 className="text-base lg:text-lg font-bold text-primary mb-3 flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-accent"></div>
                                                            Key Figures to Memorize
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            <li className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm text-gray-600 border-b border-gray-50 pb-2">
                                                                <span className="font-bold text-primary sm:w-32 shrink-0">Filippo Brunelleschi</span>
                                                                <span>Pioneered linear perspective. Engineered the dome of Santa Maria del Fiore (1420–1436).</span>
                                                            </li>
                                                            <li className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm text-gray-600 border-b border-gray-50 pb-2">
                                                                <span className="font-bold text-primary sm:w-32 shrink-0">Leon Battista Alberti</span>
                                                                <span>Codified theory in <em>De re aedificatoria</em>. Designed the façade of Santa Maria Novella.</span>
                                                            </li>
                                                            <li className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm text-gray-600 border-b border-gray-50 pb-2">
                                                                <span className="font-bold text-primary sm:w-32 shrink-0">Donato Bramante</span>
                                                                <span>Introduced the High Renaissance style in Rome. Designed the Tempietto (1502).</span>
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    <h4 className="text-base lg:text-lg font-bold text-primary mb-3">The Classical Orders</h4>
                                                    <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                                                        Renaissance architects strictly adhered to the five orders: Tuscan, Doric, Ionic, Corinthian, and Composite. The <strong>Tempietto</strong> by Bramante is considered the perfect example of the High Renaissance style, utilizing the Doric order in a circular plan (tholos).
                                                    </p>

                                                    {/* Image 2: Bramante/Classical details */}
                                                    <div className="mb-8 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                                        <img src="https://images.unsplash.com/photo-1564399580075-5dfe19c205f3?auto=format&fit=crop&q=80&w=800" alt="Classical Architecture Details" className="w-full h-48 object-cover" />
                                                        <div className="bg-gray-50 p-3 text-xs text-gray-500 italic border-t border-gray-100">
                                                            Fig 2. Application of classical orders and symmetry in High Renaissance façades.
                                                        </div>
                                                    </div>

                                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 lg:p-5 mb-8">
                                                        <h5 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-2">
                                                            <span className="bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded">EXAM TIP</span>
                                                            The "Ideal City" Concept
                                                        </h5>
                                                        <p className="text-sm text-blue-800 leading-relaxed">
                                                            Always distinguish between the <em>Early Renaissance</em> (Florence) and <em>High Renaissance</em> (Rome). Questions often ask you to map a building like the <strong>Tempietto</strong> to the correct period.
                                                        </p>
                                                    </div>

                                                    <p className="text-gray-400 text-xs italic text-center border-t border-gray-100 pt-8">
                                                        End of preview. Unlock full access to read about Mannerism and Baroque.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-white flex flex-col font-sans h-full">

                                                <div className="flex flex-col md:flex-row h-full">
                                                    {/* LEFT COLUMN: Question */}
                                                    <div className="flex-1 flex flex-col md:border-r border-gray-100 relative h-1/2 md:h-full">
                                                        {/* Navigation Header */}
                                                        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 shrink-0">
                                                            <button className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-400 hover:text-primary transition-colors">
                                                                <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" /> PREV
                                                            </button>
                                                            <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">Q 6/18</span>
                                                            <button className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-400 hover:text-primary transition-colors">
                                                                NEXT <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Scrollable Question Area */}
                                                        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center bg-white/50">
                                                            <div className="w-full max-w-sm">
                                                                <p className="text-gray-500 mb-4 md:mb-6 text-xs md:text-sm font-medium">Find the root of the equation:</p>

                                                                <div className="text-lg md:text-2xl font-serif font-bold text-gray-800 mb-6 md:mb-8 tracking-wide">
                                                                    log<sub className="text-xs md:text-sm">2</sub>(x + 1) = log<sub className="text-xs md:text-sm">2</sub>(12 − 3x)
                                                                </div>

                                                                <div className="space-y-2 md:space-y-3">
                                                                    {[
                                                                        { val: '11/4', status: 'correct' },
                                                                        { val: '-2', status: 'neutral' },
                                                                        { val: '15/8', status: 'wrong', selected: true },
                                                                        { val: '3', status: 'neutral' },
                                                                        { val: '5/2', status: 'neutral' }
                                                                    ].map((opt, i) => (
                                                                        <div key={i} className={`
                                            group flex items-center p-2 md:p-3 rounded-lg md:rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden
                                            ${opt.status === 'wrong' && opt.selected
                                                                                ? 'bg-red-50 border-red-200 text-red-900 shadow-sm'
                                                                                : opt.status === 'correct'
                                                                                    ? 'bg-white border-green-200 text-green-700 opacity-60' // Subtle hint at correct answer
                                                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/30'
                                                                            }
                                            `}>
                                                                            <div className={`
                                                w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center mr-3 md:mr-4 shrink-0 transition-colors
                                                ${opt.status === 'wrong' && opt.selected ? 'border-red-500 bg-red-100' :
                                                                                    opt.status === 'correct' ? 'border-green-400' : 'border-gray-300 group-hover:border-blue-300'}
                                            `}>
                                                                                {opt.status === 'wrong' && opt.selected && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500" />}
                                                                                {opt.status === 'correct' && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-400 opacity-0 group-hover:opacity-100" />}
                                                                            </div>
                                                                            <span className="font-medium text-sm md:text-lg">{opt.val}</span>

                                                                            {opt.status === 'wrong' && opt.selected && (
                                                                                <XCircle className="ml-auto w-4 h-4 md:w-5 md:h-5 text-red-500" />
                                                                            )}
                                                                            {opt.status === 'correct' && (
                                                                                <CheckCircle2 className="ml-auto w-4 h-4 md:w-5 md:h-5 text-green-500 opacity-0 group-hover:opacity-100" />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT COLUMN: Explanation */}
                                                    <div className="w-full md:w-[45%] h-1/2 md:h-auto bg-gray-50 flex flex-col border-t md:border-t-0 md:border-l border-gray-100 overflow-hidden">
                                                        <div className="p-4 md:p-6 h-full overflow-y-auto custom-scrollbar">
                                                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1 md:p-1.5 bg-accent/20 rounded-lg">
                                                                        <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-accent-dark" />
                                                                    </div>
                                                                    <h3 className="text-xs md:text-sm font-bold text-gray-900 tracking-wider uppercase">Explanation</h3>
                                                                </div>
                                                                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200">Incorrect</span>
                                                            </div>

                                                            <div className="space-y-4 md:space-y-6 text-xs md:text-sm text-gray-600">
                                                                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
                                                                    <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                                                                        <span className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary text-white text-[10px] md:text-xs">1</span>
                                                                        Equate Arguments
                                                                    </h4>
                                                                    <p className="leading-relaxed mb-2 text-[10px] md:text-xs">
                                                                        Since bases are identical (<span className="font-serif italic">log₂</span>), arguments must be equal:
                                                                    </p>
                                                                    <div className="bg-gray-50 p-2 rounded border border-gray-100 font-mono text-center font-bold text-gray-800 text-xs md:text-sm">
                                                                        x + 1 = 12 - 3x
                                                                    </div>
                                                                </div>

                                                                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm hidden sm:block">
                                                                    <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                                                                        <span className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary text-white text-[10px] md:text-xs">2</span>
                                                                        Solve for x
                                                                    </h4>
                                                                    <p className="leading-relaxed mb-2 text-[10px] md:text-xs">
                                                                        Isolate x by adding <code className="bg-gray-100 px-1 rounded">3x</code>...
                                                                    </p>
                                                                    <div className="flex flex-col gap-1 items-center bg-gray-50 p-2 rounded border border-gray-100 font-mono text-gray-800 text-xs md:text-sm">
                                                                        <div className="text-green-600 font-bold">x = 11/4</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Bottom CTA in panel */}
                                                        <div className="p-3 md:p-4 bg-white border-t border-gray-200 shrink-0">
                                                            <button className="w-full py-2.5 md:py-3 bg-primary text-white rounded-lg md:rounded-xl text-xs md:text-sm font-bold hover:bg-secondary transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group">
                                                                Next Question
                                                                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="lg:hidden col-span-12 mt-4">
                            <Link href="/assessment/">
                                <Button size="lg" className="w-full shadow-xl shadow-accent/20">
                                    Try it Free
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
