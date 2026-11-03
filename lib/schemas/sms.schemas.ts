import { z } from 'zod';

/**
 * Validates a user-authored rule before it is saved.
 *
 * The regex checks matter more than they look: an uncompilable pattern that
 * reaches SQLite would be re-thrown on every scan from then on, inside a loop
 * the user has no way to see. Catching it at save time is the only moment the
 * person who wrote it is still looking at it.
 */

function compiles(source: string): boolean {
  if (!source) return true; // empty means "use the generic fallback"
  try {
    new RegExp(source, 'i');
    return true;
  } catch {
    return false;
  }
}

const pattern = (field: string) =>
  z.string().refine(compiles, { message: `${field} isn’t a valid pattern` });

export const smsRuleFormSchema = z.object({
  label: z.string().trim().min(1, 'Give the rule a name'),
  senderPattern: z
    .string()
    .trim()
    .min(1, 'Add the sender this rule should match')
    .refine(compiles, { message: 'Sender isn’t a valid pattern' }),
  amountPattern: pattern('Amount'),
  excludePattern: pattern('Ignore if'),
  currency: z.string().trim().max(4),
  categoryId: z.string().nullable(),
  enabled: z.boolean(),
});

export type TSmsRuleForm = z.infer<typeof smsRuleFormSchema>;

/** Kept in sync with `TSmsUserRule` so a restored rule is validated like a typed one. */
export const smsUserRuleSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  senderPattern: z.string(),
  amountPattern: z.string().default(''),
  excludePattern: z.string().default(''),
  currency: z.string().default(''),
  categoryId: z.string().nullable().default(null),
  enabled: z.boolean().default(true),
  sortOrder: z.number().default(0),
});
