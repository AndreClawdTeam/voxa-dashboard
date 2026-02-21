'use client';

import type { ComponentProps } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';

type ActionFn = (prevState: unknown, formData: FormData) => Promise<unknown>;

interface ActionButtonProps extends ComponentProps<typeof Button> {
  /** Server Action a ser chamada no submit */
  action: ActionFn;
  /** Campos enviados como inputs hidden: { chave: valor } */
  data?: Record<string, string>;
  children?: React.ReactNode;
}

export function ActionButton({
  action,
  data = {},
  children,
  disabled,
  ...buttonProps
}: ActionButtonProps) {
  const [, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction}>
      {Object.entries(data).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <Button type="submit" disabled={isPending || disabled} {...buttonProps}>
        {children ?? 'Confirmar'}
      </Button>
    </form>
  );
}
