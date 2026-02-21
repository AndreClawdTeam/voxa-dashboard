import { z } from 'zod';
import { PaginationSchema } from '@/lib/zod';

export const AuditLogSchema = z.object({
  id: z.string().optional(),
  actorId: z.string(),
  actorRole: z.enum(['customer', 'admin']),
  targetUserId: z.string().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
});

export const AuditLogListResponseSchema = z.object({
  data: z.array(AuditLogSchema),
  pagination: PaginationSchema,
});

export const AuditLogFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  actorId: z.string().optional(),
  targetUserId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditLogFilters = z.infer<typeof AuditLogFiltersSchema>;
export type AuditLogListResponse = z.infer<typeof AuditLogListResponseSchema>;
