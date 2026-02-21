import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the services module before importing service
vi.mock('@/lib/services', () => ({
  voxaGet: vi.fn(),
  voxaPost: vi.fn(),
  voxaDelete: vi.fn(),
}));

import { voxaDelete, voxaGet, voxaPost } from '@/lib/services';
import { createApiKey, listApiKeys, revokeApiKey } from './service';

const mockKey = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  label: 'Produção',
  isRevoked: false,
  lastUsedAt: null,
  createdAt: '2026-02-01T08:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listApiKeys', () => {
  it('deve retornar lista de keys', async () => {
    vi.mocked(voxaGet).mockResolvedValue({ data: [mockKey] });

    const result = await listApiKeys();

    expect(voxaGet).toHaveBeenCalledWith('/api/v1/keys', expect.any(Object));
    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe('Produção');
  });

  it('deve retornar lista vazia', async () => {
    vi.mocked(voxaGet).mockResolvedValue({ data: [] });

    const result = await listApiKeys();

    expect(result).toHaveLength(0);
  });

  it('deve propagar erro da API', async () => {
    vi.mocked(voxaGet).mockRejectedValue(new Error('API error'));

    await expect(listApiKeys()).rejects.toThrow('API error');
  });
});

describe('createApiKey', () => {
  it('deve criar key e retornar com rawToken', async () => {
    const responseData = { data: { ...mockKey, rawToken: 'vxa_abc123' } };
    vi.mocked(voxaPost).mockResolvedValue(responseData);

    const result = await createApiKey('Staging');

    expect(voxaPost).toHaveBeenCalledWith('/api/v1/keys', { label: 'Staging' }, expect.any(Object));
    expect(result.rawToken).toBe('vxa_abc123');
    expect(result.label).toBe('Produção');
  });

  it('deve propagar erro ao criar key', async () => {
    vi.mocked(voxaPost).mockRejectedValue(new Error('Forbidden'));

    await expect(createApiKey('Test')).rejects.toThrow('Forbidden');
  });
});

describe('revokeApiKey', () => {
  it('deve revogar key sem retornar dados', async () => {
    vi.mocked(voxaDelete).mockResolvedValue({});

    await expect(revokeApiKey('123e4567-e89b-12d3-a456-426614174000')).resolves.toBeUndefined();

    expect(voxaDelete).toHaveBeenCalledWith(
      '/api/v1/keys/123e4567-e89b-12d3-a456-426614174000',
      expect.any(Object),
    );
  });

  it('deve propagar erro ao revogar', async () => {
    vi.mocked(voxaDelete).mockRejectedValue(new Error('Not found'));

    await expect(revokeApiKey('non-existent')).rejects.toThrow('Not found');
  });
});
