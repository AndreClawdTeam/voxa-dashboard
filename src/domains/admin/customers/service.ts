import 'server-only';
import { z } from 'zod';
import type { Subscription } from '@/domains/subscriptions/schemas';
import { SubscriptionSchema } from '@/domains/subscriptions/schemas';
import { voxaGet, voxaPatch } from '@/lib/services';
import type { AdminCustomerDetail, CustomerListResponse, UpdateSubscriptionInput } from './schemas';
import { AdminCustomerDetailSchema, CustomerListResponseSchema } from './schemas';

export async function listCustomers(
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<CustomerListResponse> {
  const { page = 1, limit = 20, search } = params;
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search?.trim()) query.set('search', search.trim());

  return voxaGet(`/api/v1/admin/customers?${query.toString()}`, CustomerListResponseSchema);
}

export async function getCustomer(id: string): Promise<AdminCustomerDetail> {
  const CustomerDetailResponseSchema = z.object({ data: AdminCustomerDetailSchema });
  const result = await voxaGet(`/api/v1/admin/customers/${id}`, CustomerDetailResponseSchema);
  return result.data;
}

export async function updateCustomerSubscription(
  customerId: string,
  data: UpdateSubscriptionInput,
): Promise<Subscription> {
  const result = await voxaPatch(
    `/api/v1/admin/customers/${customerId}/subscription`,
    data,
    SubscriptionSchema,
  );
  return result.data;
}
