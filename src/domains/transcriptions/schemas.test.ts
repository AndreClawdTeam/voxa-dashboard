import { describe, expect, it } from 'vitest';
import {
  TranscriptionListResponseSchema,
  TranscriptionSchema,
  TranscriptionStatusSchema,
} from './schemas';

const validTranscription = {
  id: 'abc-123',
  status: 'completed',
  audioFilename: 'audio.mp3',
  audioSizeBytes: 1048576,
  audioDurationSeconds: 90,
  audioFormat: 'mp3',
  transcribedText: 'Hello world',
  detectedLanguage: 'pt-BR',
  languageConfidence: 0.98,
  processingTimeMs: 1500,
  errorMessage: null,
  createdAt: '2026-02-21T10:00:00.000Z',
  completedAt: '2026-02-21T10:00:01.500Z',
};

describe('TranscriptionStatusSchema', () => {
  it('deve aceitar status válidos', () => {
    for (const s of ['pending', 'processing', 'completed', 'failed'] as const) {
      expect(TranscriptionStatusSchema.safeParse(s).success).toBe(true);
    }
  });

  it('deve rejeitar status inválido', () => {
    expect(TranscriptionStatusSchema.safeParse('unknown').success).toBe(false);
    expect(TranscriptionStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('TranscriptionSchema', () => {
  it('deve validar transcrição completa', () => {
    const result = TranscriptionSchema.safeParse(validTranscription);
    expect(result.success).toBe(true);
  });

  it('deve aceitar campos nullable como null', () => {
    const withNulls = {
      ...validTranscription,
      audioSizeBytes: null,
      audioDurationSeconds: null,
      audioFormat: null,
      transcribedText: null,
      detectedLanguage: null,
      languageConfidence: null,
      processingTimeMs: null,
      completedAt: null,
    };
    const result = TranscriptionSchema.safeParse(withNulls);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar status inválido', () => {
    const result = TranscriptionSchema.safeParse({ ...validTranscription, status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar languageConfidence fora do intervalo 0-1', () => {
    expect(
      TranscriptionSchema.safeParse({ ...validTranscription, languageConfidence: 1.5 }).success,
    ).toBe(false);
    expect(
      TranscriptionSchema.safeParse({ ...validTranscription, languageConfidence: -0.1 }).success,
    ).toBe(false);
  });
});

describe('TranscriptionListResponseSchema', () => {
  it('deve validar resposta de lista paginada', () => {
    // The list endpoint returns full transcription objects (all fields from the DB),
    // not just a subset. All nullable fields must be present (as null if not set).
    const response = {
      data: [
        {
          id: 'abc-123',
          status: 'completed',
          audioFilename: 'audio.mp3',
          audioSizeBytes: 1048576,
          audioDurationSeconds: 90,
          audioFormat: 'mp3',
          transcribedText: 'Hello world',
          detectedLanguage: 'pt-BR',
          languageConfidence: 0.98,
          processingTimeMs: 1500,
          errorMessage: null,
          createdAt: '2026-02-21T10:00:00.000Z',
          completedAt: '2026-02-21T10:00:01.500Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };
    const result = TranscriptionListResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});
