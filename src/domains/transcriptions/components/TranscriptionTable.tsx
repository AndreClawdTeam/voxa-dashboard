import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/format-date';
import { formatDuration } from '../helpers';
import type { TranscriptionListItem } from '../schemas';
import { TranscriptionStatusBadge } from './TranscriptionStatusBadge';

interface TranscriptionTableProps {
  transcriptions: TranscriptionListItem[];
}

export function TranscriptionTable({ transcriptions }: TranscriptionTableProps) {
  if (transcriptions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Nenhuma transcrição encontrada.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arquivo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Idioma</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Criada em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transcriptions.map((t) => (
            <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Link
                  href={`/dashboard/transcriptions/${t.id}`}
                  className="font-medium hover:underline"
                >
                  {t.audioFilename}
                </Link>
              </TableCell>
              <TableCell>
                <TranscriptionStatusBadge status={t.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t.detectedLanguage ?? 'Detectando...'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t.audioDurationSeconds != null ? formatDuration(t.audioDurationSeconds) : '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(t.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
