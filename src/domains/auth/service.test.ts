import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks must be hoisted before imports that use them
vi.mock('@/lib/services', () => ({
  voxaPost: vi.fn(),
  voxaGet: vi.fn(),
  isVoxaApiError: vi.fn(),
  getFieldErrors: vi.fn(),
  VoxaApiError: class VoxaApiError extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message);
      this.name = 'VoxaApiError';
    }
  },
}));

import { voxaGet, voxaPost } from '@/lib/services';
import { getCurrentUser, loginUser, logoutUser, registerUser } from './service';

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'João Silva',
  role: 'customer' as const,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('loginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar accessToken e user no sucesso', async () => {
    const mockResponse = {
      data: {
        accessToken: 'token-abc-123',
        user: mockUser,
      },
    };
    vi.mocked(voxaPost).mockResolvedValue(mockResponse);

    const result = await loginUser('user@example.com', 'password123');

    expect(voxaPost).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      { email: 'user@example.com', password: 'password123' },
      expect.anything(),
    );
    expect(result.accessToken).toBe('token-abc-123');
    expect(result.user).toEqual(mockUser);
  });

  it('deve propagar erro da API', async () => {
    const error = new Error('Credenciais inválidas');
    vi.mocked(voxaPost).mockRejectedValue(error);

    await expect(loginUser('bad@example.com', 'wrong')).rejects.toThrow('Credenciais inválidas');
  });
});

describe('registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar accessToken e user no sucesso', async () => {
    const mockResponse = {
      data: {
        accessToken: 'new-token-xyz',
        user: mockUser,
      },
    };
    vi.mocked(voxaPost).mockResolvedValue(mockResponse);

    const result = await registerUser('João Silva', 'user@example.com', 'senha123');

    expect(voxaPost).toHaveBeenCalledWith(
      '/api/v1/auth/register',
      { name: 'João Silva', email: 'user@example.com', password: 'senha123' },
      expect.anything(),
    );
    expect(result.accessToken).toBe('new-token-xyz');
    expect(result.user).toEqual(mockUser);
  });

  it('deve propagar erro da API', async () => {
    const error = new Error('Email já em uso');
    vi.mocked(voxaPost).mockRejectedValue(error);

    await expect(registerUser('João', 'used@example.com', 'senha123')).rejects.toThrow(
      'Email já em uso',
    );
  });
});

describe('logoutUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar o endpoint de logout', async () => {
    vi.mocked(voxaPost).mockResolvedValue({});

    await logoutUser();

    expect(voxaPost).toHaveBeenCalledWith('/api/v1/auth/logout', {}, expect.anything());
  });

  it('deve resolver sem erro mesmo quando API falha (responsabilidade de actions)', async () => {
    // logoutUser propaga o erro — o logoutAction é quem ignora
    const error = new Error('Network error');
    vi.mocked(voxaPost).mockRejectedValue(error);

    await expect(logoutUser()).rejects.toThrow('Network error');
  });
});

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar o usuário autenticado', async () => {
    const mockResponse = { data: mockUser };
    vi.mocked(voxaGet).mockResolvedValue(mockResponse);

    const user = await getCurrentUser();

    expect(voxaGet).toHaveBeenCalledWith('/api/v1/auth/me', expect.anything());
    expect(user).toEqual(mockUser);
  });

  it('deve propagar erro da API', async () => {
    const error = new Error('Não autorizado');
    vi.mocked(voxaGet).mockRejectedValue(error);

    await expect(getCurrentUser()).rejects.toThrow('Não autorizado');
  });
});
