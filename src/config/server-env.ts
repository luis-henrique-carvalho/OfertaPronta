import { z } from "zod";

export const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default("postgresql://postgres:postgres@localhost:5432/ofertapronta"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  GEMINI_API_KEY: z.string().optional(),
  PUSHIN_PAY_TOKEN: z.string().optional(),
  PUSHIN_PAY_BASE_URL: z.string().url().default("https://api.pushinpay.com.br"),
  PUSHIN_PAY_WEBHOOK_URL: z.string().url().optional(),
  PUSHIN_PAY_WEBHOOK_SECRET: z.string().optional(),
  CAMPAIGN_SINGLE_PRICE_CENTS: z.coerce.number().int().positive().optional(),
  DEV_BYPASS_PAYMENT: z.coerce.boolean().default(false),
  COBRANDING_PROMOTION_ENABLED: z.coerce.boolean().default(true),
  COBRANDING_CREDIT_TEXT: z.string().default("Design por @ofertapronta"),
  COBRANDING_DISCOUNT_PERCENT: z.coerce
    .number()
    .int()
    .min(1)
    .max(90)
    .default(30),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  env: Record<string, unknown> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(
      `Invalid server environment variables: ${JSON.stringify(formatted)}`,
    );
  }
  return result.data;
}

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // .env.local é opcional (CI/Produção injeta direto via process.env)
  }
  try {
    process.loadEnvFile(".env");
  } catch {
    // .env é opcional
  }
}

export const serverEnv = parseServerEnv(process.env);
