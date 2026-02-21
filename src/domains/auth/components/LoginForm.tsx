'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import type { FieldActionResult } from '@/lib/action-result';
import { loginAction } from '../actions';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

function getSecsRemaining(lockedUntil: number | null): number {
  if (lockedUntil === null) return 0;
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
}

export function LoginForm() {
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secsRemaining, setSecsRemaining] = useState(() => getSecsRemaining(null));

  // Tick a cada segundo quando o lockout está ativo
  useEffect(() => {
    if (!lockedUntil) {
      setSecsRemaining(0);
      return;
    }

    // Atualiza imediatamente ao ativar o lockout
    setSecsRemaining(getSecsRemaining(lockedUntil));

    // Depois tick a cada segundo
    const interval = setInterval(() => {
      const remaining = getSecsRemaining(lockedUntil);
      setSecsRemaining(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = secsRemaining > 0;

  const [state, action, isPending] = useActionState(
    async (prevState: FieldActionResult | null, formData: FormData) => {
      // Verificar lockout antes de submeter
      const remaining = getSecsRemaining(lockedUntil);
      if (remaining > 0) {
        toast.error(`Muitas tentativas. Aguarde ${remaining}s antes de tentar novamente.`);
        return prevState;
      }

      const result = await loginAction(prevState, formData);

      // ✅ Efeito após action AQUI — nunca em useEffect
      if (!result.success && result.error._form) {
        toast.error(result.error._form[0]);

        // Incrementar contador de falhas e aplicar lockout se necessário
        const newCount = failCount + 1;
        setFailCount(newCount);
        if (newCount >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
          toast.error(
            `Conta temporariamente bloqueada após ${MAX_ATTEMPTS} tentativas. Aguarde ${LOCKOUT_SECONDS} segundos.`,
          );
        }
      } else if (result.success) {
        // Reset contador no sucesso
        setFailCount(0);
        setLockedUntil(null);
      }

      return result;
    },
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
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

      {isLocked && (
        <p className="text-sm text-destructive text-center">
          Acesso temporariamente bloqueado. Aguarde {secsRemaining}s.
        </p>
      )}

      <Button type="submit" disabled={isPending || isLocked} className="w-full">
        {isPending ? 'Entrando...' : isLocked ? `Bloqueado (${secsRemaining}s)` : 'Entrar'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{' '}
        <a href="/register" className="text-primary hover:underline">
          Criar conta
        </a>
      </p>
    </form>
  );
}
