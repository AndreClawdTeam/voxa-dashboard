import { formatAuditAction, getActionColor } from '../helpers';

interface Props {
  action: string;
}

export function ActionBadge({ action }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(action)}`}
    >
      {formatAuditAction(action)}
    </span>
  );
}
