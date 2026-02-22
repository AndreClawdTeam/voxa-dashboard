import { AuditLogFilters } from '@/domains/admin/audit-logs/components/AuditLogFilters';
import { AuditLogTable } from '@/domains/admin/audit-logs/components/AuditLogTable';
import { AuditLogFiltersSchema } from '@/domains/admin/audit-logs/schemas';
import { listAuditLogs } from '@/domains/admin/audit-logs/service';
import { AdminPagination } from '@/domains/admin/customers/components/AdminPagination';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit Logs — Admin Voxa' };

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const params = await searchParams;
  const parsed = AuditLogFiltersSchema.safeParse(params);
  const filters = parsed.success
    ? parsed.data
    : {
        page: 1,
        limit: 20,
        action: undefined,
        resourceType: undefined,
        startDate: undefined,
        endDate: undefined,
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

      <AdminPagination pagination={pagination} currentPage={filters.page} />
    </div>
  );
}
