import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: "Is this course for the Italian or English exam?",
    answer: "Both! We provide specific study tracks for the Italian exam (Test di Architettura) and the English exam (Architecture Design). You can switch between languages in your dashboard at any time."
  },
  {
    question: "How does the 'Knowledge Matrix' work?",
    answer: "Unlike traditional courses that just give you a score, we track your proficiency across 5 domains. We identify exactly which 'Knowledge Blocks' (e.g., Art History Renaissance, Logical Implications) you are missing so you can fix them efficiently."
  },
  {
    question: "Can I pay in installments?",
    answer: "Yes. For the Full Course and VIP tiers, we offer a 3-month or 4-month installment plan via Klarna or PayPal Pay Later, with no extra interest."
  },
  {
    question: "What if I don't pass the exam?",
    answer: "If you complete 90% of the course material and don't pass, we offer a 'Second Chance' guarantee. You'll get free access to the platform for the next academic year's preparation cycle."
  },
  {
    question: "Do I need to buy textbooks?",
    answer: "No. Our platform includes comprehensive digital notes, summaries, and formula sheets (250+ pages) that cover the entire syllabus defined by the Ministry (MUR)."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <HelpCircle className="w-3 h-3" />
            Support
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
            Common Questions
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className={`font-bold text-lg ${openIndex === idx ? 'text-primary' : 'text-gray-700'}`}>
                  {faq.question}
                </span>
                <span className={`
                  flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${openIndex === idx ? 'bg-primary text-white rotate-180' : 'bg-gray-100 text-gray-500'}
                `}>
                  {openIndex === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
              
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;