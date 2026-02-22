import { z } from 'zod';

// ─── Schema da entidade ───────────────────────────────────────────────────────

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  isRevoked: z.boolean(),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
});

// ─── Schemas de input ─────────────────────────────────────────────────────────

export const CreateApiKeyInputSchema = z.object({
  label: z.string().min(1, 'Label obrigatório').max(100, 'Máximo 100 caracteres'),
});

// ─── Schemas de resposta da API (com wrapper data) ───────────────────────────

export const ApiKeyListResponseSchema = z.object({
  data: z.array(ApiKeySchema),
});

// Resposta de criação: inclui rawToken (retornado UMA ÚNICA VEZ)
export const CreateApiKeyResponseSchema = z.object({
  data: ApiKeySchema.extend({
    rawToken: z.string(),
  }),
});

// Schema genérico para DELETE (a API pode retornar {} ou { message: "ok" })
export const DeleteApiKeyResponseSchema = z.object({}).passthrough();

// ─── Tipos TypeScript derivados ───────────────────────────────────────────────

export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeyInputSchema>;
export type ApiKeyListResponse = z.infer<typeof ApiKeyListResponseSchema>;
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>['data'];
