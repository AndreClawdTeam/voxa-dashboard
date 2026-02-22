'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/require-auth';
import { isVoxaApiError, isVoxaNetworkError } from '@/lib/services';
import type { TranscriptionData } from './schemas';
import { transcribeAudio } from './service';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_FORMATS = ['mp3', 'wav', 'ogg', 'mp4', 'm4a', 'flac', 'webm'] as const;

// ─── Tipos de resultado ───────────────────────────────────────────────────────

export type TranscribeResult =
  | { success: true; data: TranscriptionData }
  | { success: false; error: string };

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

  try {
    const data = await transcribeAudio(audioFile, apiKey.trim());
    revalidatePath('/dashboard/transcriptions');
    return { success: true, data };
  } catch (err) {
    if (isVoxaApiError(err)) {
      if (err.statusCode === 401) {
        return { success: false, error: 'API Key inválida ou revogada.' };
      }
      if (err.statusCode === 429) {
        return {
          success: false,
          error: 'Rate limit atingido. Aguarde um momento e tente novamente.',
        };
      }
      return { success: false, error: err.message };
    }
    if (isVoxaNetworkError(err)) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Erro inesperado. Tente novamente.' };
  }
}
