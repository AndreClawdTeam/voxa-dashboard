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

// Mock service — não mockar fetch diretamente; responsabilidade do service
vi.mock('./service', () => ({
  transcribeAudio: vi.fn(),
  listTranscriptions: vi.fn(),
}));

import { revalidatePath } from 'next/cache';
import { VoxaApiError, VoxaNetworkError } from '@/lib/services';
import { transcribeAudioAction } from './actions';
import { transcribeAudio } from './service';

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

const MOCK_TRANSCRIPTION_DATA = {
  id: 'trans-123',
  text: 'Olá mundo, esta é uma transcrição.',
  language: 'pt-BR',
  duration: 5.2,
  wordCount: 7,
  processingTime: 1234,
  createdAt: '2026-02-22T12:00:00Z',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('transcribeAudioAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Validação de arquivo ─────────────────────────────────────────────────

  it('deve retornar erro quando nenhum arquivo é fornecido', async () => {
    const fd = makeFormData(null, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/nenhum arquivo/i);
    }
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o arquivo tem formato inválido', async () => {
    const file = makeFile('documento.pdf', 1024, 'application/pdf');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/\.pdf.*não suportado/i);
    }
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o arquivo excede 25MB', async () => {
    const oversizedFile = makeFile('audio.mp3', 26 * 1024 * 1024);
    const fd = makeFormData(oversizedFile, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/muito grande/i);
    }
    expect(transcribeAudio).not.toHaveBeenCalled();
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
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando a API Key não é fornecida', async () => {
    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, null);

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/api key/i);
    }
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  // ─── Erros do service ─────────────────────────────────────────────────────

  it('deve retornar erro de rede quando o service lança VoxaNetworkError', async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(
      new VoxaNetworkError('Erro de rede. Verifique sua conexão e tente novamente.'),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/erro de rede/i);
    }
  });

  it('deve retornar erro de API Key inválida para statusCode 401', async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(
      new VoxaApiError('Unauthorized', 'UNAUTHORIZED', undefined, 401),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_invalidkey');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/inválida ou revogada/i);
    }
  });

  it('deve retornar erro de rate limit para statusCode 429', async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(
      new VoxaApiError('Too Many Requests', 'RATE_LIMIT_EXCEEDED', undefined, 429),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/rate limit/i);
    }
  });

  it('deve retornar mensagem de erro da API para outros erros HTTP', async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(
      new VoxaApiError('Internal Server Error', 'SERVER_ERROR', undefined, 500),
    );

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    }
  });

  it('deve retornar erro genérico para erros não esperados', async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(new Error('Unexpected error'));

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    const result = await transcribeAudioAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/erro inesperado/i);
    }
  });

  // ─── Sucesso ───────────────────────────────────────────────────────────────

  it('deve retornar dados de transcrição em caso de sucesso', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue(MOCK_TRANSCRIPTION_DATA);

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
    vi.mocked(transcribeAudio).mockResolvedValue(MOCK_TRANSCRIPTION_DATA);

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_testkey123');

    await transcribeAudioAction(fd);

    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/transcriptions');
  });

  it('deve chamar transcribeAudio com arquivo e API Key corretos', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue(MOCK_TRANSCRIPTION_DATA);

    const file = makeFile('audio.mp3');
    const fd = makeFormData(file, 'vxa_mykey999');

    await transcribeAudioAction(fd);

    expect(transcribeAudio).toHaveBeenCalledWith(file, 'vxa_mykey999');
  });

  it('deve aceitar formatos de áudio suportados: wav, ogg, mp4, m4a, flac, webm', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue(MOCK_TRANSCRIPTION_DATA);

    for (const format of ['wav', 'ogg', 'mp4', 'm4a', 'flac', 'webm']) {
      const file = makeFile(`audio.${format}`);
      const fd = makeFormData(file, 'vxa_testkey123');
      const result = await transcribeAudioAction(fd);
      expect(result.success, `Formato ${format} deveria ser aceito`).toBe(true);
    }
  });
});
