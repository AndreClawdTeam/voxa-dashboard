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
import type { TranscriptionListItem } from '../schemas';
import { CopyButton } from './CopyButton';
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
            <TableHead>Transcrição</TableHead>
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
              <TableCell>
                <div className="flex items-center gap-2 max-w-sm">
                  {t.errorMessage ? (
                    <span className="text-destructive text-xs">{t.errorMessage}</span>
                  ) : t.transcribedText ? (
                    <>
                      <span className="truncate text-sm">{t.transcribedText}</span>
                      <CopyButton text={t.transcribedText} />
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
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
