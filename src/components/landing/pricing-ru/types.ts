export type RuPricingPlanId = 'foundation' | 'advanced' | 'mentorship';

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
  priceRub: number;
  badge?: string;
  installmentAvailable: boolean;
  includesFrom?: string;
  groups: RuPricingGroup[];
  summary: string[];
  bonus?: string;
}

export interface RuPricingFeatureRow {
  label: string;
  availability: Record<RuPricingPlanId, boolean>;
}

export interface RuPricingVariantProps {
  plans: RuPricingPlan[];
  onBuy: (plan: RuPricingPlan) => void;
}
