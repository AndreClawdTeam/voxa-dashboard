import 'server-only';
import { env } from '@/lib/env';
import { VoxaApiError, VoxaNetworkError, voxaGet } from '@/lib/services';
import type { Pagination } from '@/lib/zod';
import type { Transcription, TranscriptionData } from './schemas';
import { TranscribeResponseSchema, TranscriptionListResponseSchema } from './schemas';

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

export async function transcribeAudio(audioFile: File, apiKey: string): Promise<TranscriptionData> {
  const formData = new FormData();
  formData.append('audio', audioFile);

  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_VOXA_API_URL}/api/v1/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[transcribeAudio] Network error', { message: msg });
    throw new VoxaNetworkError('Erro de rede. Verifique sua conexão e tente novamente.');
  }

  if (!response.ok) {
    let errorBody: { error?: string; code?: string } = {};
    try {
      errorBody = await response.json();
    } catch {
      /* ignore */
    }
    throw new VoxaApiError(
      errorBody.error ?? `Erro na API (${response.status})`,
      errorBody.code ?? 'API_ERROR',
      undefined,
      response.status,
    );
  }

  const json: unknown = await response.json();
  const parsed = TranscribeResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error('[transcribeAudio] Invalid response schema', parsed.error);
    throw new VoxaApiError('Resposta inesperada da API.', 'INVALID_RESPONSE');
  }
  return parsed.data.data;
}
