import { describe, expect, it } from 'vitest';
import { SubscriptionSchema } from './schemas';

const validSubscription = {
  data: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '223e4567-e89b-12d3-a456-426614174001',
    tier: 'trial',
    status: 'trial',
    trialEndsAt: '2026-02-28T00:00:00Z',
    currentPeriodStart: '2026-02-01T00:00:00Z',
    currentPeriodEnd: '2026-02-28T00:00:00Z',
  },
};

describe('SubscriptionSchema', () => {
  it('deve validar dados válidos com tier trial', () => {
    const result = SubscriptionSchema.safeParse(validSubscription);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.tier).toBe('trial');
      expect(result.data.data.status).toBe('trial');
    }
  });

  it('deve validar com tier basic e status active', () => {
    const result = SubscriptionSchema.safeParse({
      data: {
        ...validSubscription.data,
        tier: 'basic',
        status: 'active',
        trialEndsAt: null,
      },
    });
    expect(result.success).toBe(true);
  });

  it('deve validar com tier pro e status active', () => {
    const result = SubscriptionSchema.safeParse({
      data: {
        ...validSubscription.data,
        tier: 'pro',
        status: 'active',
        trialEndsAt: null,
      },
    });
    expect(result.success).toBe(true);
  });

  it('deve validar trialEndsAt como null', () => {
    const result = SubscriptionSchema.safeParse({
      data: { ...validSubscription.data, trialEndsAt: null },
    });
    expect(result.success).toBe(true);
  });

  it('deve falhar com tier inválido', () => {
    const result = SubscriptionSchema.safeParse({
      data: { ...validSubscription.data, tier: 'enterprise' },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar com status inválido', () => {
    const result = SubscriptionSchema.safeParse({
      data: { ...validSubscription.data, status: 'expired' },
    });
    expect(result.success).toBe(false);
  });

  it('deve falhar quando id não é UUID válido', () => {
    const result = SubscriptionSchema.safeParse({
      data: { ...validSubscription.data, id: 'not-a-uuid' },
    });
    expect(result.success).toBe(false);
  });

  it('deve aceitar status suspended e cancelled', () => {
    expect(
      SubscriptionSchema.safeParse({
        data: { ...validSubscription.data, status: 'suspended' },
      }).success,
    ).toBe(true);

    expect(
      SubscriptionSchema.safeParse({
        data: { ...validSubscription.data, status: 'cancelled' },
      }).success,
    ).toBe(true);
  });
});
