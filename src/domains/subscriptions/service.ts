import 'server-only';
import { voxaGet } from '@/lib/services';
import type { Subscription } from './schemas';
import { SubscriptionSchema } from './schemas';

export async function getCurrentSubscription(): Promise<Subscription> {
  const result = await voxaGet('/api/v1/subscriptions/current', SubscriptionSchema);
  return result.data;
}
