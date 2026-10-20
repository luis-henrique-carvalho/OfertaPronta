/**
 * Ponto de entrada público do módulo Checkout Server.
 * Expõe exclusivamente Server Functions RPC e schemas/DTOs autorizados para consumo cliente.
 * Classes internas (PixCheckoutService, PushinPayService) e código com drivers Node.js
 * NUNCA devem ser exportados neste barrel para garantir isolamento estrito (Zero Server Code Leaks).
 */
export {
  initiateCheckoutFn,
  getOrderCheckoutDetailsFn,
  checkPaymentStatusFn,
  updateOrderWhatsappFn,
  regenerateExpiredChargeFn,
  simulateDevPaymentFn,
  updateOrderCobrandingFn,
} from "./functions/checkout.functions";

export {
  initiateCheckoutSchema,
  orderIdSchema,
  updateOrderWhatsappSchema,
  updateWhatsappSchema,
  updateOrderCobrandingSchema,
  checkoutDetailsOutputSchema,
  checkPaymentStatusOutputSchema,
} from "../data/checkout.schemas";

export type {
  InitiateCheckoutInput,
  OrderIdInput,
  UpdateOrderWhatsappInput,
  UpdateWhatsappInput,
  UpdateOrderCobrandingInput,
  CheckoutDetailsResult,
  CheckPaymentStatusResult,
} from "../data/checkout.schemas";
