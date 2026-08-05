export type LandingTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export interface LandingFeature {
  icon: string;
  title: string;
  description: string;
  tone: LandingTone;
}

export interface LandingBenefit {
  icon: string;
  title: string;
  description: string;
}
