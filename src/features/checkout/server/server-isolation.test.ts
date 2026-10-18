import { describe, it, expect } from "vitest";
import * as checkoutServerModule from "./index";

describe("Checkout Server Isolation (Zero Server Code Leaks)", () => {
  it("exporta exclusivamente Server Functions RPC, schemas e DTOs permitidos", () => {
    const exportedKeys = Object.keys(checkoutServerModule);

    // As únicas funções/objetos de runtime exportadas pelo barrel devem ser Server Functions e schemas Zod
    const allowedExports = [
      "initiateCheckoutFn",
      "getOrderCheckoutDetailsFn",
      "checkPaymentStatusFn",
      "updateOrderWhatsappFn",
      "regenerateExpiredChargeFn",
      "simulateDevPaymentFn",
      "initiateCheckoutSchema",
      "orderIdSchema",
      "updateOrderWhatsappSchema",
      "updateWhatsappSchema",
      "checkoutDetailsOutputSchema",
      "checkPaymentStatusOutputSchema",
    ];

    expect(exportedKeys.sort()).toEqual(allowedExports.sort());
  });

  it("não re-exporta serviços internos ou dependências Node.js (drizzle-orm, pg, fetch)", () => {
    const record = checkoutServerModule as Record<string, unknown>;

    // Invariante estrita: serviços com conexões e segredos de backend nunca devem vazar para o cliente
    expect(record.PixCheckoutService).toBeUndefined();
    expect(record.PushinPayService).toBeUndefined();
    expect(record.PushinPayError).toBeUndefined();
    expect(record.executeInitiateCheckout).toBeUndefined();
    expect(record.executeGetOrderCheckoutDetails).toBeUndefined();
    expect(record.executeCheckPaymentStatus).toBeUndefined();
    expect(record.executeUpdateOrderWhatsapp).toBeUndefined();
    expect(record.executeRegenerateExpiredCharge).toBeUndefined();
  });
});
