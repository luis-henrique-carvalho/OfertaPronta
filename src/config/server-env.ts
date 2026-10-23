import { z } from "zod";

export const serverEnvSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .default("postgresql://postgres:postgres@localhost:5432/ofertapronta"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_URL: z.string().url().optional(),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_PROMPT_MODEL: z.string().min(1).default("gemini-3.8-flash"),
    GEMINI_IMAGE_MODEL: z.string().min(1).default("gemini-nano-banana-2.1"),
    GEMINI_DYNAMIC_PLANNER_ENABLED: z.coerce.boolean().default(true),
    PUSHIN_PAY_TOKEN: z.string().optional(),
    PUSHIN_PAY_BASE_URL: z
      .string()
      .url()
      .default("https://api.pushinpay.com.br"),
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
    STORAGE_DRIVER: z.enum(["memory", "r2"]).default("memory"),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    R2_PUBLIC_URL: z.string().optional(),
    FREE_PREVIEW_SECRET: z
      .string()
      .min(32, "FREE_PREVIEW_SECRET must have at least 32 characters")
      .default("dev-secret-free-preview-must-be-32-chars-minimum!"),
    FREE_PREVIEW_SECRET_PREVIOUS: z
      .string()
      .min(32, "FREE_PREVIEW_SECRET_PREVIOUS must have at least 32 characters")
      .optional(),
    FREE_PREVIEW_DAILY_BUDGET: z.coerce.number().int().positive().default(300),
    TRUSTED_PROXY: z.coerce.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (
      data.NODE_ENV === "production" &&
      data.FREE_PREVIEW_SECRET ===
        "dev-secret-free-preview-must-be-32-chars-minimum!"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["FREE_PREVIEW_SECRET"],
        message:
          "FREE_PREVIEW_SECRET must be explicitly configured in production with at least 32 characters",
      });
    }
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
