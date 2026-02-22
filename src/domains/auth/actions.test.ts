import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./service', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock('@/lib/services', () => ({
  isVoxaApiError: (err: unknown) =>
    err instanceof Error && (err as { name?: string }).name === 'VoxaApiError',
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

import { VoxaApiError } from '@/lib/services';
import { loginAction, logoutAction, registerAction } from './actions';
import { loginUser, logoutUser, registerUser } from './service';

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'João Silva',
  role: 'customer' as const,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

function makeFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }
  return formData;
}

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar erro de validação para email inválido', async () => {
    const formData = makeFormData({ email: 'invalid', password: 'secret' });
    const result = await loginAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.email).toBeDefined();
    }
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('deve retornar erro de validação para senha vazia', async () => {
    const formData = makeFormData({ email: 'user@example.com', password: '' });
    const result = await loginAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.password).toBeDefined();
    }
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('deve chamar loginUser e redirecionar para /dashboard com dados válidos', async () => {
    vi.mocked(loginUser).mockResolvedValue({ accessToken: 'token-abc', user: mockUser });

    const formData = makeFormData({ email: 'user@example.com', password: 'secret123' });
    await loginAction(formData);

    expect(loginUser).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('deve retornar erro de API quando loginUser lança VoxaApiError', async () => {
    const apiError = new VoxaApiError('Credenciais inválidas', 'INVALID_CREDENTIALS');
    vi.mocked(loginUser).mockRejectedValue(apiError);

    const formData = makeFormData({ email: 'user@example.com', password: 'wrong' });
    const result = await loginAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error._form).toEqual(['Credenciais inválidas']);
    }
    expect(redirect).not.toHaveBeenCalled();
  });

  it('deve retornar erro genérico para exceção inesperada', async () => {
    vi.mocked(loginUser).mockRejectedValue(new Error('Network error'));

    const formData = makeFormData({ email: 'user@example.com', password: 'secret123' });
    const result = await loginAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error._form).toEqual(['Erro inesperado. Tente novamente.']);
    }
  });
});

describe('registerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar erro de validação para nome muito curto', async () => {
    const formData = makeFormData({
      name: 'J',
      email: 'joao@example.com',
      password: 'senha123',
    });
    const result = await registerAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.name).toBeDefined();
    }
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('deve retornar erro de validação para senha curta', async () => {
    const formData = makeFormData({
      name: 'João Silva',
      email: 'joao@example.com',
      password: '1234',
    });
    const result = await registerAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.password).toBeDefined();
    }
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('deve chamar registerUser e redirecionar com dados válidos', async () => {
    vi.mocked(registerUser).mockResolvedValue({ accessToken: 'new-token', user: mockUser });

    const formData = makeFormData({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
    });
    await registerAction(formData);

    expect(registerUser).toHaveBeenCalledWith('João Silva', 'joao@example.com', 'senha123');
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('deve retornar erro de API quando registerUser lança VoxaApiError', async () => {
    const apiError = new VoxaApiError('Email já cadastrado', 'EMAIL_ALREADY_EXISTS');
    vi.mocked(registerUser).mockRejectedValue(apiError);

    const formData = makeFormData({
      name: 'João Silva',
      email: 'used@example.com',
      password: 'senha123',
    });
    const result = await registerAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error._form).toEqual(['Email já cadastrado']);
    }
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('logoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar logoutUser, deletar cookies e redirecionar para /login', async () => {
    vi.mocked(logoutUser).mockResolvedValue(undefined);

    await logoutAction();

    expect(logoutUser).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('deve deletar cookies e redirecionar mesmo quando logoutUser falha', async () => {
    vi.mocked(logoutUser).mockRejectedValue(new Error('Network error'));

    await logoutAction();

    // Deve redirecionar mesmo assim
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
