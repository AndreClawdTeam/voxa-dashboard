// Subscription tier values — single source of truth
export const SUBSCRIPTION_TIERS = ['trial', 'basic', 'pro'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

// Subscription status values — single source of truth
export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'suspended', 'cancelled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// Human-readable labels
export const TIER_LABELS: Record<SubscriptionTier, string> = {
  trial: 'Trial',
  basic: 'Basic',
  pro: 'Pro',
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
};
