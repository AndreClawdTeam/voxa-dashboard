// Subscription tier — fonte única da verdade
export const SUBSCRIPTION_TIER = {
  trial: 'trial',
  basic: 'basic',
  pro: 'pro',
} as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIER)[keyof typeof SUBSCRIPTION_TIER];

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  trial: 'Trial',
  basic: 'Basic',
  pro: 'Pro',
};

// Subscription status — fonte única da verdade
export const SUBSCRIPTION_STATUS = {
  trial: 'trial',
  active: 'active',
  suspended: 'suspended',
  cancelled: 'cancelled',
} as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
};
