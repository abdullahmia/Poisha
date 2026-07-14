import { z } from 'zod';

export const entryFormSchema = z.object({
  date: z.string().min(1),
  amounts: z.array(z.object({ value: z.string() })).min(1),
  note: z.string(),
});

export type TEntryFormData = z.infer<typeof entryFormSchema>;
