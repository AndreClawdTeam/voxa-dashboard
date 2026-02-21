'use client';

import { useActionState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateProfileState } from '../actions';
import { updateProfileAction } from '../actions';
import type { UserProfile } from '../schemas';

interface Props {
  profile: UserProfile;
}

export function ProfileForm({ profile }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> => {
      const result = await updateProfileAction(_prevState, formData);
      if (result?.success) {
        toast.success('Perfil atualizado!', {
          description: 'Suas informações foram salvas com sucesso.',
        });
      }
      return result;
    },
    null,
  );

  const currentName = state?.success ? state.data.name : profile.name;
  const currentEmail = state?.success ? state.data.email : profile.email;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state && !state.success && state.apiError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {state.apiError}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={currentName}
              disabled={isPending}
              aria-describedby={
                state && !state.success && state.errors?.name ? 'name-error' : undefined
              }
            />
            {state && !state.success && state.errors?.name && (
              <p id="name-error" className="text-xs text-red-600">
                {state.errors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={currentEmail}
              disabled={isPending}
              aria-describedby={
                state && !state.success && state.errors?.email ? 'email-error' : undefined
              }
            />
            {state && !state.success && state.errors?.email && (
              <p id="email-error" className="text-xs text-red-600">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Salvando...
              </span>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
