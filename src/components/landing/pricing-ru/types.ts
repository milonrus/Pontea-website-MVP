export type RuPricingPlanId = 'foundation' | 'advanced' | 'mentorship';
export type RuPricingCurrency = 'RUB' | 'EUR';
export type PricingLeadType = 'eur_application' | 'mentorship_application';
export type PayerType = 'individual' | 'legal_entity';
export type MessengerType = 'telegram' | 'whatsapp';
export type PricingLocale = 'en' | 'ru';

export interface RuPricingGroup {
  title: string;
  icon: string;
  items: string[];
}

export interface RuPricingPlan {
  id: RuPricingPlanId;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  priceRub: number;
  badge?: string;
  installmentAvailable: boolean;
  includesFrom?: string;
  groups: RuPricingGroup[];
  summary: string[];
  bonus?: string;
}

export interface RuPricingVariantProps {
  plans: RuPricingPlan[];
  onBuy: (plan: RuPricingPlan) => void;
  locale: PricingLocale;
}
