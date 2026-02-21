'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/domains/auth/service';
import type { Subscription } from './schemas';
import { UpgradeSchema } from './schemas';
import { upgradeSubscription } from './service';

export type UpgradeState =
  | { success: true; data: Subscription }
  | { success: false; error: string }
  | null;

export async function upgradeSubscriptionAction(
  _prevState: UpgradeState,
  formData: FormData,
): Promise<UpgradeState> {
  // Verificar autenticação
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return { success: false, error: 'Não autenticado. Faça login novamente.' };
  }

  const parsed = UpgradeSchema.safeParse({ tier: formData.get('tier') });
  if (!parsed.success) {
    return { success: false, error: 'Plano inválido' };
  }
  try {
    const subscription = await upgradeSubscription(parsed.data.tier);
    revalidatePath('/dashboard/subscription');
    revalidatePath('/dashboard');
    return { success: true, data: subscription };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao fazer upgrade',
    };
  }
}
