
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/shared/Header';
import Hero from '@/components/landing/Hero';
import Testimonials from '@/components/landing/Testimonials';
import StressManagementTimeline from '@/components/landing/StressManagementTimeline';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Button from '@/components/shared/Button';
import ExperienceBanner from '@/components/landing/ExperienceBanner';
import ThoughtfulPreparation from '@/components/landing/ThoughtfulPreparation';
import Teachers from '@/components/landing/Teachers';
import MentorSupport from '@/components/landing/MentorSupport';
import PlatformShowcaseDemo from '@/components/landing/PlatformShowcaseVariations';
import ColorSchemeDemo from '@/components/ColorSchemeDemo';
import { TrendingUp, ArrowUpRight, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';

// Progress Tracking Section
const ProgressTracking = () => {
  const levels = ['KL0', 'KL1.1', 'KL1.2', 'KL2.1', 'KL2.2', 'KL3.1', 'KL3.2'];
  const levelDescriptions = [
    "Unfamiliar",
    "Basic Concepts",
    "Slow Understanding",
    "Consistent Accuracy",
    "Strong Competence",
    "Exam Speed",
    "Total Mastery"
  ];

  // Simulation of a student's progress
  // "moved in RC from K2.1 to K2.2" -> Highlighting both blocks
  const progressRows = [
    { domain: 'Reading Comp', prevIdx: 3, currIdx: 4 }, // K2.1 -> K2.2
    { domain: 'Logical Reasoning', prevIdx: 2, currIdx: 4 }, // K1.2 -> K2.2 (Big Jump)
    { domain: 'History', prevIdx: 2, currIdx: 2 }, // Plateau
    { domain: 'Drawing', prevIdx: 1, currIdx: 2 }, // K1.1 -> K1.2
    { domain: 'Math & Physics', prevIdx: 0, currIdx: 1 }, // K0 -> K1.1
  ];

  return (
    <section className="section-padding bg-gray-50 border-b border-gray-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-4 border border-green-200">
              <TrendingUp className="w-3 h-3" />
              Continuous Feedback
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
              Visualizing Your <span className="text-green-600">Growth</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              The "Knowledge Matrix" breaks down your learning into 3 simple stages: <strong>Foundation</strong>, <strong>Competence</strong>, and <strong>Mastery</strong>.
            </p>
            <p className="text-gray-500 mb-6">
              Instead of a vague percentage, you see exactly where you stand in each subject. Watch the grid fill up as you unlock higher levels.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/assessment">
                <Button size="lg" className="shadow-lg shadow-primary/20 group w-full sm:w-auto">
                  Get Your Personal Matrix
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="text-sm text-gray-400 font-medium">
                Free 5-min diagnostic
              </div>
            </div>
          </motion.div>

          <div className="flex-1 w-full">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 relative">

              {/* Enhanced Header */}
              <div className="mb-6 border-b border-gray-100 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-primary text-lg flex items-center gap-2">
                      Your Progress Map
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 text-gray-300 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-[10px] p-2 rounded z-20">
                          This grid tracks your skill level from KL0 (Beginner) to KL3.2 (Mastery) for each subject.
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">Month 2 Assessment Report</div>
                  </div>
                  <div className="text-xs font-bold text-white bg-primary px-3 py-1 rounded-full shadow-sm">
                    Target: All Filled
                  </div>
                </div>

                {/* Improved Legend */}
                <div className="flex flex-wrap gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm"></div>
                    <span className="text-gray-600">Secure Knowledge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm shadow-sm"></div>
                    <span className="text-green-700 font-bold">New Gains</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>
                    <span className="text-gray-400">To Learn</span>
                  </div>
                </div>
              </div>

              {/* Matrix Column Groups */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                <div className="col-span-3 text-center pb-2 border-b-2 border-gray-100">
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Foundation</div>
                </div>
                <div className="col-span-2 text-center pb-2 border-b-2 border-accent/30">
                  <div className="text-[10px] uppercase font-bold text-yellow-600 tracking-wider">Competence</div>
                </div>
                <div className="col-span-2 text-center pb-2 border-b-2 border-primary/20">
                  <div className="text-[10px] uppercase font-bold text-primary tracking-wider">Mastery</div>
                </div>
              </div>

              {/* Matrix Rows */}
              <div className="space-y-4">
                {progressRows.map((row, i) => (
                  <div key={i} className="">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5 px-1">
                      <span>{row.domain}</span>
                      {row.currIdx > row.prevIdx && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + (i * 0.1) }}
                          className="text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full"
                        >
                          +{row.currIdx - row.prevIdx} Levels <ArrowUpRight className="w-3 h-3" />
                        </motion.span>
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-1 h-10">
                      {levels.map((lvl, lvlIdx) => {
                        const isGrowth = row.currIdx > row.prevIdx;
                        const isGrowthRange = isGrowth && (lvlIdx >= row.prevIdx && lvlIdx <= row.currIdx);
                        const isRetained = !isGrowthRange && lvlIdx <= row.prevIdx;

                        let style = "bg-gray-50 border border-gray-100 text-gray-300";
                        let content = null;

                        if (isGrowthRange) {
                          style = "bg-green-500 text-white border-green-600 shadow-md ring-1 ring-green-200 z-10";
                          if (lvlIdx === row.currIdx) content = <CheckCircle2 className="w-4 h-4" />;
                        } else if (isRetained) {
                          style = "bg-blue-100 border-blue-200 text-blue-300";
                        }

                        return (
                          <motion.div
                            key={lvlIdx}
                            initial={{ opacity: 0, scale: 0.5 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{
                              delay: (i * 0.1) + (lvlIdx * 0.05),
                              duration: 0.3,
                              type: "spring",
                              stiffness: 300,
                              damping: 20
                            }}
                            className={`group relative rounded-md flex items-center justify-center text-[10px] font-bold cursor-help transition-all duration-300 ${style}`}
                          >
                            {content && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: (i * 0.1) + (lvlIdx * 0.05) + 0.2, type: "spring" }}
                              >
                                {content}
                              </motion.div>
                            )}
                            <span className={`absolute bottom-0.5 text-[8px] ${isGrowthRange ? 'text-green-100' : 'hidden'}`}>{lvl}</span>

                            {/* Cell Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block min-w-[100px] bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl z-50 text-center pointer-events-none whitespace-nowrap">
                              <div className="font-bold text-accent mb-0.5">{lvl}</div>
                              {levelDescriptions[lvlIdx]}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Methodology Preview Section
const MethodologyPreview = () => (
  <section className="section-padding bg-white border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
          Proprietary Methodology
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
          The Knowledge Matrix™
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Success in the ARCHED exam isn't about memorizing facts. It's about systematically climbing from <strong>Beginner</strong> to <strong>Mastery</strong> across 5 distinct domains. We track your "Knowledge Level" (KL) to guarantee your score.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {[
          {
            level: 'KL0',
            title: 'Pre-Foundation',
            desc: 'Unfamiliar concepts. High risk of negative marking.',
            color: 'text-gray-300',
            bg: 'bg-gray-50',
            border: 'border-gray-100'
          },
          {
            level: 'KL1',
            title: 'Foundation',
            desc: 'Conceptual understanding but slow execution.',
            color: 'text-blue-300',
            bg: 'bg-blue-50/50',
            border: 'border-blue-100'
          },
          {
            level: 'KL2',
            title: 'Competence',
            desc: 'Reliable accuracy on standard questions.',
            color: 'text-accent',
            bg: 'bg-amber-50/50',
            border: 'border-accent/20'
          },
          {
            level: 'KL3',
            title: 'Mastery',
            desc: 'Automatic recognition. Speed under 45s.',
            color: 'text-white/40',
            bg: 'bg-primary text-white shadow-xl scale-105 transform',
            border: 'border-transparent' // KL3 is highlighted
          }
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-2xl border flex flex-col ${card.bg} ${card.border}`}
          >
            <div className={`text-3xl font-bold mb-3 ${card.color}`}>{card.level}</div>
            <h3 className={`font-bold text-lg mb-2 ${card.bg.includes('text-white') ? 'text-white' : 'text-primary'}`}>{card.title}</h3>
            <p className={`text-sm ${card.bg.includes('text-white') ? 'text-blue-100' : 'text-gray-500'}`}>{card.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/methodology">
          <Button variant="outline" className="border-primary text-primary hover:bg-blue-50">
            Explore the Methodology
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <ColorSchemeDemo />
      <ExperienceBanner />
      <Testimonials />
      <StressManagementTimeline />
      <PlatformShowcaseDemo />
      <Teachers />
      <ThoughtfulPreparation />
      <MentorSupport />
      <Pricing />
      <FAQ />

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-2xl font-display font-bold mb-2">PONTEA</div>
              <p className="text-blue-200 text-sm">Architecture Entrance Prep</p>
            </div>
            <div className="flex gap-8 text-sm text-blue-200">
              <Link href="/methodology" className="hover:text-white">Methodology</Link>
              <a href="#pricing" className="hover:text-white">Pricing</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
            <div className="text-xs text-blue-300">
              © 2024 Pontea School.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
