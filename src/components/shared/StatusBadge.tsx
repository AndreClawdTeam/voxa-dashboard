import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Status =
  | 'active'
  | 'trial'
  | 'suspended'
  | 'cancelled'
  | 'expired'
  | 'completed'
  | 'failed'
  | 'pending'
  | 'processing';

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  trial: { label: 'Trial', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  suspended: {
    label: 'Suspenso',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  cancelled: { label: 'Cancelado', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  expired: { label: 'Expirado', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  completed: {
    label: 'Concluído',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  failed: { label: 'Falhou', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  pending: { label: 'Pendente', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  processing: {
    label: 'Processando',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: '' };
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
