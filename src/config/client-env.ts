import { z } from "zod";

const clientEnvSchema = z.object({
  VITE_PUBLIC_APP_NAME: z.string().min(1).default("OfertaPronta"),
  VITE_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function validateClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    VITE_PUBLIC_APP_NAME: import.meta.env.VITE_PUBLIC_APP_NAME,
    VITE_PUBLIC_APP_URL: import.meta.env.VITE_PUBLIC_APP_URL,
  });
}

export const clientEnv = validateClientEnv();
