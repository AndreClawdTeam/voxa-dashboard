import { describe, expect, it } from 'vitest';
import { UsageSchema } from './schemas';

const validUsage = {
  data: {
    transcriptionsCount: 42,
    totalAudioDurationSeconds: 3600,
    totalProcessingTimeMs: 120000,
    period: {
      start: '2026-02-01T00:00:00Z',
      end: '2026-02-28T23:59:59Z',
    },
  },
};

describe('UsageSchema', () => {
  it('deve validar dados válidos', () => {
    const result = UsageSchema.safeParse(validUsage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.transcriptionsCount).toBe(42);
      expect(result.data.data.totalAudioDurationSeconds).toBe(3600);
    }
  });

  it('deve validar com transcriptionsCount = 0', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, transcriptionsCount: 0 },
    });
    expect(result.success).toBe(true);
  });

  it('deve falhar quando transcriptionsCount é negativo', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, transcriptionsCount: -1 },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando transcriptionsCount não é inteiro', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, transcriptionsCount: 1.5 },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando totalAudioDurationSeconds é negativo', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, totalAudioDurationSeconds: -10 },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando period.start está ausente', () => {
    const result = UsageSchema.safeParse({
      data: {
        ...validUsage.data,
        period: { end: validUsage.data.period.end },
      },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando data está ausente', () => {
    const result = UsageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('deve falhar quando transcriptionsCount é string', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, transcriptionsCount: '42' },
    });
    expect(result.success).toBe(false);
  });
});
