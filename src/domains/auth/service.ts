import 'server-only';
import { voxaGet, voxaPost } from '@/lib/services';
import type { User } from './schemas';
import { AuthResponseSchema, MeResponseSchema, RefreshResponseSchema } from './schemas';

export async function loginUser(email: string, password: string) {
  const result = await voxaPost('/api/v1/auth/login', { email, password }, AuthResponseSchema);
  return result.data;
}

export async function registerUser(name: string, email: string, password: string) {
  const result = await voxaPost(
    '/api/v1/auth/register',
    { name, email, password },
    AuthResponseSchema,
  );
  return result.data;
}

export async function logoutUser(): Promise<void> {
  await voxaPost('/api/v1/auth/logout', {}, RefreshResponseSchema.partial());
}

export async function getCurrentUser(): Promise<User> {
  const result = await voxaGet('/api/v1/auth/me', MeResponseSchema);
  return result.data;
}
