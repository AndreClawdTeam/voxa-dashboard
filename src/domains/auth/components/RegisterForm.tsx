'use client';

import { useActionState } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import type { FieldActionResult } from '@/lib/action-result';
import { registerAction } from '../actions';

export function RegisterForm() {
  const [state, action, isPending] = useActionState(
    async (prevState: FieldActionResult | null, formData: FormData) => {
      const result = await registerAction(prevState, formData);
      // ✅ Efeito após action AQUI — nunca em useEffect
      if (!result.success && result.error._form) {
        toast.error(result.error._form[0]);
      }
      return result;
    },
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField
        name="name"
        label="Nome"
        type="text"
        placeholder="Seu nome completo"
        defaultValue={state?.success === false ? (state.fields?.name ?? '') : ''}
        errors={state?.success === false ? state.error : null}
        required
      />

      <FormField
        name="email"
        label="Email"
        type="email"
        placeholder="voce@exemplo.com"
        defaultValue={state?.success === false ? (state.fields?.email ?? '') : ''}
        errors={state?.success === false ? state.error : null}
        required
      />

      <FormField
        name="password"
        label="Senha"
        type="password"
        placeholder="••••••••"
        errors={state?.success === false ? state.error : null}
        required
      />

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Criando conta...' : 'Criar conta'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <a href="/login" className="text-primary hover:underline">
          Entrar
        </a>
      </p>
    </form>
  );
}
