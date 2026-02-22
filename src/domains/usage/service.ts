import 'server-only';
import { voxaGet } from '@/lib/services';
import type { Usage } from './schemas';
import { UsageSchema } from './schemas';

export async function getMonthlyUsage(): Promise<Usage> {
  const result = await voxaGet('/api/v1/dashboard/usage', UsageSchema);
  return result.data;
}
