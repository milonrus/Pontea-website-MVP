import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Target, Brain } from 'lucide-react';
import Button from '../shared/Button';

const IntroScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl text-center"
      >
        <div className="inline-block p-4 bg-accent/10 rounded-full mb-6">
           <Target className="w-8 h-8 text-accent-dark" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">
          Discover Your Architecture Potential
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          In just 5 minutes, we'll analyze your current knowledge in Math, Logic, and Art History to create a personalized study plan for the ARCHED or TIL-A exam.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
          <div className="bg-gray-50 p-4 rounded-xl">
             <Clock className="w-5 h-5 text-accent mb-2" />
             <h3 className="font-bold text-primary">~5 Mins</h3>
             <p className="text-sm text-gray-500">Quick adaptive test</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl">
             <Brain className="w-5 h-5 text-accent mb-2" />
             <h3 className="font-bold text-primary">Smart AI</h3>
             <p className="text-sm text-gray-500">Adapts to your level</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl">
             <Target className="w-5 h-5 text-accent mb-2" />
             <h3 className="font-bold text-primary">Free Plan</h3>
             <p className="text-sm text-gray-500">Get a study roadmap</p>
          </div>
        </div>

        <Button size="lg" onClick={onStart} className="w-full sm:w-auto shadow-xl shadow-accent/20">
          Start Assessment
        </Button>
      </motion.div>
    </div>
  );
};

export default IntroScreen;
