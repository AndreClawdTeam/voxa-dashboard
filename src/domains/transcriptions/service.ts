import 'server-only';
import { voxaGet } from '@/lib/services';
import type { Pagination } from '@/lib/zod';
import type { Transcription, TranscriptionListItem } from './schemas';
import { TranscriptionDetailResponseSchema, TranscriptionListResponseSchema } from './schemas';

export async function listTranscriptions({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{ data: TranscriptionListItem[]; pagination: Pagination }> {
  const result = await voxaGet(
    `/api/v1/dashboard/transcriptions?page=${page}&limit=${limit}`,
    TranscriptionListResponseSchema,
  );
  return result;
}

export async function getTranscription(id: string): Promise<Transcription> {
  const result = await voxaGet(
    `/api/v1/dashboard/transcriptions/${id}`,
    TranscriptionDetailResponseSchema,
  );
  return result.data;
}
