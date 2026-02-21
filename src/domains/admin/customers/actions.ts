'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-auth';
import { UpdateSubscriptionSchema } from './schemas';
import { updateCustomerSubscription } from './service';

export type UpdateSubscriptionState = { success: true } | { success: false; error: string } | null;

const CustomerIdSchema = z.string().uuid('ID de cliente inválido');

export async function updateSubscriptionAction(
  customerId: string,
  _prevState: UpdateSubscriptionState,
  formData: FormData,
): Promise<UpdateSubscriptionState> {
  // ✅ CRÍTICO: verificar autenticação + role admin ANTES de qualquer operação.
  // Server Actions são endpoints HTTP reais — qualquer um pode chamá-los diretamente via POST,
  // bypassando o middleware e o AdminLayout.
  await requireAdmin();

  const idParsed = CustomerIdSchema.safeParse(customerId);
  if (!idParsed.success) {
    return { success: false, error: 'ID de cliente inválido.' };
  }

  const raw = {
    tier: formData.get('tier') || undefined,
    status: formData.get('status') || undefined,
  };

  const parsed = UpdateSubscriptionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    };
  }

  try {
    await updateCustomerSubscription(idParsed.data, parsed.data);
    revalidatePath(`/admin/customers/${idParsed.data}`);
    revalidatePath('/admin/customers');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar assinatura',
    };
  }
}
