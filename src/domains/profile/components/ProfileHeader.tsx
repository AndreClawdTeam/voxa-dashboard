import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserProfile } from '../schemas';

interface Props {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: Props) {
  const initials = profile.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
        {initials}
      </div>
      <div>
        <h2 className="text-xl font-semibold">{profile.name}</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{profile.email}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              profile.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {profile.role === 'admin' ? 'Admin' : 'Cliente'}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Membro desde {format(new Date(profile.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
