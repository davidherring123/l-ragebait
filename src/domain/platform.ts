import { z } from 'zod';

export const PlatformSchema = z.enum(['x', 'youtube']);
export type Platform = z.infer<typeof PlatformSchema>;

export type ContentCandidate = Readonly<{
  element: HTMLElement;
  platform: Platform;
  text: string;
}>;
