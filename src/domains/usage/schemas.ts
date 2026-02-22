import { z } from 'zod';

export const UsageSchema = z.object({
  data: z.object({
    transcriptionsCount: z.number().int().nonnegative(),
    totalAudioDurationSeconds: z.number().nonnegative(),
    totalProcessingTimeMs: z.number().nonnegative(),
    period: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
});

export type Usage = z.infer<typeof UsageSchema>['data'];
