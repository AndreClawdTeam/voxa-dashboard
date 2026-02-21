import type { SearchParams } from 'next/dist/server/request/search-params';
import { AuditLogFilters } from '@/domains/admin/audit-logs/components/AuditLogFilters';
import { AuditLogTable } from '@/domains/admin/audit-logs/components/AuditLogTable';
import { listAuditLogs } from '@/domains/admin/audit-logs/service';
import { AdminPagination } from '@/domains/admin/customers/components/AdminPagination';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit Logs — Admin Voxa' };

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filters = {
    page,
    action: typeof params.action === 'string' ? params.action.slice(0, 100) : undefined,
    resourceType:
      typeof params.resourceType === 'string' ? params.resourceType.slice(0, 100) : undefined,
    startDate: typeof params.startDate === 'string' ? params.startDate.slice(0, 30) : undefined,
    endDate: typeof params.endDate === 'string' ? params.endDate.slice(0, 30) : undefined,
  };

  const { data: logs, pagination } = await listAuditLogs(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Registro de todas as ações administrativas do sistema
        </p>
      </div>

      <AuditLogFilters
        initialFilters={{
          action: filters.action,
          resourceType: filters.resourceType,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }}
      />

      <AuditLogTable logs={logs} />

      <AdminPagination pagination={pagination} currentPage={page} />
    </div>
  );
}
