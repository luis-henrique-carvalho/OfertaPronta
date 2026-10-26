import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import {
  initiateCheckoutSchema,
  orderIdSchema,
  updateOrderWhatsappSchema,
  updateOrderCobrandingSchema,
  type InitiateCheckoutInput,
  type OrderIdInput,
  type UpdateOrderWhatsappInput,
  type UpdateOrderCobrandingInput,
  type CheckoutDetailsResult,
  type CheckPaymentStatusResult,
} from "../../data/checkout.schemas";
import {
  executeInitiateCheckout,
  executeGetOrderCheckoutDetails,
  executeCheckPaymentStatus,
  executeUpdateOrderWhatsapp,
  executeRegenerateExpiredCharge,
  executeSimulateDevPayment,
  executeUpdateOrderCobranding,
} from "../services/checkout-runners.service";
import { resolveVisitorIdentity } from "../../../promotions/server/services/visitor-identity";
import { serverEnv } from "../../../../config/server-env";

function getRequestContextSafe(): { headers: Headers } {
  try {
    const headers = getRequestHeaders();
    return { headers };
  } catch {
    return { headers: new Headers() };
  }
}

/**
 * Server Function RPC: Inicia o checkout Pix para um rascunho com prévia gerada.
 * Congela o snapshot imutável, emite a cobrança na Pushin Pay e persiste Order e PaymentCharge.
 */
export const initiateCheckoutFn = createServerFn({ method: "POST" })
  .validator((input: unknown): InitiateCheckoutInput =>
    initiateCheckoutSchema.parse(input),
  )
  .handler(async ({ data }): Promise<{ orderId: string }> => {
    let visitorId = data.visitorId;
    if (!visitorId) {
      try {
        const { headers } = getRequestContextSafe();
        if (serverEnv.FREE_PREVIEW_SECRET) {
          const identity = resolveVisitorIdentity({
            headers,
            secret: serverEnv.FREE_PREVIEW_SECRET,
            previousSecret: serverEnv.FREE_PREVIEW_SECRET_PREVIOUS,
            trustedProxy: serverEnv.TRUSTED_PROXY,
          });
          visitorId = identity.visitorId;
        }
      } catch {
        // Fallback silencioso caso headers não estejam disponíveis
      }
    }
    return executeInitiateCheckout({ ...data, visitorId });
  });

/**
 * Server Function RPC: Recupera os dados completos para exibição na tela de checkout.
 */
export const getOrderCheckoutDetailsFn = createServerFn({ method: "GET" })
  .validator((input: unknown): OrderIdInput => orderIdSchema.parse(input))
  .handler(async ({ data }): Promise<CheckoutDetailsResult> => {
    return executeGetOrderCheckoutDetails(data);
  });

/**
 * Server Function RPC: Consulta/polling atômico do status de pagamento de um pedido.
 */
export const checkPaymentStatusFn = createServerFn({ method: "GET" })
  .validator((input: unknown): OrderIdInput => orderIdSchema.parse(input))
  .handler(async ({ data }): Promise<CheckPaymentStatusResult> => {
    return executeCheckPaymentStatus(data);
  });

/**
 * Server Function RPC: Atualiza o número de WhatsApp do cliente para recuperação de pedido.
 */
export const updateOrderWhatsappFn = createServerFn({ method: "POST" })
  .validator((input: unknown): UpdateOrderWhatsappInput =>
    updateOrderWhatsappSchema.parse(input),
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    return executeUpdateOrderWhatsapp(data);
  });

/**
 * Server Function RPC: Gera uma nova cobrança Pix para um pedido cuja cobrança anterior expirou.
 */
export const regenerateExpiredChargeFn = createServerFn({ method: "POST" })
  .validator((input: unknown): OrderIdInput => orderIdSchema.parse(input))
  .handler(async ({ data }): Promise<CheckoutDetailsResult> => {
    return executeRegenerateExpiredCharge(data);
  });

/**
 * Server Function RPC: Simula confirmação imediata de pagamento em ambiente de desenvolvimento.
 */
export const simulateDevPaymentFn = createServerFn({ method: "POST" })
  .validator((input: unknown): OrderIdInput => orderIdSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean; orderId: string }> => {
    return executeSimulateDevPayment(data);
  });

/**
 * Server Function RPC: Alterna a opção de co-branding / desconto no pedido.
 */
export const updateOrderCobrandingFn = createServerFn({ method: "POST" })
  .validator((input: unknown): UpdateOrderCobrandingInput =>
    updateOrderCobrandingSchema.parse(input),
  )
  .handler(async ({ data }): Promise<CheckoutDetailsResult> => {
    return executeUpdateOrderCobranding(data);
  });
