import { describe, expect, it } from 'vitest';
import { UpdateProfileSchema, UserProfileSchema } from './schemas';

const validProfile = {
  id: 'abc123',
  email: 'user@example.com',
  name: 'André Treib',
  role: 'customer' as const,
  isActive: true,
  createdAt: '2025-01-15T00:00:00.000Z',
};

describe('UpdateProfileSchema', () => {
  it('valida dados corretos', () => {
    const result = UpdateProfileSchema.safeParse({
      name: 'André Treib',
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita email inválido', () => {
    const result = UpdateProfileSchema.safeParse({ name: 'André Treib', email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it('rejeita nome com menos de 2 caracteres', () => {
    const result = UpdateProfileSchema.safeParse({ name: 'A', email: 'user@example.com' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toContain('2 caracteres');
    }
  });

  it('rejeita nome com mais de 100 caracteres', () => {
    const result = UpdateProfileSchema.safeParse({
      name: 'A'.repeat(101),
      email: 'user@example.com',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toContain('longo');
    }
  });
});

describe('UserProfileSchema', () => {
  it('valida objeto completo válido', () => {
    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('valida role admin', () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('falha se role for inválida', () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, role: 'superuser' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.role).toBeDefined();
    }
  });

  it('falha se email for inválido', () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, email: 'invalid' });
    expect(result.success).toBe(false);
  });
});
