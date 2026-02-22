'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import { env } from '@/lib/env';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_FORMATS = ['mp3', 'wav', 'ogg', 'mp4', 'm4a', 'flac', 'webm'] as const;

// ─── Tipos de resultado ───────────────────────────────────────────────────────

export type TranscribeResult =
  | {
      success: true;
      data: {
        id: string;
        text: string;
        language: string;
        duration: number;
        wordCount: number;
        processingTime: number;
        createdAt: string;
      };
    }
  | { success: false; error: string };

// ─── Schema de resposta da API de transcrição ─────────────────────────────────

const TranscribeResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    text: z.string(),
    language: z.string(),
    duration: z.number(),
    wordCount: z.number(),
    processingTime: z.number(),
    createdAt: z.string(),
  }),
});

// ─── Validação de arquivo ─────────────────────────────────────────────────────

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isAllowedFormat(filename: string): boolean {
  const ext = getFileExtension(filename);
  return (ALLOWED_FORMATS as readonly string[]).includes(ext);
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function transcribeAudioAction(formData: FormData): Promise<TranscribeResult> {
  await requireAuth();

  const audioFile = formData.get('audio');
  const apiKey = formData.get('apiKey');

  // Validação básica de input
  if (!(audioFile instanceof File) || audioFile.size === 0) {
    return { success: false, error: 'Nenhum arquivo de áudio selecionado.' };
  }

  if (typeof apiKey !== 'string' || apiKey.trim() === '') {
    return { success: false, error: 'Selecione uma API Key para continuar.' };
  }

  // Validação de tamanho
  if (audioFile.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `Arquivo muito grande. O tamanho máximo é 25MB (arquivo atual: ${(audioFile.size / 1024 / 1024).toFixed(1)}MB).`,
    };
  }

  // Validação de formato
  if (!isAllowedFormat(audioFile.name)) {
    const ext = getFileExtension(audioFile.name) || 'desconhecido';
    return {
      success: false,
      error: `Formato .${ext} não suportado. Formatos aceitos: ${ALLOWED_FORMATS.join(', ')}.`,
    };
  }

  // Montar multipart para a API
  const apiFormData = new FormData();
  apiFormData.append('audio', audioFile);

  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_VOXA_API_URL}/api/v1/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: apiFormData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[transcribeAudioAction] Network error', { message: msg });
    return { success: false, error: 'Erro de rede. Verifique sua conexão e tente novamente.' };
  }

  if (!response.ok) {
    let errorBody: { error?: string; code?: string } = {};
    try {
      errorBody = await response.json();
    } catch {
      // ignora erro de parse
    }

    if (response.status === 401) {
      return { success: false, error: 'API Key inválida ou revogada.' };
    }
    if (response.status === 429) {
      return {
        success: false,
        error: 'Rate limit atingido. Aguarde um momento e tente novamente.',
      };
    }

    return {
      success: false,
      error: errorBody.error ?? `Erro na API (${response.status}). Tente novamente.`,
    };
  }

  let parsed: z.infer<typeof TranscribeResponseSchema>;
  try {
    const json: unknown = await response.json();
    const result = TranscribeResponseSchema.safeParse(json);
    if (!result.success) {
      console.error('[transcribeAudioAction] Invalid response schema', result.error);
      return { success: false, error: 'Resposta inesperada da API. Tente novamente.' };
    }
    parsed = result.data;
  } catch {
    return { success: false, error: 'Erro ao processar resposta da API.' };
  }

  revalidatePath('/dashboard/transcriptions');

  return { success: true, data: parsed.data };
}
