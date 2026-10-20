import { z } from 'zod';

export const SettingsSchema = z.object({
  enabled: z.boolean(),
  platforms: z.object({
    x: z.boolean(),
    youtube: z.boolean(),
  }),
  categories: z.object({
    ragebait: z.boolean(),
    inflammatory: z.boolean(),
    sensationalized: z.boolean(),
  }),
  threshold: z.number().min(0.7).max(0.95),
  animations: z.boolean(),
  debugMode: z.boolean().default(false),
  customRule: z.object({
    enabled: z.boolean(),
    instruction: z.string().trim().max(500),
  }).default({ enabled: false, instruction: '' }),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const defaultSettings: Settings = {
  enabled: true,
  platforms: {
    x: true,
    youtube: true,
  },
  categories: {
    ragebait: true,
    inflammatory: true,
    sensationalized: true,
  },
  threshold: 0.85,
  animations: true,
  debugMode: false,
  customRule: {
    enabled: false,
    instruction: '',
  },
};
