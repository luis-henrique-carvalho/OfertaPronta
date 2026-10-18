import { createServerFn } from "@tanstack/react-start";
import {
  getOrderDeliveryDetailsInputSchema,
  recordDownloadInputSchema,
  requestRegenerationInputSchema,
  type GetOrderDeliveryDetailsInput,
  type RecordDownloadInput,
  type RequestRegenerationInput,
  type DeliveryDetailsResult,
} from "../../data/delivery.schemas";
import {
  executeGetOrderDeliveryDetails,
  executeRecordCardDownload,
  executeRequestCardRegeneration,
} from "../services/delivery-runners.service";

/**
 * Server Function RPC: Recupera os detalhes da entrega sem marca d'água e URLs de download.
 * Exclusivo para pedidos com pagamento confirmado (PAID).
 */
export const getOrderDeliveryDetailsFn = createServerFn({ method: "GET" })
  .validator((input: unknown): GetOrderDeliveryDetailsInput =>
    getOrderDeliveryDetailsInputSchema.parse(input),
  )
  .handler(async ({ data }): Promise<DeliveryDetailsResult> => {
    return executeGetOrderDeliveryDetails(data);
  });

/**
 * Server Function RPC: Registra incremento na métrica de downloads de alta resolução.
 */
export const recordCardDownloadFn = createServerFn({ method: "POST" })
  .validator((input: unknown): RecordDownloadInput =>
    recordDownloadInputSchema.parse(input),
  )
  .handler(
    async ({ data }): Promise<{ success: boolean; downloadCount: number }> => {
      return executeRecordCardDownload(data);
    },
  );

/**
 * Server Function RPC: Solicita ajuste e regeneração do card por IA pós-pagamento.
 * Valida cota (máx 3) e janela de 30 minutos pós-pagamento.
 */
export const requestCardRegenerationFn = createServerFn({ method: "POST" })
  .validator((input: unknown): RequestRegenerationInput =>
    requestRegenerationInputSchema.parse(input),
  )
  .handler(async ({ data }): Promise<DeliveryDetailsResult> => {
    return executeRequestCardRegeneration(data);
  });
