import 'server-only'; // garante que este módulo nunca vai para o bundle do cliente
import { cookies } from 'next/headers';
import type { z } from 'zod';
import { env } from '@/lib/env';
import { VoxaApiError, VoxaNetworkError } from './errors';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface VoxaFetchOptions<T> {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  schema: z.ZodSchema<T>;
  cache?: RequestCache;
  tags?: string[];
}

// ─── Token helpers ────────────────────────────────────────────────────────────

async function getServerAccessToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('accessToken')?.value;
  } catch {
    return undefined;
  }
}

async function refreshServerToken(): Promise<string> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;
  if (!refreshToken) {
    throw new VoxaApiError(
      'Sessão expirada. Faça login novamente.',
      'UNAUTHORIZED',
      undefined,
      401,
    );
  }

  let res: Response;
  try {
    res = await fetch(`${env.NEXT_PUBLIC_VOXA_API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refreshToken=${refreshToken}` },
      cache: 'no-store',
    });
  } catch {
    throw new VoxaNetworkError('Erro de rede ao renovar sessão.');
  }

  if (!res.ok) {
    throw new VoxaApiError(
      'Sessão expirada. Faça login novamente.',
      'UNAUTHORIZED',
      undefined,
      401,
    );
  }

  const body = (await res.json()) as { data?: { accessToken?: string } };
  const newToken = body.data?.accessToken;
  if (!newToken) {
    throw new VoxaApiError('Token inválido na renovação.', 'UNAUTHORIZED', undefined, 401);
  }

  // Atualizar o cookie (funciona em Server Actions, não em Server Components puros)
  try {
    cookieStore.set('accessToken', newToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutos
    });
  } catch {
    // Em Server Components read-only, ignorar — o middleware vai redirecionar na próxima requisição
  }

  return newToken;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

export async function voxaFetch<T>({
  endpoint,
  method = 'GET',
  body,
  schema,
  cache = 'no-store',
  tags,
}: VoxaFetchOptions<T>): Promise<T> {
  let accessToken = await getServerAccessToken();

  const doFetch = async (token: string | undefined): Promise<Response> => {
    try {
      return await fetch(`${env.NEXT_PUBLIC_VOXA_API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache,
        ...(tags ? { next: { tags } } : {}),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new VoxaNetworkError(`Falha na conexão com a API: ${msg}`);
    }
  };

  let response = await doFetch(accessToken);

  // Auto-refresh no 401
  if (response.status === 401) {
    accessToken = await refreshServerToken();
    response = await doFetch(accessToken);
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {};
    }
    const b = errorBody as Record<string, unknown>;
    throw new VoxaApiError(
      typeof b.error === 'string' ? b.error : 'Erro na API',
      typeof b.code === 'string' ? b.code : 'API_ERROR',
      Array.isArray(b.details)
        ? (b.details as Array<{ field: string; message: string }>)
        : undefined,
      response.status,
    );
  }

  const json = await response.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    // Em desenvolvimento, loga detalhes para depuração. Em produção, evita expor estrutura interna.
    if (env.NODE_ENV !== 'production') {
      console.error('[voxaFetch] Resposta inesperada da API:', parsed.error.format());
    } else {
      console.error('[voxaFetch] Resposta inesperada da API no endpoint:', endpoint);
    }
    throw new VoxaApiError('Resposta inesperada da API. Contate o suporte.', 'INVALID_RESPONSE');
  }

  return parsed.data;
}

// ─── Helpers convenientes ─────────────────────────────────────────────────────

export const voxaGet = <T>(endpoint: string, schema: z.ZodSchema<T>, tags?: string[]): Promise<T> =>
  voxaFetch({ endpoint, method: 'GET', schema, tags });

export const voxaPost = <T>(endpoint: string, body: unknown, schema: z.ZodSchema<T>): Promise<T> =>
  voxaFetch({ endpoint, method: 'POST', body, schema });

export const voxaPut = <T>(endpoint: string, body: unknown, schema: z.ZodSchema<T>): Promise<T> =>
  voxaFetch({ endpoint, method: 'PUT', body, schema });

export const voxaPatch = <T>(endpoint: string, body: unknown, schema: z.ZodSchema<T>): Promise<T> =>
  voxaFetch({ endpoint, method: 'PATCH', body, schema });

export const voxaDelete = <T>(endpoint: string, schema: z.ZodSchema<T>): Promise<T> =>
  voxaFetch({ endpoint, method: 'DELETE', schema });
