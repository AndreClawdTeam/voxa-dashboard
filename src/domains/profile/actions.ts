'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/require-auth';
import { isVoxaApiError } from '@/lib/services';
import type { UserProfile } from './schemas';
import { UpdateProfileSchema } from './schemas';
import { updateProfile } from './service';

export type UpdateProfileState =
  | { success: true; data: UserProfile }
  | { success: false; error: Record<string, string[]>; fields?: Record<string, string> }
  | null;

export async function updateProfileAction(formData: FormData): Promise<UpdateProfileState> {
  const name = (formData.get('name') as string) ?? '';
  const email = (formData.get('email') as string) ?? '';

  // requireAuth() redireciona para /login se não autenticado
  await requireAuth();

  const parsed = UpdateProfileSchema.safeParse({ name, email });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[field] = msgs ?? [];
    }
    return { success: false, error: fieldErrors, fields: { name, email } };
  }

  try {
    const updated = await updateProfile(parsed.data);
    revalidatePath('/dashboard/profile');
    return { success: true, data: updated };
  } catch (err) {
    if (isVoxaApiError(err)) {
      return {
        success: false,
        error: { _form: [err.message] },
        fields: { name, email },
      };
    }
    // Não vazar detalhes internos de erros inesperados para o cliente
    return {
      success: false,
      error: { _form: ['Erro ao atualizar perfil. Tente novamente.'] },
      fields: { name, email },
    };
  }
}
