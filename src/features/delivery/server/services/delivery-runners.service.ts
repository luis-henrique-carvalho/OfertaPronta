import type {
  GetOrderDeliveryDetailsInput,
  RecordDownloadInput,
  RequestRegenerationInput,
  DeliveryDetailsResult,
} from "../../data/delivery.schemas";
import { DeliveryService } from "./delivery.service";
import { PostPaymentRegenerationService } from "./post-payment-regeneration.service";

/**
 * Função executora pura para carregar detalhes da entrega do pedido.
 * Permite injeção de dependência em testes unitários.
 */
export async function executeGetOrderDeliveryDetails(
  data: GetOrderDeliveryDetailsInput,
  service?: DeliveryService,
): Promise<DeliveryDetailsResult> {
  const s = service ?? new DeliveryService();
  return s.getDeliveryDetails(data.orderId);
}

/**
 * Função executora pura para registrar download de card em alta resolução.
 */
export async function executeRecordCardDownload(
  data: RecordDownloadInput,
  service?: DeliveryService,
): Promise<{ success: boolean; downloadCount: number }> {
  const s = service ?? new DeliveryService();
  return s.recordDownload(data.orderId, data.format);
}

/**
 * Função executora pura para solicitar regeneração de card por IA pós-pagamento.
 */
export async function executeRequestCardRegeneration(
  data: RequestRegenerationInput,
  service?: PostPaymentRegenerationService,
): Promise<DeliveryDetailsResult> {
  const s = service ?? new PostPaymentRegenerationService();
  return s.regenerateOrderCard(data);
}
