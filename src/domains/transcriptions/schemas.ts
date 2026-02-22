import { z } from 'zod';
import { PaginationSchema } from '@/lib/zod';

// ─── Status ───────────────────────────────────────────────────────────────────

export const TranscriptionStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export type TranscriptionStatus = z.infer<typeof TranscriptionStatusSchema>;

// ─── Entidade completa ────────────────────────────────────────────────────────
// The list endpoint (GET /dashboard/transcriptions) returns full transcription
// entities from the database — all fields below are present in the list response.
// NOTE: There is no per-transcription detail endpoint in the API.

export const TranscriptionSchema = z.object({
  id: z.string(),
  status: TranscriptionStatusSchema,
  audioFilename: z.string().nullable(),
  audioSizeBytes: z.number().int().nonnegative().nullable(),
  audioDurationSeconds: z.number().nonnegative().nullable(),
  audioFormat: z.string().nullable(),
  transcribedText: z.string().nullable(),
  detectedLanguage: z.string().nullable(),
  languageConfidence: z.number().min(0).max(1).nullable(),
  processingTimeMs: z.number().int().nonnegative().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

export type Transcription = z.infer<typeof TranscriptionSchema>;

// ─── Alias para compatibilidade ───────────────────────────────────────────────
// TranscriptionListItem is the same as Transcription: the list endpoint returns
// all fields. Kept as a type alias to avoid breaking existing component imports.
export type TranscriptionListItem = Transcription;

// ─── Schemas de resposta da API ───────────────────────────────────────────────

export const TranscriptionListResponseSchema = z.object({
  data: z.array(TranscriptionSchema),
  pagination: PaginationSchema,
});

export type TranscriptionListResponse = z.infer<typeof TranscriptionListResponseSchema>;

// ─── Query params schema ──────────────────────────────────────────────────────

export const TranscriptionListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export type TranscriptionListParams = z.infer<typeof TranscriptionListParamsSchema>;
