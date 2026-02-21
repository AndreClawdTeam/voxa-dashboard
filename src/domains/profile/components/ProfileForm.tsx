'use client';

import { useActionState } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const currentName = state?.success ? state.data.name : (state?.fields?.name ?? profile.name);
  const currentEmail = state?.success ? state.data.email : (state?.fields?.email ?? profile.email);

  const errors = state && !state.success ? state.error : null;
  const formError = errors?._form?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {formError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <FormField
            name="name"
            label="Nome"
            defaultValue={currentName}
            disabled={isPending}
            errors={errors}
          />

          <FormField
            name="email"
            label="E-mail"
            type="email"
            defaultValue={currentEmail}
            disabled={isPending}
            errors={errors}
          />

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
