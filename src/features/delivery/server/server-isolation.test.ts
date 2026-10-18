import { describe, it, expect } from "vitest";
import * as deliveryServerModule from "./index";

describe("Delivery Server Isolation (Zero Server Code Leaks)", () => {
  it("exporta exclusivamente Server Functions RPC, schemas e DTOs permitidos", () => {
    const exportedKeys = Object.keys(deliveryServerModule);

    // As únicas funções/objetos de runtime exportadas pelo barrel devem ser Server Functions e schemas Zod
    const allowedExports = [
      "getOrderDeliveryDetailsFn",
      "recordCardDownloadFn",
      "requestCardRegenerationFn",
      "downloadFormatEnum",
      "getOrderDeliveryDetailsInputSchema",
      "recordDownloadInputSchema",
      "requestRegenerationInputSchema",
      "deliveryDetailsResultSchema",
    ];

    expect(exportedKeys.sort()).toEqual(allowedExports.sort());
  });

  it("não re-exporta serviços internos ou dependências Node.js (drizzle-orm, pg, sharp, genai)", () => {
    const record = deliveryServerModule as Record<string, unknown>;

    // Invariante estrita: serviços com conexões e segredos de backend nunca devem vazar para o cliente
    expect(record.DeliveryService).toBeUndefined();
    expect(record.DeliveryError).toBeUndefined();
    expect(record.PostPaymentRegenerationService).toBeUndefined();
    expect(record.executeGetOrderDeliveryDetails).toBeUndefined();
    expect(record.executeRecordCardDownload).toBeUndefined();
    expect(record.executeRequestCardRegeneration).toBeUndefined();
  });
});
