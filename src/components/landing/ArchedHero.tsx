import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/shared/Button';
import { ArrowRight, CheckCircle, Users, PlayCircle, Trophy } from 'lucide-react';

const StatBox = ({ icon: Icon, value, label }: { icon: any, value: string, label: string }) => (
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

const ArchedHero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-white">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-blue-100 text-primary text-sm font-bold mb-8">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
              Enrolling for 2024/2025 Cycle
            </div>

            <h1 className="text-5xl lg:text-7xl font-display font-bold text-primary leading-tight mb-6 tracking-tight">
              Master the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Architecture</span>
              <span className="relative inline-block ml-4">
                 Future
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.7501 2.99999 83.2501 2.5 200 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
              The premier preparation platform for <strong>ARCHED (PoliMi)</strong> and <strong>TIL-A (PoliTo)</strong>. We turn aspirants into architecture students.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/ru/assessment">
                <Button
                  size="lg"
                  variant="secondary"
                  className="shadow-xl shadow-primary/20 hover:shadow-primary/30 w-full sm:w-auto group border-transparent"
                >
                  Start Free Assessment
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/ru">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-primary/10 hover:border-primary text-primary hover:bg-blue-50"
                >
                  Book Consultation
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex -space-x-4">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100',
                  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100'
                ].map((src, i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                    <img src={src} alt="Student" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex text-accent">
                   {[1,2,3,4,5].map(s => <span key={s}>★</span>)}
                </div>
                <p className="text-slate-600">Trusted by <span className="text-primary font-bold">500+ students</span></p>
              </div>
            </div>
          </motion.div>

          <div className="relative lg:h-[600px] flex items-center justify-center">
             {/* Decorative background for the stats cluster */}
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-[3rem] -rotate-3 transform scale-90" />

             <div className="grid grid-cols-2 gap-5 relative z-10 w-full max-w-lg">
               <motion.div
                 className="space-y-5 pt-12"
                 initial={{ y: 40, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.1 }}
               >
                  <StatBox icon={PlayCircle} value="40+ hrs" label="Video Lectures" />
                  <div className="bg-primary p-6 rounded-2xl text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500 ease-out" />
                    <div className="relative z-10">
                        <Trophy className="w-8 h-8 text-accent mb-3" />
                        <div className="text-4xl font-display font-bold text-white mb-1">98%</div>
                        <div className="text-blue-100 text-sm font-medium">Admission Rate</div>
                    </div>
                  </div>
               </motion.div>

               <motion.div
                 className="space-y-5"
                 initial={{ y: 40, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
               >
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-green-600 uppercase">Live Now</span>
                     </div>
                     <div className="text-sm text-gray-600 font-medium mb-4">Architecture History Class</div>
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white" />
                        ))}
                        <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">+12</div>
                     </div>
                  </div>
                  <StatBox icon={Users} value="90+" label="Students in Italy" />
                  <StatBox icon={Users} value="6" label="Expert Teachers" />
               </motion.div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ArchedHero;
