import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/domains/profile/components/ProfileForm';
import { ProfileHeader } from '@/domains/profile/components/ProfileHeader';
import { getProfile } from '@/domains/profile/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Perfil — Voxa Dashboard',
};

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu perfil</h1>
        <p className="mt-1 text-muted-foreground">Visualize e edite suas informações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da conta</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileHeader profile={profile} />
        </CardContent>
      </Card>

      <ProfileForm profile={profile} />
    </div>
  );
}
