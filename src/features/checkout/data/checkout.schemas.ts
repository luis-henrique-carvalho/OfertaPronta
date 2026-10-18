import { z } from "zod";
import { campaignPlanIdSchema } from "./campaign-catalog";

export const initiateCheckoutSchema = z.object({
  draftId: z.string().min(1, "draftId é obrigatório"),
  planId: campaignPlanIdSchema.optional(),
  customerWhatsapp: z.string().optional(),
  customerEmail: z.string().email("E-mail inválido").optional(),
});

export type InitiateCheckoutInput = z.infer<typeof initiateCheckoutSchema>;

export const orderIdSchema = z.object({
  orderId: z.string().uuid("orderId deve ser um UUID válido"),
});

export type OrderIdInput = z.infer<typeof orderIdSchema>;

export const updateOrderWhatsappSchema = z.object({
  orderId: z.string().uuid("orderId deve ser um UUID válido"),
  whatsapp: z.string().min(10, "Informe um número de WhatsApp válido com DDD"),
});

export type UpdateOrderWhatsappInput = z.infer<
  typeof updateOrderWhatsappSchema
>;

export const updateWhatsappSchema = updateOrderWhatsappSchema;
export type UpdateWhatsappInput = UpdateOrderWhatsappInput;

export const checkoutDetailsOutputSchema = z.object({
  orderId: z.string(),
  draftId: z.string(),
  status: z.enum(["PENDING", "PAID", "EXPIRED", "CANCELLED"]),
  amountCents: z.number().int(),
  customerWhatsapp: z.string().optional(),
  customerEmail: z.string().optional(),
  frozenSnapshot: z.record(
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
  charge: z
    .object({
      txId: z.string(),
      copiaECola: z.string(),
      qrCodeBase64: z.string(),
      expiresAt: z.string(), // ISO 8601
      status: z.string(),
    })
    .nullable(),
});

export type CheckoutDetailsResult = z.infer<typeof checkoutDetailsOutputSchema>;

export const checkPaymentStatusOutputSchema = z.object({
  status: z.string(),
  isPaid: z.boolean(),
});

export type CheckPaymentStatusResult = z.infer<
  typeof checkPaymentStatusOutputSchema
>;

export const pushinPayWebhookSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  status: z.string(),
  value: z.coerce.number().int(),
  paid_at: z.string().optional(),
});

export type PushinPayWebhookPayload = z.infer<typeof pushinPayWebhookSchema>;
