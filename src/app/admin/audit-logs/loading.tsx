import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLogsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-3">
        {['filter-1', 'filter-2', 'filter-3', 'filter-4'].map((key) => (
          <Skeleton key={key} className="h-8 w-36" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }, (_, i) => `row-${i}`).map((key) => (
          <Skeleton key={key} className="h-10 rounded" />
        ))}
      </div>
    </div>
  );
}
