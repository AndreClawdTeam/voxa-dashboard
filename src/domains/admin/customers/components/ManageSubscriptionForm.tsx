'use client';

import { useActionState, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UpdateSubscriptionState } from '../actions';
import { updateSubscriptionAction } from '../actions';
import { STATUS_LABELS, SUBSCRIPTION_STATUS, SUBSCRIPTION_TIER, TIER_LABELS } from '../constants';
import type { AdminCustomerDetail } from '../schemas';

interface Props {
  customer: AdminCustomerDetail;
  customerId: string;
}

export function ManageSubscriptionForm({ customer, customerId }: Props) {
  const currentSub = customer.subscription;
  const formRef = useRef<HTMLFormElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const boundAction = updateSubscriptionAction.bind(null, customerId);

  const [state, formAction, isPending] = useActionState<UpdateSubscriptionState, FormData>(
    async (prevState, formData) => {
      const result = await boundAction(prevState, formData);
      if (result?.success) {
        toast.success('Assinatura atualizada com sucesso!');
        setHasChanges(false);
      } else if (result && !result.success) {
        toast.error(result.error);
      }
      return result;
    },
    null,
  );

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-4">
        {state && !state.success && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tier</p>
            <Select
              name="tier"
              defaultValue={currentSub?.tier ?? SUBSCRIPTION_TIER.trial}
              onValueChange={() => setHasChanges(true)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SUBSCRIPTION_TIER).map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {TIER_LABELS[tier]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <Select
              name="status"
              defaultValue={currentSub?.status ?? SUBSCRIPTION_STATUS.trial}
              onValueChange={() => setHasChanges(true)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SUBSCRIPTION_STATUS).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={isPending || !hasChanges}
        >
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Você está alterando a assinatura de <strong>{customer.name}</strong>. Essa ação
              atualizará o tier e/ou status da assinatura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirm(false);
                formRef.current?.requestSubmit();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
