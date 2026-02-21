import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_VOXA_API_URL: z.string().url('NEXT_PUBLIC_VOXA_API_URL deve ser uma URL válida'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL deve ser uma URL válida').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_VOXA_API_URL: process.env.NEXT_PUBLIC_VOXA_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success && process.env.NODE_ENV !== 'test') {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.format());
  // Em produção, falha hard. Em dev, apenas avisa.
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_VOXA_API_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
      NODE_ENV: 'development' as const,
    };
