import 'server-only';
import { voxaGet, voxaPost } from '@/lib/services';
import { isVoxaApiError } from '@/lib/services/errors';
import type { Subscription } from './schemas';
import { SubscriptionSchema, UpgradeResponseSchema } from './schemas';

export async function getCurrentSubscription(): Promise<Subscription> {
  const result = await voxaGet('/api/v1/subscriptions/me', SubscriptionSchema);
  return result.data;
}

/**
 * Like getCurrentSubscription(), but returns null instead of throwing when the
 * user has no subscription (404 NOT_FOUND). Useful for admin users or any case
 * where the absence of a subscription is a valid state.
 */
export async function getCurrentSubscriptionSafe(): Promise<Subscription | null> {
  try {
    return await getCurrentSubscription();
  } catch (error) {
    if (isVoxaApiError(error) && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function upgradeSubscription(tier: 'basic' | 'pro'): Promise<Subscription> {
  const result = await voxaPost('/api/v1/subscriptions/upgrade', { tier }, UpgradeResponseSchema);
  return result.data;
}
