import { describe, it, expect, vi } from "vitest";
import {
  initiateCheckoutFn,
  getOrderCheckoutDetailsFn,
  checkPaymentStatusFn,
  updateOrderWhatsappFn,
  regenerateExpiredChargeFn,
  updateOrderCobrandingFn,
} from "./checkout.functions";
import {
  executeInitiateCheckout,
  executeGetOrderCheckoutDetails,
  executeCheckPaymentStatus,
  executeUpdateOrderWhatsapp,
  executeRegenerateExpiredCharge,
  executeUpdateOrderCobranding,
} from "../services/checkout-runners.service";
import {
  initiateCheckoutSchema,
  orderIdSchema,
  updateOrderWhatsappSchema,
  updateWhatsappSchema,
  updateOrderCobrandingSchema,
  checkoutDetailsOutputSchema,
  checkPaymentStatusOutputSchema,
  type CheckoutDetailsResult,
} from "../../data/checkout.schemas";
import type { PixCheckoutService } from "../services/pix-checkout.service";

describe("Checkout Server Functions (RPC & Server-Only Boundaries)", () => {
  describe("1. Schema Validations at Boundary", () => {
    describe("initiateCheckoutSchema", () => {
      it("valida payload mínimo com draftId", () => {
        const result = initiateCheckoutSchema.safeParse({
          draftId: "draft-xyz-123",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.draftId).toBe("draft-xyz-123");
          expect(result.data.customerWhatsapp).toBeUndefined();
        }
      });

      it("valida payload completo com whatsapp e e-mail", () => {
        const result = initiateCheckoutSchema.safeParse({
          draftId: "draft-xyz-123",
          customerWhatsapp: "11988887777",
          customerEmail: "cliente@exemplo.com",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.customerWhatsapp).toBe("11988887777");
          expect(result.data.customerEmail).toBe("cliente@exemplo.com");
        }
      });

      it("rejeita draftId ausente ou vazio", () => {
        const empty = initiateCheckoutSchema.safeParse({ draftId: "" });
        expect(empty.success).toBe(false);

        const missing = initiateCheckoutSchema.safeParse({});
        expect(missing.success).toBe(false);
      });

      it("rejeita e-mail malformado", () => {
        const invalid = initiateCheckoutSchema.safeParse({
          draftId: "draft-123",
          customerEmail: "email-invalido",
        });
        expect(invalid.success).toBe(false);
      });

      it("valida planId opcional ou válido pertencente ao catálogo", () => {
        const withoutPlan = initiateCheckoutSchema.safeParse({
          draftId: "draft-xyz-123",
        });
        expect(withoutPlan.success).toBe(true);

        const withSingle = initiateCheckoutSchema.safeParse({
          draftId: "draft-xyz-123",
          planId: "single_campaign",
        });
        expect(withSingle.success).toBe(true);
        if (withSingle.success) {
          expect(withSingle.data.planId).toBe("single_campaign");
        }

        const withPack5 = initiateCheckoutSchema.safeParse({
          draftId: "draft-xyz-123",
          planId: "pack_5_campaigns",
        });
        expect(withPack5.success).toBe(true);

        const withPack10 = initiateCheckoutSchema.safeParse({
          draftId: "draft-xyz-123",
          planId: "pack_10_campaigns",
        });
        expect(withPack10.success).toBe(true);
      });

      it("rejeita planId desconhecido ou inválido", () => {
        const invalidPlan = initiateCheckoutSchema.safeParse({
          draftId: "draft-123",
          planId: "invalid_plan_id",
        });
        expect(invalidPlan.success).toBe(false);
      });
    });

    describe("orderIdSchema", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";

      it("aceita UUID v4 válido", () => {
        const result = orderIdSchema.safeParse({ orderId: validUuid });
        expect(result.success).toBe(true);
      });

      it("rejeita strings que não sejam UUIDs", () => {
        const notUuid = orderIdSchema.safeParse({ orderId: "order-12345" });
        expect(notUuid.success).toBe(false);

        const empty = orderIdSchema.safeParse({ orderId: "" });
        expect(empty.success).toBe(false);
      });
    });

    describe("updateOrderWhatsappSchema e updateWhatsappSchema", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";

      it("aceita orderId válido e whatsapp com DDD (>= 10 dígitos)", () => {
        const result = updateOrderWhatsappSchema.safeParse({
          orderId: validUuid,
          whatsapp: "11999998888",
        });
        expect(result.success).toBe(true);

        const aliasResult = updateWhatsappSchema.safeParse({
          orderId: validUuid,
          whatsapp: "11999998888",
        });
        expect(aliasResult.success).toBe(true);
      });

      it("rejeita telefone com menos de 10 caracteres", () => {
        const invalid = updateOrderWhatsappSchema.safeParse({
          orderId: validUuid,
          whatsapp: "123456789",
        });
        expect(invalid.success).toBe(false);
      });

      it("rejeita orderId inválido", () => {
        const invalid = updateOrderWhatsappSchema.safeParse({
          orderId: "not-a-uuid",
          whatsapp: "11999998888",
        });
        expect(invalid.success).toBe(false);
      });
    });

    describe("updateOrderCobrandingSchema", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";

      it("aceita orderId UUID válido e cobrandingAccepted booleano", () => {
        const resTrue = updateOrderCobrandingSchema.safeParse({
          orderId: validUuid,
          cobrandingAccepted: true,
        });
        expect(resTrue.success).toBe(true);

        const resFalse = updateOrderCobrandingSchema.safeParse({
          orderId: validUuid,
          cobrandingAccepted: false,
        });
        expect(resFalse.success).toBe(true);
      });

      it("rejeita orderId que não seja UUID ou ausente", () => {
        const notUuid = updateOrderCobrandingSchema.safeParse({
          orderId: "invalid-uuid",
          cobrandingAccepted: true,
        });
        expect(notUuid.success).toBe(false);

        const missing = updateOrderCobrandingSchema.safeParse({
          cobrandingAccepted: true,
        });
        expect(missing.success).toBe(false);
      });

      it("rejeita cobrandingAccepted que não seja booleano", () => {
        const invalidType = updateOrderCobrandingSchema.safeParse({
          orderId: validUuid,
          cobrandingAccepted: "true",
        });
        expect(invalidType.success).toBe(false);
      });
    });

    describe("checkoutDetailsOutputSchema", () => {
      it("valida objeto DTO completo de retorno do checkout", () => {
        const sample: CheckoutDetailsResult = {
          orderId: "123e4567-e89b-12d3-a456-426614174000",
          draftId: "draft-123",
          status: "PENDING",
          amountCents: 990,
          originalAmountCents: 990,
          cobrandingAccepted: false,
          cobrandingPromotionAvailable: true,
          cobrandingCreditText: undefined,
          cobrandingDiscountPercent: 30,
          customerWhatsapp: "11999998888",
          customerEmail: "user@example.com",
          frozenSnapshot: { title: "Promoção de Teste" },
          charge: {
            txId: "tx-pushin-123",
            copiaECola: "00020126580014br.gov.bcb.pix...",
            qrCodeBase64: "data:image/png;base64,sampleBase64",
            expiresAt: new Date().toISOString(),
            status: "PENDING",
          },
        };

        const result = checkoutDetailsOutputSchema.safeParse(sample);
        expect(result.success).toBe(true);
      });
    });

    describe("checkPaymentStatusOutputSchema", () => {
      it("valida retorno de status de pagamento", () => {
        const result = checkPaymentStatusOutputSchema.safeParse({
          status: "PAID",
          isPaid: true,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("2. Server Function RPC Contracts & HTTP Methods", () => {
    it("initiateCheckoutFn deve ser POST", () => {
      expect(initiateCheckoutFn).toBeDefined();
      expect(typeof initiateCheckoutFn).toBe("function");
      expect(initiateCheckoutFn.method).toBe("POST");
    });

    it("getOrderCheckoutDetailsFn deve ser GET", () => {
      expect(getOrderCheckoutDetailsFn).toBeDefined();
      expect(typeof getOrderCheckoutDetailsFn).toBe("function");
      expect(getOrderCheckoutDetailsFn.method).toBe("GET");
    });

    it("checkPaymentStatusFn deve ser GET", () => {
      expect(checkPaymentStatusFn).toBeDefined();
      expect(typeof checkPaymentStatusFn).toBe("function");
      expect(checkPaymentStatusFn.method).toBe("GET");
    });

    it("updateOrderWhatsappFn deve ser POST", () => {
      expect(updateOrderWhatsappFn).toBeDefined();
      expect(typeof updateOrderWhatsappFn).toBe("function");
      expect(updateOrderWhatsappFn.method).toBe("POST");
    });

    it("regenerateExpiredChargeFn deve ser POST", () => {
      expect(regenerateExpiredChargeFn).toBeDefined();
      expect(typeof regenerateExpiredChargeFn).toBe("function");
      expect(regenerateExpiredChargeFn.method).toBe("POST");
    });

    it("updateOrderCobrandingFn deve ser POST", () => {
      expect(updateOrderCobrandingFn).toBeDefined();
      expect(typeof updateOrderCobrandingFn).toBe("function");
      expect(updateOrderCobrandingFn.method).toBe("POST");
    });
  });

  describe("3. Execution Handlers & Service Delegation", () => {
    const validOrderId = "123e4567-e89b-12d3-a456-426614174000";

    it("executeInitiateCheckout delega para service.initiateCheckout e retorna { orderId }", async () => {
      const mockService = {
        initiateCheckout: vi.fn().mockResolvedValue({ orderId: validOrderId }),
      } as unknown as PixCheckoutService;

      const input = {
        draftId: "draft-abc-123",
        customerWhatsapp: "11988887777",
      };

      const result = await executeInitiateCheckout(input, mockService);

      expect(mockService.initiateCheckout).toHaveBeenCalledWith(input);
      expect(result).toEqual({ orderId: validOrderId });
    });

    it("executeGetOrderCheckoutDetails delega para service.getCheckoutDetails e retorna dados completos", async () => {
      const sampleDetails: CheckoutDetailsResult = {
        orderId: validOrderId,
        draftId: "draft-abc-123",
        status: "PENDING",
        amountCents: 990,
        cobrandingAccepted: false,
        cobrandingPromotionAvailable: true,
        cobrandingDiscountPercent: 30,
        customerWhatsapp: "11988887777",
        customerEmail: undefined,
        frozenSnapshot: { title: "Pizza" },
        charge: {
          txId: "tx-123",
          copiaECola: "pix-code",
          qrCodeBase64: "qr-base64",
          expiresAt: "2026-10-16T21:00:00.000Z",
          status: "PENDING",
        },
      };

      const mockService = {
        getCheckoutDetails: vi.fn().mockResolvedValue(sampleDetails),
      } as unknown as PixCheckoutService;

      const result = await executeGetOrderCheckoutDetails(
        { orderId: validOrderId },
        mockService,
      );

      expect(mockService.getCheckoutDetails).toHaveBeenCalledWith(validOrderId);
      expect(result).toEqual(sampleDetails);
    });

    it("executeCheckPaymentStatus delega para service.checkPaymentStatus e retorna { status, isPaid }", async () => {
      const mockService = {
        checkPaymentStatus: vi
          .fn()
          .mockResolvedValue({ status: "PAID", isPaid: true }),
      } as unknown as PixCheckoutService;

      const result = await executeCheckPaymentStatus(
        { orderId: validOrderId },
        mockService,
      );

      expect(mockService.checkPaymentStatus).toHaveBeenCalledWith(validOrderId);
      expect(result).toEqual({ status: "PAID", isPaid: true });
    });

    it("executeUpdateOrderWhatsapp delega para service.updateCustomerWhatsapp e retorna { success: true }", async () => {
      const mockService = {
        updateCustomerWhatsapp: vi.fn().mockResolvedValue(undefined),
      } as unknown as PixCheckoutService;

      const input = {
        orderId: validOrderId,
        whatsapp: "11999998888",
      };

      const result = await executeUpdateOrderWhatsapp(input, mockService);

      expect(mockService.updateCustomerWhatsapp).toHaveBeenCalledWith(
        validOrderId,
        "11999998888",
      );
      expect(result).toEqual({ success: true });
    });

    it("executeRegenerateExpiredCharge delega para service.regenerateExpiredCharge e retorna nova cobrança", async () => {
      const sampleRegenerated: CheckoutDetailsResult = {
        orderId: validOrderId,
        draftId: "draft-abc-123",
        status: "PENDING",
        amountCents: 990,
        cobrandingAccepted: false,
        cobrandingPromotionAvailable: true,
        cobrandingDiscountPercent: 30,
        customerWhatsapp: "11988887777",
        customerEmail: undefined,
        frozenSnapshot: { title: "Pizza" },
        charge: {
          txId: "new-tx-456",
          copiaECola: "new-pix-code",
          qrCodeBase64: "new-qr-base64",
          expiresAt: "2026-10-16T21:30:00.000Z",
          status: "PENDING",
        },
      };

      const mockService = {
        regenerateExpiredCharge: vi.fn().mockResolvedValue(sampleRegenerated),
      } as unknown as PixCheckoutService;

      const result = await executeRegenerateExpiredCharge(
        { orderId: validOrderId },
        mockService,
      );

      expect(mockService.regenerateExpiredCharge).toHaveBeenCalledWith(
        validOrderId,
      );
      expect(result).toEqual(sampleRegenerated);
    });

    it("executeUpdateOrderCobranding delega para service.updateOrderCobranding e retorna detalhes atualizados", async () => {
      const sampleResult: CheckoutDetailsResult = {
        orderId: validOrderId,
        draftId: "draft-abc-123",
        status: "PENDING",
        amountCents: 693,
        originalAmountCents: 990,
        cobrandingAccepted: true,
        cobrandingPromotionAvailable: true,
        cobrandingCreditText: "Design por @ofertapronta",
        cobrandingDiscountPercent: 30,
        frozenSnapshot: { title: "Pizza" },
        charge: null,
      };

      const mockService = {
        updateOrderCobranding: vi.fn().mockResolvedValue(sampleResult),
      } as unknown as PixCheckoutService;

      const result = await executeUpdateOrderCobranding(
        { orderId: validOrderId, cobrandingAccepted: true },
        mockService,
      );

      expect(mockService.updateOrderCobranding).toHaveBeenCalledWith(
        validOrderId,
        true,
      );
      expect(result).toEqual(sampleResult);
    });

    it("propaga erros lançados pelo PixCheckoutService", async () => {
      const mockService = {
        initiateCheckout: vi
          .fn()
          .mockRejectedValue(new Error("Rascunho não encontrado")),
      } as unknown as PixCheckoutService;

      await expect(
        executeInitiateCheckout({ draftId: "nao-existe" }, mockService),
      ).rejects.toThrow("Rascunho não encontrado");
    });
  });
});
