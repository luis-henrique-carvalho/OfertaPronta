import { z } from "zod";

export const downloadFormatEnum = z.enum(["feed", "story"]);
export type DownloadFormat = z.infer<typeof downloadFormatEnum>;

export const getOrderDeliveryDetailsInputSchema = z.object({
  orderId: z.string().uuid("ID de pedido inválido"),
});
export type GetOrderDeliveryDetailsInput = z.infer<
  typeof getOrderDeliveryDetailsInputSchema
>;

export const recordDownloadInputSchema = z.object({
  orderId: z.string().uuid("ID de pedido inválido"),
  format: downloadFormatEnum,
});
export type RecordDownloadInput = z.infer<typeof recordDownloadInputSchema>;

export const requestRegenerationInputSchema = z.object({
  orderId: z.string().uuid("ID de pedido inválido"),
  offerTitle: z
    .string()
    .min(2, "Título deve ter pelo menos 2 caracteres")
    .optional(),
  promoPrice: z.string().min(1, "Preço promocional é obrigatório").optional(),
  originalPrice: z.string().optional().nullable(),
  callToAction: z.string().optional().nullable(),
  stylePresetId: z.string().optional().nullable(),
  colorPalette: z.string().optional().nullable(),
  customAdjustmentPrompt: z
    .string()
    .max(500, "Instrução não pode exceder 500 caracteres")
    .optional()
    .nullable(),
});
export type RequestRegenerationInput = z.infer<
  typeof requestRegenerationInputSchema
>;

export const deliveryDetailsResultSchema = z.object({
  orderId: z.string().uuid(),
  status: z.literal("PAID"),
  offerTitle: z.string(),
  businessName: z.string(),
  businessSegment: z.string(),
  paidAt: z.string(), // ISO 8601
  regenerationWindowEndsAt: z.string(), // ISO 8601 (paidAt + 30 min)
  canRegenerate: z.boolean(),
  regenerationsUsed: z.number().int().min(0).max(3),
  maxRegenerations: z.number().int().default(3),
  remainingRegenerations: z.number().int().min(0).max(3),
  feedCardUrl: z.string(),
  storyCardUrl: z.string(),
  downloadCount: z.number().int().min(0),
  customerWhatsapp: z.string().optional().nullable(),
  permanentOrderUrl: z.string(),
  amountCents: z.number().int().optional(),
  frozenPlan: z
    .object({
      amountCents: z.number().int(),
    })
    .optional(),
});
export type DeliveryDetailsResult = z.infer<typeof deliveryDetailsResultSchema>;
