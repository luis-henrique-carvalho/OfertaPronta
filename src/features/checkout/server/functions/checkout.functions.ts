import { createServerFn } from "@tanstack/react-start";
import {
  initiateCheckoutSchema,
  orderIdSchema,
  updateOrderWhatsappSchema,
  type InitiateCheckoutInput,
  type OrderIdInput,
  type UpdateOrderWhatsappInput,
  type CheckoutDetailsResult,
  type CheckPaymentStatusResult,
} from "../../data/checkout.schemas";
import type { PixCheckoutService } from "../services/pix-checkout.service";

/**
 * Função executora pura para iniciar checkout.
 * Permite injeção de dependência em testes unitários e carregamento dinâmico em runtime.
 */
export async function executeInitiateCheckout(
  data: InitiateCheckoutInput,
  service?: PixCheckoutService,
): Promise<{ orderId: string }> {
  const s =
    service ??
    new (await import("../services/pix-checkout.service")).PixCheckoutService();
  return s.initiateCheckout(data);
}

/**
 * Função executora pura para recuperar detalhes do checkout.
 */
export async function executeGetOrderCheckoutDetails(
  data: OrderIdInput,
  service?: PixCheckoutService,
): Promise<CheckoutDetailsResult> {
  const s =
    service ??
    new (await import("../services/pix-checkout.service")).PixCheckoutService();
  return s.getCheckoutDetails(data.orderId);
}

/**
 * Função executora pura para consulta/polling de status do pagamento.
 */
export async function executeCheckPaymentStatus(
  data: OrderIdInput,
  service?: PixCheckoutService,
): Promise<CheckPaymentStatusResult> {
  const s =
    service ??
    new (await import("../services/pix-checkout.service")).PixCheckoutService();
  return s.checkPaymentStatus(data.orderId);
}

/**
 * Função executora pura para atualizar WhatsApp de resgate do pedido.
 */
export async function executeUpdateOrderWhatsapp(
  data: UpdateOrderWhatsappInput,
  service?: PixCheckoutService,
): Promise<{ success: boolean }> {
  const s =
    service ??
    new (await import("../services/pix-checkout.service")).PixCheckoutService();
  await s.updateCustomerWhatsapp(data.orderId, data.whatsapp);
  return { success: true };
}

/**
 * Função executora pura para reemissão de cobrança Pix expirada.
 */
export async function executeRegenerateExpiredCharge(
  data: OrderIdInput,
  service?: PixCheckoutService,
): Promise<CheckoutDetailsResult> {
  const s =
    service ??
    new (await import("../services/pix-checkout.service")).PixCheckoutService();
  return s.regenerateExpiredCharge(data.orderId);
}

/**
 * Server Function RPC: Inicia o checkout Pix para um rascunho com prévia gerada.
 * Congela o snapshot imutável, emite a cobrança na Pushin Pay e persiste Order e PaymentCharge.
 */
export const initiateCheckoutFn = createServerFn({ method: "POST" })
  .validator((input: unknown): InitiateCheckoutInput =>
    initiateCheckoutSchema.parse(input),
  )
  .handler(
    async ({
      data,
    }: {
      data: InitiateCheckoutInput;
    }): Promise<{ orderId: string }> => {
      return executeInitiateCheckout(data);
    },
  );

/**
 * Server Function RPC: Recupera os detalhes do checkout para renderização no frontend.
 */
export const getOrderCheckoutDetailsFn = createServerFn({ method: "GET" })
  .validator((input: unknown): OrderIdInput => orderIdSchema.parse(input))
  .handler(
    async ({
      data,
    }: {
      data: OrderIdInput;
    }): Promise<CheckoutDetailsResult> => {
      return executeGetOrderCheckoutDetails(data);
    },
  );

/**
 * Server Function RPC: Consulta o status do pagamento para polling em tempo real.
 */
export const checkPaymentStatusFn = createServerFn({ method: "GET" })
  .validator((input: unknown): OrderIdInput => orderIdSchema.parse(input))
  .handler(
    async ({
      data,
    }: {
      data: OrderIdInput;
    }): Promise<CheckPaymentStatusResult> => {
      return executeCheckPaymentStatus(data);
    },
  );

/**
 * Server Function RPC: Atualiza o WhatsApp de contato do cliente no pedido.
 */
export const updateOrderWhatsappFn = createServerFn({ method: "POST" })
  .validator((input: unknown): UpdateOrderWhatsappInput =>
    updateOrderWhatsappSchema.parse(input),
  )
  .handler(
    async ({
      data,
    }: {
      data: UpdateOrderWhatsappInput;
    }): Promise<{ success: boolean }> => {
      return executeUpdateOrderWhatsapp(data);
    },
  );

/**
 * Server Function RPC: Reemite cobrança Pix caso a anterior tenha expirado (>30 minutos).
 */
export const regenerateExpiredChargeFn = createServerFn({ method: "POST" })
  .validator((input: unknown): OrderIdInput => orderIdSchema.parse(input))
  .handler(
    async ({
      data,
    }: {
      data: OrderIdInput;
    }): Promise<CheckoutDetailsResult> => {
      return executeRegenerateExpiredCharge(data);
    },
  );
