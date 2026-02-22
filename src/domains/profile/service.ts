import 'server-only';
import { voxaGet, voxaPatch } from '@/lib/services';
import type { UpdateProfileInput, UserProfile } from './schemas';
import { ProfileResponseSchema } from './schemas';

export async function getProfile(): Promise<UserProfile> {
  const result = await voxaGet('/api/v1/dashboard/profile', ProfileResponseSchema);
  return result.data;
}

export async function updateProfile(data: UpdateProfileInput): Promise<UserProfile> {
  const result = await voxaPatch('/api/v1/dashboard/profile', data, ProfileResponseSchema);
  return result.data;
}
