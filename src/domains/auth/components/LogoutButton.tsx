'use client';

import { LogOut } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { logoutAction } from '../actions';

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      disabled={pending}
    >
      <LogOut className="h-4 w-4 flex-shrink-0" />
      {pending ? 'Saindo...' : 'Sair'}
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmitButton />
    </form>
  );
}
