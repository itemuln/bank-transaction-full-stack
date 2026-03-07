// =============================================================================
// Environment Configuration — Validated with Zod
// =============================================================================

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(5),

  // CORS
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Transaction Limits
  LARGE_TRANSACTION_THRESHOLD: z.coerce.number().default(10000),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
