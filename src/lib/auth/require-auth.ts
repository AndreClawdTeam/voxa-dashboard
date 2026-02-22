import 'server-only';
import { redirect } from 'next/navigation';
import type { User } from '@/domains/auth/schemas';
import { getCurrentUser } from '@/domains/auth/service';

/**
 * Garante que o usuário está autenticado.
 * Se não estiver, redireciona para /login.
 * Use em Server Actions e Server Components críticos.
 */
export async function requireAuth(): Promise<User> {
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
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}
