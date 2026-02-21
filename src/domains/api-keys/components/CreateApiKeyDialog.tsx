'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createApiKeyAction } from '../actions';
import { RawTokenRevealStep } from './RawTokenRevealStep';

type CreateState = null | { success: true; rawToken: string } | { success: false; error: string };

export function CreateApiKeyDialog() {
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(
    async (_prevState: CreateState, formData: FormData): Promise<CreateState> => {
      const result = await createApiKeyAction(formData);
      return result.success ? { success: true, rawToken: result.rawToken } : result;
    },
    null,
  );

  const handleConfirm = () => {
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Prevent closing while rawToken is being shown (user must confirm)
    if (!nextOpen && state?.success) {
      return;
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Nova API Key</Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!state?.success}
        onInteractOutside={(e) => {
          if (state?.success) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (state?.success) {
            e.preventDefault();
          }
        }}
      >
        {state?.success ? (
          <>
            <DialogHeader>
              <DialogTitle>API Key criada com sucesso!</DialogTitle>
              <DialogDescription>
                Copie sua API key antes de fechar. Ela não será exibida novamente.
              </DialogDescription>
            </DialogHeader>
            <RawTokenRevealStep rawToken={state.rawToken} onClose={handleConfirm} />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nova API Key</DialogTitle>
              <DialogDescription>
                Crie uma nova API key para integrar com a Voxa API. Escolha um label descritivo.
              </DialogDescription>
            </DialogHeader>
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  name="label"
                  placeholder="Ex: Production App, Staging, Mobile App"
                  maxLength={100}
                  required
                  autoFocus
                />
                {state?.success === false && (
                  <p className="text-sm text-destructive">{state.error}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Criando...' : 'Criar API Key'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
