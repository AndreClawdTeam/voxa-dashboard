import { z } from 'zod';
import { PaginationSchema } from '@/lib/zod';

// ─── Status ───────────────────────────────────────────────────────────────────

export const TranscriptionStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export type TranscriptionStatus = z.infer<typeof TranscriptionStatusSchema>;

// ─── Entidade completa (endpoint de detalhe) ──────────────────────────────────

export const TranscriptionSchema = z.object({
  id: z.string(),
  status: TranscriptionStatusSchema,
  audioFilename: z.string(),
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

// ─── Item de lista (endpoint paginado) ───────────────────────────────────────

export const TranscriptionListItemSchema = z.object({
  id: z.string(),
  status: TranscriptionStatusSchema,
  audioFilename: z.string(),
  audioDurationSeconds: z.number().nonnegative().nullable(),
  detectedLanguage: z.string().nullable(),
  createdAt: z.string(),
});

export type TranscriptionListItem = z.infer<typeof TranscriptionListItemSchema>;

// ─── Schemas de resposta da API ───────────────────────────────────────────────

export const TranscriptionDetailResponseSchema = z.object({
  data: TranscriptionSchema,
});

export const TranscriptionListResponseSchema = z.object({
  data: z.array(TranscriptionListItemSchema),
  pagination: PaginationSchema,
});

export type TranscriptionListResponse = z.infer<typeof TranscriptionListResponseSchema>;
