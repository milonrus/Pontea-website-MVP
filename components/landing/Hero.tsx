import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../shared/Button';
import { ArrowRight, CheckCircle, Users, PlayCircle, Trophy } from 'lucide-react';

const StatBox = ({ icon: Icon, value, label }: { icon: any, value: string, label: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"
  >
    <div className="p-3 bg-accent/10 rounded-lg text-accent-dark">
      <Icon className="w-6 h-6 text-yellow-600" />
    </div>
    <div>
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
    </div>
  </motion.div>
);

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 -skew-x-12 transform origin-top translate-x-1/4 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              Enrolling for 2024/2025
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-display font-bold text-primary leading-tight mb-6">
              The Only School That <span className="relative">
                <span className="relative z-10">Guarantees</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-accent/40 -rotate-1 z-0"></span>
              </span> Your Architecture Future
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-xl leading-relaxed">
              We prepare international students for the <strong>ARCHED (PoliMi)</strong> and <strong>TIL-A (PoliTo)</strong> exams. Get the score you need to study in Italy's top universities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/assessment">
                <Button size="lg" className="shadow-lg shadow-accent/20 w-full sm:w-auto group">
                  Start Free Assessment
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Book Consultation
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src={`https://picsum.photos/100/100?random=${i}`} alt="Student" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p>Trusted by <span className="text-primary font-bold">500+ students</span></p>
            </div>
          </motion.div>

          <div className="relative">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-4 mt-8">
                  <StatBox icon={PlayCircle} value="40+ hrs" label="Video Lectures" />
                  <StatBox icon={Users} value="90+" label="Students in Italy" />
               </div>
               <div className="space-y-4">
                  <StatBox icon={Users} value="6" label="Expert Teachers" />
                  <StatBox icon={Trophy} value="100%" label="Score Improvement" />
                  <div className="bg-primary p-6 rounded-xl text-white shadow-xl mt-4">
                    <div className="text-3xl font-display font-bold text-accent mb-1">5 Years</div>
                    <div className="text-sm opacity-80">of preparation experience</div>
                  </div>
               </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
