import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
});

// UserSchema: used as a base type. isActive is optional because some endpoints
// (e.g. login, register) do not return it; it is only present in admin/profile responses.
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['customer', 'admin']),
  isActive: z.boolean().optional(),
  createdAt: z.string(),
});

// POST /auth/login → only returns accessToken (no user — by design)
export const LoginResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
  }),
});

// POST /auth/register → returns user (without isActive) + accessToken
export const RegisterUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['customer', 'admin']),
  createdAt: z.string(),
});

export const RegisterResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    user: RegisterUserSchema,
  }),
});

// Kept for backward compatibility
export const AuthResponseSchema = RegisterResponseSchema;

export const RefreshResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
  }),
});

// GET /auth/me → returns only JWT payload (userId + role), not full user profile.
// Use /dashboard/profile to get full user data (name, email, etc).
export const MeResponseSchema = z.object({
  data: z.object({
    userId: z.string().uuid(),
    role: z.string(),
  }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type User = z.infer<typeof UserSchema>;
export type RegisterUser = z.infer<typeof RegisterUserSchema>;
export type AuthResponse = z.infer<typeof RegisterResponseSchema>;
