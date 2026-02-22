import { z } from 'zod';

export const UsageSchema = z.object({
  data: z.object({
    totalTranscriptions: z.number().int().nonnegative(),
    totalMinutes: z.number().nonnegative(),
    monthTranscriptions: z.number().int().nonnegative(),
    monthMinutes: z.number().nonnegative(),
    tier: z.string().nullable(),
    status: z.string().nullable(),
    trialEndsAt: z.string().nullable().optional(),
  }),
});

export type Usage = z.infer<typeof UsageSchema>['data'];
