import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AuditLog } from '../schemas';
import { ActionBadge } from './ActionBadge';
import { AuditMetadataModal } from './AuditMetadataModal';

interface Props {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: Props) {
  if (logs.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Nenhum log encontrado.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>Ator</TableHead>
          <TableHead>Ação</TableHead>
          <TableHead>Recurso</TableHead>
          <TableHead>Target User</TableHead>
          <TableHead>Metadata</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log, i) => (
          <TableRow key={log.id ?? `${log.actorId}-${log.createdAt}-${i}`}>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(log.createdAt).toLocaleString('pt-BR')}
            </TableCell>
            <TableCell>
              <div className="text-xs">
                <p className="font-mono truncate max-w-[100px]" title={log.actorId}>
                  {log.actorId.slice(0, 8)}…
                </p>
                <p className="text-muted-foreground">{log.actorRole}</p>
              </div>
            </TableCell>
            <TableCell>
              <ActionBadge action={log.action} />
            </TableCell>
            <TableCell className="text-xs">
              <p>{log.resourceType}</p>
              {log.resourceId && (
                <p
                  className="text-muted-foreground font-mono truncate max-w-[80px]"
                  title={log.resourceId}
                >
                  {log.resourceId.slice(0, 8)}…
                </p>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {log.targetUserId ? (
                <span className="font-mono">{log.targetUserId.slice(0, 8)}…</span>
              ) : (
                '—'
              )}
            </TableCell>
            <TableCell>
              <AuditMetadataModal metadata={log.metadata} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
