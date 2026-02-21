import 'server-only';
import { voxaGet } from '@/lib/services';
import type { CustomerListResponse } from './schemas';
import { CustomerListResponseSchema } from './schemas';

export async function listCustomers(
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<CustomerListResponse> {
  const { page = 1, limit = 20, search } = params;
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search?.trim()) query.set('search', search.trim());

  return voxaGet(`/api/v1/admin/customers?${query.toString()}`, CustomerListResponseSchema);
}
