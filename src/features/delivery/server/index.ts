/**
 * Ponto de entrada público do módulo Delivery Server.
 * Expõe exclusivamente Server Functions RPC, schemas e DTOs autorizados para consumo cliente.
 * Classes internas (DeliveryService, PostPaymentRegenerationService) e código com drivers Node.js
 * NUNCA devem ser exportados neste barrel para garantir isolamento estrito (Zero Server Code Leaks).
 */
export {
  getOrderDeliveryDetailsFn,
  recordCardDownloadFn,
  requestCardRegenerationFn,
} from "./functions/delivery.functions";

export {
  downloadFormatEnum,
  getOrderDeliveryDetailsInputSchema,
  recordDownloadInputSchema,
  requestRegenerationInputSchema,
  deliveryDetailsResultSchema,
} from "../data/delivery.schemas";

export type {
  DownloadFormat,
  GetOrderDeliveryDetailsInput,
  RecordDownloadInput,
  RequestRegenerationInput,
  DeliveryDetailsResult,
} from "../data/delivery.schemas";
