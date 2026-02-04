// Minimal types for MVP landing page

export interface PlanTier {
  name: string;
  price: number;
  recommended?: boolean;
  features: string[];
  missingFeatures: string[];
}
