import 'server-only';
import { cache } from 'react';
import type { UserProfile } from '@/domains/profile/schemas';
import { ProfileResponseSchema } from '@/domains/profile/schemas';
import { voxaGet, voxaPost } from '@/lib/services';
import { LoginResponseSchema, RefreshResponseSchema, RegisterResponseSchema } from './schemas';

// ─── JWT decode helper ────────────────────────────────────────────────────────

/**
 * Decodes the JWT payload (base64url) without verification.
 * Safe to use here because the token was just received from our trusted API.
 * The role is used only for setting a display cookie — actual auth is enforced by the API.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split('.');
    if (!payload) return {};
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return {};
  }
}

// ─── Auth service ─────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * The API only returns accessToken on login (no user object — intentional design).
 * We decode the JWT to extract the role for the userRole cookie.
 */
export async function loginUser(email: string, password: string) {
  const result = await voxaPost('/api/v1/auth/login', { email, password }, LoginResponseSchema);
  const { accessToken } = result.data;

  const payload = decodeJwtPayload(accessToken);
  const role = typeof payload.role === 'string' ? payload.role : 'customer';

  return { accessToken, user: { role } };
}

/**
 * POST /auth/register
 * Returns user (without isActive) + accessToken.
 */
export async function registerUser(name: string, email: string, password: string) {
  const result = await voxaPost(
    '/api/v1/auth/register',
    { name, email, password },
    RegisterResponseSchema,
  );
  return result.data;
}

export async function logoutUser(): Promise<void> {
  await voxaPost('/api/v1/auth/logout', {}, RefreshResponseSchema.partial());
}

/**
 * Returns the full user profile from /dashboard/profile.
 * This endpoint returns name, email, role, and subscription info — everything
 * the dashboard UI needs. Wrapped with React.cache() to deduplicate calls
 * within the same render tree (e.g. layout + page in the same request).
 *
 * Note: /auth/me only returns { userId, role } from JWT payload and is NOT
 * suitable for display purposes (missing name, email, etc).
 */
export const getCurrentUser = cache(async (): Promise<UserProfile> => {
  const result = await voxaGet('/api/v1/dashboard/profile', ProfileResponseSchema);
  return result.data;
});
