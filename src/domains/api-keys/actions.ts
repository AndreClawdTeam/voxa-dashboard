'use server';

import { revalidatePath } from 'next/cache';
import { isVoxaApiError } from '@/lib/services';
import type { ApiKey } from './schemas';
import { CreateApiKeyInputSchema } from './schemas';
import { createApiKey, revokeApiKey } from './service';

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

type CreateApiKeyResult =
  | { success: true; rawToken: string; key: ApiKey }
  | { success: false; error: string };

type RevokeApiKeyResult = { success: true } | { success: false; error: string };

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function createApiKeyAction(formData: FormData): Promise<CreateApiKeyResult> {
  const parsed = CreateApiKeyInputSchema.safeParse({
    label: formData.get('label'),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const errorMsg =
      fieldErrors.label?.[0] ?? 'Dados inválidos. Verifique o label e tente novamente.';
    return { success: false, error: errorMsg };
  }

  try {
    const result = await createApiKey(parsed.data.label);
    revalidatePath('/dashboard/api-keys');
    return {
      success: true,
      rawToken: result.rawToken,
      key: {
        id: result.id,
        label: result.label,
        isRevoked: result.isRevoked,
        lastUsedAt: result.lastUsedAt,
        createdAt: result.createdAt,
      },
    };
  } catch (err) {
    if (isVoxaApiError(err)) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Erro inesperado. Tente novamente.' };
  }
}

export async function revokeApiKeyAction(id: string): Promise<RevokeApiKeyResult> {
  try {
    await revokeApiKey(id);
    revalidatePath('/dashboard/api-keys');
    return { success: true };
  } catch (err) {
    if (isVoxaApiError(err)) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Erro ao revogar a API key. Tente novamente.' };
  }
}
