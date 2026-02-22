import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modules before imports
vi.mock('@/lib/auth/require-auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'customer',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  }),
}));

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_VOXA_API_URL: 'http://138.197.19.184:3000',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
    NODE_ENV: 'test',
  },
}));

import { revalidatePath } from 'next/cache';
import { transcribeAudioAction } from './actions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name: string, sizeBytes = 1024, type = 'audio/mpeg'): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

function makeFormData(file: File | null, apiKey: string | null): FormData {
  const fd = new FormData();
  if (file) fd.append('audio', file);
  if (apiKey !== null) fd.append('apiKey', apiKey);
  return fd;
}

const MOCK_API_RESPONSE = {
  data: {
    id: 'trans-123',
    text: 'Olá mundo, esta é uma transcrição.',
    language: 'pt-BR',
    duration: 5.2,
    wordCount: 7,
    processingTime: 1234,
    createdAt: '2026-02-22T12:00:00Z',
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('transcribeAudioAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  // ─── Validação de arquivo ─────────────────────────────────────────────────

  it('deve retornar erro quando nenhum arquivo é fornecido', async () => {
    const fd = makeFormData(null, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/nenhum arquivo/i);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o arquivo tem formato inválido', async () => {
    const file = makeFile('documento.pdf', 1024, 'application/pdf');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/\.pdf.*não suportado/i);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o arquivo excede 25MB', async () => {
    const oversizedFile = makeFile('audio.mp3', 26 * 1024 * 1024);
    const fd = makeFormData(oversizedFile, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/muito grande/i);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  // ─── Validação de API Key ──────────────────────────────────────────────────

  it('deve retornar erro quando a API Key está vazia', async () => {
    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, '');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/api key/i);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando a API Key não é fornecida', async () => {
    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, null);

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/api key/i);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  // ─── Erros de rede ─────────────────────────────────────────────────────────

  it('deve retornar erro de rede quando fetch lança exceção', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/erro de rede/i);
    }
  });

  // ─── Erros HTTP ────────────────────────────────────────────────────────────

  it('deve retornar erro de API Key inválida para 401', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
      }),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_invalidkey');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/inválida ou revogada/i);
    }
  });

  it('deve retornar erro de rate limit para 429', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' }), {
        status: 429,
      }),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/rate limit/i);
    }
  });

  it('deve retornar erro genérico para outros erros HTTP', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Internal Server Error', code: 'SERVER_ERROR' }), {
        status: 500,
      }),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Deve conter a mensagem de erro da API ou o status code
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    }
  });

  // ─── Sucesso ───────────────────────────────────────────────────────────────

  it('deve retornar dados de transcrição em caso de sucesso', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(MOCK_API_RESPONSE), { status: 200 }),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe('Olá mundo, esta é uma transcrição.');
      expect(result.data.id).toBe('trans-123');
      expect(result.data.language).toBe('pt-BR');
    }
  });

  it('deve chamar revalidatePath após sucesso', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(MOCK_API_RESPONSE), { status: 200 }),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    await transcribeAudioAction(fd);

    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/transcriptions');
  });

  it('deve enviar Authorization: Bearer com a API Key correta', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(MOCK_API_RESPONSE), { status: 200 }),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_mykey999');

    await transcribeAudioAction(fd);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/transcribe'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer vxa_mykey999',
        }),
      }),
    );
  });

  it('deve aceitar formatos de áudio suportados: wav, ogg, mp4, m4a, flac, webm', async () => {
    // Usar mockImplementation para criar um novo Response a cada chamada
    // (body de Response só pode ser lido uma vez)
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(MOCK_API_RESPONSE), { status: 200 })),
    );

    for (const format of ['wav', 'ogg', 'mp4', 'm4a', 'flac', 'webm']) {
      const file = makeFile(`audio.${format}`);
      const fd = makeFormData(file, 'vxa_testkey123');
      const result = await transcribeAudioAction(fd);
      expect(result.success, `Formato ${format} deveria ser aceito`).toBe(true);
    }
  });
});
