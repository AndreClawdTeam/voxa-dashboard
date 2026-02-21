import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/format-date';
import type { ApiKey } from '../schemas';
import { RevokeApiKeyButton } from './RevokeApiKeyButton';

interface ApiKeyTableProps {
  keys: ApiKey[];
}

export function ApiKeyTable({ keys }: ApiKeyTableProps) {
  if (keys.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhuma API key encontrada. Crie uma nova key para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último uso</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id} className={key.isRevoked ? 'opacity-50' : undefined}>
              <TableCell className={key.isRevoked ? 'line-through' : undefined}>
                {key.label}
              </TableCell>
              <TableCell>
                {key.isRevoked ? (
                  <Badge variant="destructive">Revogada</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Ativa
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {key.lastUsedAt ? formatDateTime(key.lastUsedAt) : 'Nunca'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(key.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <RevokeApiKeyButton id={key.id} label={key.label} isRevoked={key.isRevoked} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
