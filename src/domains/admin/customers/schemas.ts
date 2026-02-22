import { z } from 'zod';
import { TranscriptionSchema } from '@/domains/transcriptions/schemas';
import { PaginationSchema } from '@/lib/zod';
import {
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TIER,
  type SubscriptionStatus,
  type SubscriptionTier,
} from './constants';

const tierValues = Object.values(SUBSCRIPTION_TIER) as [SubscriptionTier, ...SubscriptionTier[]];
const statusValues = Object.values(SUBSCRIPTION_STATUS) as [
  SubscriptionStatus,
  ...SubscriptionStatus[],
];

// ─── Subscription schemas ─────────────────────────────────────────────────────

// Brief subscription — as returned inside list items (only summary fields)
const AdminSubscriptionBriefSchema = z.object({
  id: z.string(),
  tier: z.enum(tierValues),
  status: z.enum(statusValues),
  trialEndsAt: z.string().nullable(),
});

// Full subscription — as returned in detail and update endpoints (all DB fields)
export const AdminSubscriptionSchema = z.object({
  id: z.string(),
  tier: z.enum(tierValues),
  status: z.enum(statusValues),
  trialEndsAt: z.string().nullable(),
  // Present in detail/update responses, absent from list subscription summaries
  userId: z.string().optional(),
  currentPeriodStart: z.string().nullable().optional(),
  currentPeriodEnd: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ─── User schemas ─────────────────────────────────────────────────────────────

// Base customer schema — matches fields returned by GET /admin/users (list)
export const AdminCustomerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['customer', 'admin']),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  // The list endpoint includes a brief subscription summary per user
  subscription: AdminSubscriptionBriefSchema.nullable().optional(),
});

// ─── List ─────────────────────────────────────────────────────────────────────

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

// ─── Customer Detail ──────────────────────────────────────────────────────────

// Detail schema extends the base and overrides subscription with the full version.
// Also includes recentTranscriptions — only present in the detail endpoint.
export const AdminCustomerDetailSchema = AdminCustomerSchema.extend({
  subscription: AdminSubscriptionSchema.nullable().optional(),
  recentTranscriptions: z.array(TranscriptionSchema).optional(),
});

// Response schemas — defined at module level to avoid recreation on every call
export const CustomerDetailResponseSchema = z.object({ data: AdminCustomerDetailSchema });

export const UpdateSubscriptionResponseSchema = z.object({ data: AdminSubscriptionSchema });

export const UpdateSubscriptionSchema = z
  .object({
    tier: z.enum(tierValues).optional(),
    status: z.enum(statusValues).optional(),
  })
  .refine((data) => data.tier !== undefined || data.status !== undefined, {
    message: 'Ao menos um campo (tier ou status) deve ser fornecido',
  });

export type AdminCustomerDetail = z.infer<typeof AdminCustomerDetailSchema>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
export type AdminSubscription = z.infer<typeof AdminSubscriptionSchema>;
