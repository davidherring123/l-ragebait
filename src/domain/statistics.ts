import { z } from 'zod';

export const StatisticsSchema = z.object({
  session: z.number().int().nonnegative(),
  lifetime: z.number().int().nonnegative(),
});

export type Statistics = z.infer<typeof StatisticsSchema>;

export const emptyStatistics: Statistics = { session: 0, lifetime: 0 };
