import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/domains/auth/service';
import type { UserProfile } from '@/domains/profile/schemas';

/**
 * Garante que o usuário está autenticado.
 * Se não estiver, redireciona para /login.
 * Use em Server Actions e Server Components críticos.
 */
export async function requireAuth(): Promise<UserProfile> {
  try {
    const user = await getCurrentUser();
    return user;
  } catch {
    redirect('/login');
  }
}

/**
 * Garante que o usuário está autenticado E tem role 'admin'.
 * Se não estiver autenticado → redireciona para /login.
 * Se não for admin → redireciona para /dashboard.
 * Use em Server Actions admin.
 */
export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}
