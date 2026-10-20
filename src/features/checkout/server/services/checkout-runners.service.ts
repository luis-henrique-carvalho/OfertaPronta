import type {
  InitiateCheckoutInput,
  OrderIdInput,
  UpdateOrderWhatsappInput,
  UpdateOrderCobrandingInput,
  CheckoutDetailsResult,
  CheckPaymentStatusResult,
} from "../../data/checkout.schemas";
import { PixCheckoutService } from "./pix-checkout.service";

/**
 * Função executora pura para iniciar checkout.
 * Permite injeção de dependência em testes unitários.
 */
export async function executeInitiateCheckout(
  data: InitiateCheckoutInput,
  service?: PixCheckoutService,
): Promise<{ orderId: string }> {
  const s = service ?? new PixCheckoutService();
  return s.initiateCheckout(data);
}

/**
 * Função executora pura para recuperar detalhes do checkout.
 */
export async function executeGetOrderCheckoutDetails(
  data: OrderIdInput,
  service?: PixCheckoutService,
): Promise<CheckoutDetailsResult> {
  const s = service ?? new PixCheckoutService();
  return s.getCheckoutDetails(data.orderId);
}

/**
 * Função executora pura para consulta/polling de status do pagamento.
 */
export async function executeCheckPaymentStatus(
  data: OrderIdInput,
  service?: PixCheckoutService,
): Promise<CheckPaymentStatusResult> {
  const s = service ?? new PixCheckoutService();
  return s.checkPaymentStatus(data.orderId);
}

/**
 * Função executora pura para atualizar WhatsApp de resgate do pedido.
 */
export async function executeUpdateOrderWhatsapp(
  data: UpdateOrderWhatsappInput,
  service?: PixCheckoutService,
): Promise<{ success: boolean }> {
  const s = service ?? new PixCheckoutService();
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
  const s = service ?? new PixCheckoutService();
  return s.regenerateExpiredCharge(data.orderId);
}

/**
 * Função executora pura para simulação de pagamento Pix em desenvolvimento.
 */
export async function executeSimulateDevPayment(
  data: OrderIdInput,
  service?: PixCheckoutService,
): Promise<{ success: boolean; orderId: string }> {
  const s = service ?? new PixCheckoutService();
  return s.simulateDevPayment(data.orderId);
}

/**
 * Função executora pura para alternar o co-branding / desconto no pedido.
 */
export async function executeUpdateOrderCobranding(
  data: UpdateOrderCobrandingInput,
  service?: PixCheckoutService,
): Promise<CheckoutDetailsResult> {
  const s = service ?? new PixCheckoutService();
  return s.updateOrderCobranding(data.orderId, data.cobrandingAccepted);
}
