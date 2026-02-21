'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  metadata: Record<string, unknown> | null;
}

export function AuditMetadataModal({ metadata }: Props) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-xs">
          Ver detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Metadata do Log</DialogTitle>
        </DialogHeader>
        <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-80 font-mono">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
