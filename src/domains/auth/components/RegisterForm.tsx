'use client';

import { useActionState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAction } from '../actions';

type ActionResult = { success: true } | { success: false; error: Record<string, string[]> };

export function RegisterForm() {
  const [state, action, isPending] = useActionState(
    async (prevState: ActionResult | null, formData: FormData) => {
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" type="text" placeholder="Seu nome completo" required />
        {state && !state.success && state.error.name && (
          <p className="text-sm text-destructive">{state.error.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required />
        {state && !state.success && state.error.email && (
          <p className="text-sm text-destructive">{state.error.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
        {state && !state.success && state.error.password && (
          <p className="text-sm text-destructive">{state.error.password[0]}</p>
        )}
      </div>

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
