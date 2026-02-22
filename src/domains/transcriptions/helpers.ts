import type { TranscriptionStatus } from './schemas';

// ─── Formatação de duração ────────────────────────────────────────────────────

/**
 * Formata duração em segundos para string legível.
 * 0-59 → "Xs" | 60-3599 → "Xm Ys" | 3600+ → "Xh Ym"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ─── Formatação de tamanho de arquivo ────────────────────────────────────────

/**
 * Formata tamanho em bytes para string legível.
 * < 1024 → "X B" | < 1048576 → "X.X KB" | else → "X.X MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1048576) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<TranscriptionStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

/**
 * Retorna classes Tailwind de cor para um status de transcrição.
 */
export function getStatusColor(status: TranscriptionStatus): string {
  return STATUS_COLORS[status];
}

const STATUS_LABELS: Record<TranscriptionStatus, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluída',
  failed: 'Falhou',
};

/**
 * Retorna rótulo legível em PT-BR para um status de transcrição.
 */
export function getStatusLabel(status: TranscriptionStatus): string {
  return STATUS_LABELS[status];
}
