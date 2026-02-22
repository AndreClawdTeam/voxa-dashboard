import { describe, expect, it } from 'vitest';
import {
  ApiKeyListResponseSchema,
  ApiKeySchema,
  CreateApiKeyInputSchema,
  CreateApiKeyResponseSchema,
} from './schemas';

const validApiKey = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  label: 'Produção',
  isRevoked: false,
  lastUsedAt: '2026-02-20T10:00:00Z',
  createdAt: '2026-02-01T08:00:00Z',
};

describe('ApiKeySchema', () => {
  it('deve validar uma API key válida', () => {
    const result = ApiKeySchema.safeParse(validApiKey);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.label).toBe('Produção');
      expect(result.data.isRevoked).toBe(false);
    }
  });

  it('deve aceitar lastUsedAt como null', () => {
    const result = ApiKeySchema.safeParse({ ...validApiKey, lastUsedAt: null });
    expect(result.success).toBe(true);
  });

  it('deve aceitar isRevoked como true', () => {
    const result = ApiKeySchema.safeParse({ ...validApiKey, isRevoked: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isRevoked).toBe(true);
  });

  it('deve falhar quando id não é UUID válido', () => {
    const result = ApiKeySchema.safeParse({ ...validApiKey, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('deve falhar sem campo obrigatório', () => {
    const { label: _label, ...withoutLabel } = validApiKey;
    const result = ApiKeySchema.safeParse(withoutLabel);
    expect(result.success).toBe(false);
  });

  it('deve falhar com isRevoked não-boolean', () => {
    const result = ApiKeySchema.safeParse({ ...validApiKey, isRevoked: 'yes' });
    expect(result.success).toBe(false);
  });
});

describe('ApiKeyListResponseSchema', () => {
  it('deve validar lista de keys', () => {
    const result = ApiKeyListResponseSchema.safeParse({ data: [validApiKey] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.data).toHaveLength(1);
  });

  it('deve validar lista vazia', () => {
    const result = ApiKeyListResponseSchema.safeParse({ data: [] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.data).toHaveLength(0);
  });
});

describe('CreateApiKeyResponseSchema', () => {
  it('deve validar resposta com rawToken', () => {
    const result = CreateApiKeyResponseSchema.safeParse({
      data: { ...validApiKey, rawToken: 'vxa_abc123def456' },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.data.rawToken).toBe('vxa_abc123def456');
  });

  it('deve falhar sem rawToken', () => {
    const result = CreateApiKeyResponseSchema.safeParse({ data: validApiKey });
    expect(result.success).toBe(false);
  });

  it('deve incluir todos os campos da ApiKey base', () => {
    const result = CreateApiKeyResponseSchema.safeParse({
      data: { ...validApiKey, rawToken: 'vxa_token' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.id).toBe(validApiKey.id);
      expect(result.data.data.label).toBe(validApiKey.label);
      expect(result.data.data.isRevoked).toBe(false);
    }
  });
});

describe('CreateApiKeyInputSchema', () => {
  it('deve validar label válido', () => {
    const result = CreateApiKeyInputSchema.safeParse({ label: 'Staging' });
    expect(result.success).toBe(true);
  });

  it('deve falhar com label vazio', () => {
    const result = CreateApiKeyInputSchema.safeParse({ label: '' });
    expect(result.success).toBe(false);
  });

  it('deve falhar com label acima de 100 caracteres', () => {
    const result = CreateApiKeyInputSchema.safeParse({ label: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('deve aceitar label com exatamente 100 caracteres', () => {
    const result = CreateApiKeyInputSchema.safeParse({ label: 'a'.repeat(100) });
    expect(result.success).toBe(true);
  });
});
