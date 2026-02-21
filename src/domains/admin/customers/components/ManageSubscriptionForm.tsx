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
import {
  STATUS_LABELS,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TIERS,
  type SubscriptionStatus,
  type SubscriptionTier,
  TIER_LABELS,
} from '../enums';
import type { AdminCustomerDetail } from '../schemas';

interface Props {
  customer: AdminCustomerDetail;
  customerId: string;
}

export function ManageSubscriptionForm({ customer, customerId }: Props) {
  const currentSub = customer.subscription;
  const formRef = useRef<HTMLFormElement>(null);
  const tierRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmValues, setConfirmValues] = useState<{
    tier: SubscriptionTier;
    status: SubscriptionStatus;
  } | null>(null);

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

  const handleTierChange = (value: string) => {
    if (tierRef.current) tierRef.current.value = value;
    const newTier = value as SubscriptionTier;
    const curStatus = (statusRef.current?.value ??
      currentSub?.status ??
      'trial') as SubscriptionStatus;
    setHasChanges(
      newTier !== (currentSub?.tier ?? 'trial') || curStatus !== (currentSub?.status ?? 'trial'),
    );
  };

  const handleStatusChange = (value: string) => {
    if (statusRef.current) statusRef.current.value = value;
    const curTier = (tierRef.current?.value ?? currentSub?.tier ?? 'trial') as SubscriptionTier;
    const newStatus = value as SubscriptionStatus;
    setHasChanges(
      curTier !== (currentSub?.tier ?? 'trial') || newStatus !== (currentSub?.status ?? 'trial'),
    );
  };

  const handleSaveClick = () => {
    const tier = (tierRef.current?.value ?? currentSub?.tier ?? 'trial') as SubscriptionTier;
    const status = (statusRef.current?.value ??
      currentSub?.status ??
      'trial') as SubscriptionStatus;
    setConfirmValues({ tier, status });
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    if (!confirmValues) return;
    const fd = new FormData();
    fd.set('tier', confirmValues.tier);
    fd.set('status', confirmValues.status);
    formAction(fd);
  };

  return (
    <>
      <form ref={formRef} className="space-y-4">
        <input ref={tierRef} type="hidden" name="tier" defaultValue={currentSub?.tier ?? 'trial'} />
        <input
          ref={statusRef}
          type="hidden"
          name="status"
          defaultValue={currentSub?.status ?? 'trial'}
        />

        {state && !state.success && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tier</p>
            <Select defaultValue={currentSub?.tier ?? 'trial'} onValueChange={handleTierChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {TIER_LABELS[tier]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <Select defaultValue={currentSub?.status ?? 'trial'} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="button" onClick={handleSaveClick} disabled={isPending || !hasChanges}>
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de assinatura</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Você está alterando a assinatura de <strong>{customer.name}</strong>:
                <br />
                Tier:{' '}
                <strong>
                  {currentSub?.tier ? TIER_LABELS[currentSub.tier] : '—'} →{' '}
                  {confirmValues ? TIER_LABELS[confirmValues.tier] : '—'}
                </strong>
                <br />
                Status:{' '}
                <strong>
                  {currentSub?.status ? STATUS_LABELS[currentSub.status] : '—'} →{' '}
                  {confirmValues ? STATUS_LABELS[confirmValues.status] : '—'}
                </strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
