import 'server-only';
import { voxaGet, voxaPost } from '@/lib/services';
import type { Subscription } from './schemas';
import { SubscriptionSchema, UpgradeResponseSchema } from './schemas';

export async function getCurrentSubscription(): Promise<Subscription> {
  const result = await voxaGet('/api/v1/subscriptions/me', SubscriptionSchema);
  return result.data;
}

export async function upgradeSubscription(tier: 'basic' | 'pro'): Promise<Subscription> {
  const result = await voxaPost('/api/v1/subscriptions/upgrade', { tier }, UpgradeResponseSchema);
  return result.data;
}
