import { z } from 'zod';

export const TierSchema = z.enum(['trial', 'basic', 'pro']);
export const SubscriptionStatusSchema = z.enum(['active', 'trial', 'suspended', 'cancelled']);

export const SubscriptionSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    tier: TierSchema,
    status: SubscriptionStatusSchema,
    trialEndsAt: z.string().nullable(),
    currentPeriodStart: z.string(),
    currentPeriodEnd: z.string(),
  }),
});

export type Subscription = z.infer<typeof SubscriptionSchema>['data'];
export type Tier = z.infer<typeof TierSchema>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
