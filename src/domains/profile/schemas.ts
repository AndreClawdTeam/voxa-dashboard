import { z } from 'zod';

// GET /dashboard/profile returns user profile with optional subscription info.
// PATCH /dashboard/profile returns the updated user (with isActive, without subscription).
// We use a single schema with optional fields to handle both responses.
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['customer', 'admin']),
  isActive: z.boolean().optional(),
  createdAt: z.string(),
  subscription: z
    .object({
      id: z.string(),
      tier: z.string(),
      status: z.string(),
      trialEndsAt: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('E-mail inválido'),
});

export const ProfileResponseSchema = z.object({
  data: UserProfileSchema,
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
