import 'server-only';
import { voxaGet } from '@/lib/services';
import type { Pagination } from '@/lib/zod';
import type { Transcription } from './schemas';
import { TranscriptionListResponseSchema } from './schemas';

export async function listTranscriptions({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{ data: Transcription[]; pagination: Pagination }> {
  const result = await voxaGet(
    `/api/v1/dashboard/transcriptions?page=${page}&limit=${limit}`,
    TranscriptionListResponseSchema,
  );
  return result;
}

// NOTE: There is no per-transcription detail endpoint in the API
// (GET /dashboard/transcriptions/:id does not exist).
// The list endpoint returns full transcription data for all items.
