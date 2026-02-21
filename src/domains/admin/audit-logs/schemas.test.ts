import { describe, expect, it } from 'vitest';
import { AuditLogFiltersSchema, AuditLogSchema } from './schemas';

describe('AuditLogSchema', () => {
  it('should validate a complete valid object', () => {
    const valid = {
      id: 'abc123',
      actorId: 'user-1',
      actorRole: 'admin',
      targetUserId: 'user-2',
      action: 'subscription.upgraded',
      resourceType: 'subscription',
      resourceId: 'sub-1',
      metadata: { plan: 'pro' },
      createdAt: '2026-02-21T12:00:00.000Z',
    };

    const result = AuditLogSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept metadata: null and targetUserId: null', () => {
    const valid = {
      actorId: 'user-1',
      actorRole: 'customer',
      targetUserId: null,
      action: 'api_key.created',
      resourceType: 'api_key',
      resourceId: null,
      metadata: null,
      createdAt: '2026-02-21T12:00:00.000Z',
    };

    const result = AuditLogSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toBeNull();
      expect(result.data.targetUserId).toBeNull();
    }
  });

  it('should reject invalid actorRole', () => {
    const invalid = {
      actorId: 'user-1',
      actorRole: 'superadmin',
      targetUserId: null,
      action: 'test',
      resourceType: 'test',
      resourceId: null,
      metadata: null,
      createdAt: '2026-02-21T12:00:00.000Z',
    };

    const result = AuditLogSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('AuditLogFiltersSchema', () => {
  it('should coerce string "2" to number 2 for page', () => {
    const result = AuditLogFiltersSchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('should use default page=1 when not provided', () => {
    const result = AuditLogFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should accept optional filters', () => {
    const result = AuditLogFiltersSchema.safeParse({
      action: 'subscription.upgraded',
      resourceType: 'subscription',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('subscription.upgraded');
      expect(result.data.resourceType).toBe('subscription');
    }
  });

  it('should reject limit > 100', () => {
    const result = AuditLogFiltersSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});
