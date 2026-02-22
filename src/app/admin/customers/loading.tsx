import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCustomersLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-72" />
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map((key) => (
          <Skeleton key={key} className="h-10 rounded" />
        ))}
      </div>
    </div>
  );
}
