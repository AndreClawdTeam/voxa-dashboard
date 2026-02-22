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
import { revokeApiKeyAction } from '../actions';

type RevokeState = { success: true } | { success: false; error: string } | null;

interface RevokeApiKeyButtonProps {
  id: string;
  label: string;
  isRevoked: boolean;
}

export function RevokeApiKeyButton({ id, label, isRevoked }: RevokeApiKeyButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [, formAction, isPending] = useActionState<RevokeState, FormData>(
    async (_prevState: RevokeState, formData: FormData): Promise<RevokeState> => {
      return await revokeApiKeyAction(formData);
    },
    null,
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isRevoked || isPending}>
          {isPending ? 'Revogando...' : 'Revogar'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revogar &ldquo;{label}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível. Aplicações usando esta key deixarão de funcionar
            imediatamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              formRef.current?.requestSubmit();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Revogar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      {/* Hidden form to carry the id via FormData */}
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>
    </AlertDialog>
  );
}
