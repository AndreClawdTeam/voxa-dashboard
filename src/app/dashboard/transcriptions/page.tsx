import type { SearchParams } from 'next/dist/server/request/search-params';
import { TranscriptionPagination } from '@/domains/transcriptions/components/TranscriptionPagination';
import { TranscriptionTable } from '@/domains/transcriptions/components/TranscriptionTable';
import { listTranscriptions } from '@/domains/transcriptions/service';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Transcrições — Voxa Dashboard' };

export default async function TranscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const { data: transcriptions, pagination } = await listTranscriptions({ page });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transcrições</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Histórico de todas as suas transcrições.
          </p>
        </div>
      </div>
      <TranscriptionTable transcriptions={transcriptions} />
      <TranscriptionPagination pagination={pagination} currentPage={page} />
    </div>
  );
}
