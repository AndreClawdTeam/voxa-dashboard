import { describe, expect, it } from 'vitest';
import { UsageSchema } from './schemas';

const validUsage = {
  data: {
    totalTranscriptions: 100,
    totalMinutes: 50,
    monthTranscriptions: 42,
    monthMinutes: 20,
    tier: 'basic',
    status: 'active',
  },
};

describe('UsageSchema', () => {
  it('deve validar dados válidos', () => {
    const result = UsageSchema.safeParse(validUsage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.monthTranscriptions).toBe(42);
      expect(result.data.data.totalTranscriptions).toBe(100);
      expect(result.data.data.monthMinutes).toBe(20);
      expect(result.data.data.totalMinutes).toBe(50);
    }
  });

  it('deve validar com tier e status nulos', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, tier: null, status: null },
    });
    expect(result.success).toBe(true);
  });

  it('deve validar com monthTranscriptions = 0', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, monthTranscriptions: 0 },
    });
    expect(result.success).toBe(true);
  });

  it('deve falhar quando monthTranscriptions é negativo', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, monthTranscriptions: -1 },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando monthTranscriptions não é inteiro', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, monthTranscriptions: 1.5 },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando totalMinutes é negativo', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, totalMinutes: -10 },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando data está ausente', () => {
    const result = UsageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('deve falhar quando monthTranscriptions é string', () => {
    const result = UsageSchema.safeParse({
      data: { ...validUsage.data, monthTranscriptions: '42' },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando totalTranscriptions está ausente', () => {
    const { totalTranscriptions: _, ...rest } = validUsage.data;
    const result = UsageSchema.safeParse({ data: rest });
    expect(result.success).toBe(false);
  });
});
