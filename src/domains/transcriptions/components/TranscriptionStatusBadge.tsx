import { getStatusColor, getStatusLabel } from '../helpers';
import type { TranscriptionStatus } from '../schemas';

interface TranscriptionStatusBadgeProps {
  status: TranscriptionStatus;
}

export function TranscriptionStatusBadge({ status }: TranscriptionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
    >
      {status === 'processing' && (
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1" />
      )}
      {getStatusLabel(status)}
    </span>
  );
}
