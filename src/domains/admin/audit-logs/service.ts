import 'server-only';
import { voxaGet } from '@/lib/services';
import type { AuditLogFilters, AuditLogListResponse } from './schemas';
import { AuditLogListResponseSchema } from './schemas';

export async function listAuditLogs(
  filters: Partial<AuditLogFilters> = {},
): Promise<AuditLogListResponse> {
  const {
    page = 1,
    limit = 20,
    actorId,
    targetUserId,
    action,
    resourceType,
    startDate,
    endDate,
  } = filters;

  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (actorId) query.set('actorId', actorId);
  if (targetUserId) query.set('targetUserId', targetUserId);
  if (action) query.set('action', action);
  if (resourceType) query.set('resourceType', resourceType);
  if (startDate) query.set('startDate', startDate);
  if (endDate) query.set('endDate', endDate);

  return voxaGet(`/api/v1/admin/audit-log?${query.toString()}`, AuditLogListResponseSchema);
}
