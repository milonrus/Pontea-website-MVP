import React from 'react';
import PricingRu from '@/components/landing/pricing-ru/PricingRu';

interface PricingProps {
  locale?: 'en' | 'ru';
}

const Pricing: React.FC<PricingProps> = ({ locale = 'ru' }) => {
  return <PricingRu locale={locale} />;
};

export default Pricing;
