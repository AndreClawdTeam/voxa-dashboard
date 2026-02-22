'use client';

import { useActionState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { UpgradeState } from '../actions';
import { upgradeSubscriptionAction } from '../actions';
import { PLAN_LABELS } from '../constants';
import type { UpgradeTier } from '../schemas';

interface Props {
  tier: UpgradeTier;
  disabled?: boolean;
  label: string;
}

export function UpgradePlanButton({ tier, disabled, label }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<UpgradeState, FormData>(
    async (_prevState: UpgradeState, formData: FormData): Promise<UpgradeState> => {
      return await upgradeSubscriptionAction(formData);
    },
    null,
  );

  const planLabel = PLAN_LABELS[tier] ?? tier;

  if (disabled) {
    return (
      <Button variant="outline" disabled className="w-full">
        {label}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {state?.success === false && <p className="text-sm text-destructive">{state.error}</p>}
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="tier" value={tier} />
      </form>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full" disabled={isPending}>
            {isPending ? 'Atualizando...' : label}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fazer upgrade para o plano {planLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será movido para o plano {planLabel}. Esta ação atualizará sua assinatura
              imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                formRef.current?.requestSubmit();
              }}
            >
              Confirmar upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
