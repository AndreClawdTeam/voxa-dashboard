import { Skeleton } from '@/components/ui/skeleton';

export default function TranscriptionsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={i} className="h-10 rounded" />
        ))}
      </div>
    </div>
  );
}
