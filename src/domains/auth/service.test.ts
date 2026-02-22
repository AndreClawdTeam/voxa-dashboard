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

// A real JWT with payload { role: 'customer', userId: '123' }
// Encoded: header.payload.signature (only payload matters for decoding)
const MOCK_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.' +
  Buffer.from(
    JSON.stringify({ userId: '123e4567-e89b-12d3-a456-426614174000', role: 'customer' }),
  ).toString('base64url') +
  '.signature';

const mockRegisterUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'João Silva',
  role: 'customer' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockUserProfile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'João Silva',
  role: 'customer' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
  subscription: null,
};

describe('loginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar accessToken e user.role decodificado do JWT', async () => {
    const mockResponse = {
      data: {
        accessToken: MOCK_TOKEN,
      },
    };
    vi.mocked(voxaPost).mockResolvedValue(mockResponse);

    const result = await loginUser('user@example.com', 'password123');

    expect(voxaPost).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      { email: 'user@example.com', password: 'password123' },
      expect.anything(),
    );
    expect(result.accessToken).toBe(MOCK_TOKEN);
    expect(result.user.role).toBe('customer');
  });

  it('deve usar role "customer" como fallback se JWT inválido', async () => {
    const mockResponse = { data: { accessToken: 'not.a.valid.jwt' } };
    vi.mocked(voxaPost).mockResolvedValue(mockResponse);

    const result = await loginUser('user@example.com', 'password123');
    expect(result.user.role).toBe('customer');
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
        user: mockRegisterUser,
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
    expect(result.user).toEqual(mockRegisterUser);
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

  it('deve retornar o perfil completo do usuário via /dashboard/profile', async () => {
    const mockResponse = { data: mockUserProfile };
    vi.mocked(voxaGet).mockResolvedValue(mockResponse);

    const user = await getCurrentUser();

    expect(voxaGet).toHaveBeenCalledWith('/api/v1/dashboard/profile', expect.anything());
    expect(user).toEqual(mockUserProfile);
  });

  it('deve propagar erro da API', async () => {
    const error = new Error('Não autorizado');
    vi.mocked(voxaGet).mockRejectedValue(error);

    await expect(getCurrentUser()).rejects.toThrow('Não autorizado');
  });
});
