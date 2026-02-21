'use client';

import { useActionState, useState } from 'react';
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
import type { AdminCustomerDetail } from '../schemas';

interface Props {
  customer: AdminCustomerDetail;
  customerId: string;
}

const TIER_LABELS: Record<string, string> = { trial: 'Trial', basic: 'Basic', pro: 'Pro' };
const STATUS_LABELS: Record<string, string> = {
  trial: 'Trial',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
};

export function ManageSubscriptionForm({ customer, customerId }: Props) {
  const currentSub = customer.subscription;
  const [pendingTier, setPendingTier] = useState<'trial' | 'basic' | 'pro'>(
    currentSub?.tier ?? 'trial',
  );
  const [pendingStatus, setPendingStatus] = useState<
    'trial' | 'active' | 'suspended' | 'cancelled'
  >(currentSub?.status ?? 'trial');
  const [showConfirm, setShowConfirm] = useState(false);

  const boundAction = updateSubscriptionAction.bind(null, customerId);

  const [state, formAction, isPending] = useActionState<UpdateSubscriptionState, FormData>(
    async (prevState, formData) => {
      const result = await boundAction(prevState, formData);
      if (result?.success) {
        toast.success('Assinatura atualizada com sucesso!');
      } else if (result && !result.success) {
        toast.error(result.error);
      }
      return result;
    },
    null,
  );

  const hasChanges =
    pendingTier !== (currentSub?.tier ?? 'trial') ||
    pendingStatus !== (currentSub?.status ?? 'trial');

  return (
    <>
      <div className="space-y-4">
        {state && !state.success && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tier</p>
            <Select
              value={pendingTier}
              onValueChange={(v) => setPendingTier(v as typeof pendingTier)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <Select
              value={pendingStatus}
              onValueChange={(v) => setPendingStatus(v as typeof pendingStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="suspended">Suspensa</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
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
      </div>

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
                  {TIER_LABELS[currentSub?.tier ?? ''] ?? currentSub?.tier ?? '—'} →{' '}
                  {TIER_LABELS[pendingTier]}
                </strong>
                <br />
                Status:{' '}
                <strong>
                  {STATUS_LABELS[currentSub?.status ?? ''] ?? currentSub?.status ?? '—'} →{' '}
                  {STATUS_LABELS[pendingStatus]}
                </strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirm(false);
                const formData = new FormData();
                formData.set('tier', pendingTier);
                formData.set('status', pendingStatus);
                formAction(formData);
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
