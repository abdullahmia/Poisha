import { z } from 'zod';

const envSchema = z.object({});

const parsed = envSchema.safeParse({});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${parsed.error.toString()}`);
}

export const env = parsed.data;
