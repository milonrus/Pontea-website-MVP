import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import Button from '@/components/shared/Button';
import PaymentModal from '@/components/shared/PaymentModal';
import { PlanTier } from '@/types';

const TIERS: PlanTier[] = [
  {
    name: 'Study Guide',
    price: 690,
    features: ['Theory summaries (250+ pages)', '1000+ practice questions', 'Practice exams'],
    missingFeatures: ['Video lectures', 'Live seminars', 'Progress tracking', 'Support chat', '1-on-1 Lessons'],
  },
  {
    name: 'Full Course',
    price: 1190,
    recommended: true,
    features: ['Theory summaries (250+ pages)', '1000+ practice questions', 'Practice exams', '40+ hours video lectures', 'Weekly live seminars', 'Progress monitoring', 'Group support chat'],
    missingFeatures: ['Personalized study program', '1-on-1 Lessons'],
  },
  {
    name: 'VIP',
    price: 2750,
    features: ['Everything in Full Course', 'Personalized study program', '1-on-1 lessons with teachers', '3 consultations with founders', 'Priority Support'],
    missingFeatures: [],
  }
];

const Pricing: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">Choose Your Path to Italy</h2>
          <p className="text-lg text-gray-600">Invest in your future with a plan that suits your learning style. Installment plans available for all tiers.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {TIERS.map((tier) => (
            <div 
              key={tier.name}
              className={`
                relative bg-white rounded-2xl p-8 transition-all duration-300
                ${tier.recommended ? 'border-2 border-accent shadow-xl scale-105 z-10' : 'border border-gray-200 shadow-sm hover:shadow-lg'}
              `}
            >
              {tier.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-primary font-bold px-4 py-1 rounded-full text-sm">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-2xl font-display font-bold text-primary mb-2">{tier.name}</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-primary">€{tier.price}</span>
                <span className="text-gray-500 ml-2">/ total</span>
              </div>
              
              <p className="text-sm text-gray-500 mb-6 italic">approx. €{(tier.price / 4).toFixed(0)}/month for 4 months</p>

              <Button 
                variant={tier.recommended ? 'primary' : 'outline'} 
                fullWidth 
                onClick={() => setSelectedTier(tier)}
                className="mb-8"
              >
                {tier.name === 'VIP' ? 'Apply for VIP' : 'Get Started'}
              </Button>

              <div className="space-y-4">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
                {tier.missingFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 opacity-50">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                      <X className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-gray-500 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTier && (
        <PaymentModal 
          isOpen={!!selectedTier} 
          onClose={() => setSelectedTier(null)} 
          tierName={selectedTier.name} 
          price={selectedTier.price}
        />
      )}
    </section>
  );
};

export default Pricing;
