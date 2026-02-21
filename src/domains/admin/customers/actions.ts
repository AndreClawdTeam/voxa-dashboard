'use server';

import { revalidatePath } from 'next/cache';
import { UpdateSubscriptionSchema } from './schemas';
import { updateCustomerSubscription } from './service';

export type UpdateSubscriptionState = { success: true } | { success: false; error: string } | null;

export async function updateSubscriptionAction(
  customerId: string,
  _prevState: UpdateSubscriptionState,
  formData: FormData,
): Promise<UpdateSubscriptionState> {
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
    await updateCustomerSubscription(customerId, parsed.data);
    revalidatePath(`/admin/customers/${customerId}`);
    revalidatePath('/admin/customers');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar assinatura',
    };
  }
}
