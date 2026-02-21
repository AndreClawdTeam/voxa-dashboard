import { describe, expect, it } from 'vitest';
import { LoginSchema, RegisterSchema, UserSchema } from './schemas';

const validUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'João Silva',
  role: 'customer' as const,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('LoginSchema', () => {
  it('deve aceitar email e senha válidos', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar email inválido', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.email).toBeDefined();
    }
  });

  it('deve rejeitar senha vazia', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.password).toBeDefined();
    }
  });

  it('deve rejeitar campos ausentes', () => {
    const result = LoginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema', () => {
  it('deve aceitar dados válidos de registro', () => {
    const result = RegisterSchema.safeParse({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar nome com menos de 2 caracteres', () => {
    const result = RegisterSchema.safeParse({
      name: 'J',
      email: 'joao@example.com',
      password: 'senha123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name).toBeDefined();
    }
  });

  it('deve rejeitar email inválido', () => {
    const result = RegisterSchema.safeParse({
      name: 'João Silva',
      email: 'invalido',
      password: 'senha123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.email).toBeDefined();
    }
  });

  it('deve rejeitar senha com menos de 8 caracteres', () => {
    const result = RegisterSchema.safeParse({
      name: 'João Silva',
      email: 'joao@example.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.password).toBeDefined();
    }
  });

  it('deve aceitar senha com exatamente 8 caracteres', () => {
    const result = RegisterSchema.safeParse({
      name: 'João Silva',
      email: 'joao@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });
});

describe('UserSchema', () => {
  it('deve aceitar usuário customer válido', () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('customer');
    }
  });

  it('deve aceitar usuário admin válido', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'admin' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('admin');
    }
  });

  it('deve rejeitar UUID inválido', () => {
    const result = UserSchema.safeParse({ ...validUser, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar email inválido', () => {
    const result = UserSchema.safeParse({ ...validUser, email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar role inválida', () => {
    const result = UserSchema.safeParse({ ...validUser, role: 'superadmin' });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar isActive não booleano', () => {
    const result = UserSchema.safeParse({ ...validUser, isActive: 'true' });
    expect(result.success).toBe(false);
  });
});
