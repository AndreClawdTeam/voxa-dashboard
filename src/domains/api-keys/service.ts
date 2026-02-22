import 'server-only';
import { voxaDelete, voxaGet, voxaPost } from '@/lib/services';
import type { ApiKey, CreateApiKeyResponse } from './schemas';
import {
  ApiKeyListResponseSchema,
  CreateApiKeyResponseSchema,
  DeleteApiKeyResponseSchema,
} from './schemas';

export async function listApiKeys(): Promise<ApiKey[]> {
  const result = await voxaGet('/api/v1/keys', ApiKeyListResponseSchema);
  return result.data;
}

export async function createApiKey(label: string): Promise<CreateApiKeyResponse> {
  const result = await voxaPost('/api/v1/keys', { label }, CreateApiKeyResponseSchema);
  return result.data;
}

export async function revokeApiKey(id: string): Promise<void> {
  await voxaDelete(`/api/v1/keys/${id}`, DeleteApiKeyResponseSchema);
}
