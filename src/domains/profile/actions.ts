'use server';

import { revalidatePath } from 'next/cache';
import { isVoxaApiError } from '@/lib/services';
import type { UserProfile } from './schemas';
import { UpdateProfileSchema } from './schemas';
import { updateProfile } from './service';

export type UpdateProfileState =
  | { success: true; data: UserProfile }
  | { success: false; errors?: Record<string, string[]>; apiError?: string }
  | null;

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  const parsed = UpdateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const [field, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors[field] = msgs ?? [];
    }
    return { success: false, errors };
  }

  try {
    const updated = await updateProfile(parsed.data);
    revalidatePath('/dashboard/profile');
    return { success: true, data: updated };
  } catch (err) {
    if (isVoxaApiError(err)) {
      return { success: false, apiError: err.message };
    }
    const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
    return { success: false, apiError: message };
  }
}
