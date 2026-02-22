'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { Pagination } from '@/lib/zod';

interface TranscriptionPaginationProps {
  pagination: Pagination;
  currentPage: number;
}

export function TranscriptionPagination({ pagination, currentPage }: TranscriptionPaginationProps) {
  const router = useRouter();

  const handlePrev = () => {
    if (currentPage > 1) {
      router.push(`/dashboard/transcriptions?page=${currentPage - 1}`);
    }
  };

  const handleNext = () => {
    if (currentPage < pagination.totalPages) {
      router.push(`/dashboard/transcriptions?page=${currentPage + 1}`);
    }
  };

  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Página {currentPage} de {pagination.totalPages} ({pagination.total} transcrições)
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentPage === 1}>
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage >= pagination.totalPages}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
