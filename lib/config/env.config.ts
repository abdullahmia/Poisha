import { z } from "zod";

const envSchema = z.object({
  googleWebClientId: z.string().min(1).optional(),
  googleIosClientId: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse({
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration:\n${parsed.error.toString()}`,
  );
}

export const env = parsed.data;
export const isBackupConfigured = env.googleWebClientId !== undefined;
