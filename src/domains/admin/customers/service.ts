import 'server-only';
import { voxaGet, voxaPatch } from '@/lib/services';
import type {
  AdminCustomerDetail,
  AdminSubscription,
  CustomerListResponse,
  UpdateSubscriptionInput,
} from './schemas';
import {
  CustomerDetailResponseSchema,
  CustomerListResponseSchema,
  UpdateSubscriptionResponseSchema,
} from './schemas';

export async function listCustomers(
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<CustomerListResponse> {
  const { page = 1, limit = 20, search } = params;
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search?.trim()) query.set('search', search.trim());

  return voxaGet(`/api/v1/admin/users?${query.toString()}`, CustomerListResponseSchema);
}

export async function getCustomer(id: string): Promise<AdminCustomerDetail> {
  const result = await voxaGet(`/api/v1/admin/users/${id}`, CustomerDetailResponseSchema);
  return result.data;
}

export async function updateCustomerSubscription(
  customerId: string,
  data: UpdateSubscriptionInput,
): Promise<AdminSubscription> {
  const result = await voxaPatch(
    `/api/v1/admin/users/${customerId}/subscription`,
    data,
    UpdateSubscriptionResponseSchema,
  );
  return result.data;
}
