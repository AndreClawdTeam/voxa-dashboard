import { z } from 'zod';
import { PaginationSchema } from '@/lib/zod';

export const AdminCustomerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['customer', 'admin']),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const CustomerListResponseSchema = z.object({
  data: z.array(AdminCustomerSchema),
  pagination: PaginationSchema,
});

export const CustomerListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type AdminCustomer = z.infer<typeof AdminCustomerSchema>;
export type CustomerListParams = z.infer<typeof CustomerListParamsSchema>;
export type CustomerListResponse = z.infer<typeof CustomerListResponseSchema>;
