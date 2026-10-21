import { z } from "zod";

export const clientEnvSchema = z.object({
  VITE_PUBLIC_APP_NAME: z.string().min(1).default("OfertaPronta"),
  VITE_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  VITE_PUBLIC_LEGAL_NAME: z.string().optional(),
  VITE_PUBLIC_LEGAL_CNPJ: z.string().optional(),
  VITE_PUBLIC_CONTACT_EMAIL: z.string().email().optional(),
  VITE_PUBLIC_SUPPORT_WHATSAPP: z.string().optional(),
  VITE_PUBLIC_META_PIXEL_ID: z.string().optional(),
  VITE_PUBLIC_GOOGLE_ADS_ID: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function validateClientEnv(
  envSource?: Record<string, unknown>,
): ClientEnv {
  const source =
    envSource ??
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : {});
  const normalize = (val: unknown) =>
    typeof val === "string" && val.trim() === "" ? undefined : val;

  return clientEnvSchema.parse({
    VITE_PUBLIC_APP_NAME: normalize(source.VITE_PUBLIC_APP_NAME),
    VITE_PUBLIC_APP_URL: normalize(source.VITE_PUBLIC_APP_URL),
    VITE_PUBLIC_LEGAL_NAME: normalize(source.VITE_PUBLIC_LEGAL_NAME),
    VITE_PUBLIC_LEGAL_CNPJ: normalize(source.VITE_PUBLIC_LEGAL_CNPJ),
    VITE_PUBLIC_CONTACT_EMAIL: normalize(source.VITE_PUBLIC_CONTACT_EMAIL),
    VITE_PUBLIC_SUPPORT_WHATSAPP: normalize(
      source.VITE_PUBLIC_SUPPORT_WHATSAPP,
    ),
    VITE_PUBLIC_META_PIXEL_ID: normalize(source.VITE_PUBLIC_META_PIXEL_ID),
    VITE_PUBLIC_GOOGLE_ADS_ID: normalize(source.VITE_PUBLIC_GOOGLE_ADS_ID),
  });
}

export const clientEnv = validateClientEnv();
