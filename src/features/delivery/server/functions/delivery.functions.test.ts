import { describe, it, expect, vi } from "vitest";
import {
  getOrderDeliveryDetailsFn,
  recordCardDownloadFn,
  requestCardRegenerationFn,
} from "./delivery.functions";
import {
  executeGetOrderDeliveryDetails,
  executeRecordCardDownload,
  executeRequestCardRegeneration,
} from "../services/delivery-runners.service";
import {
  getOrderDeliveryDetailsInputSchema,
  recordDownloadInputSchema,
  requestRegenerationInputSchema,
  deliveryDetailsResultSchema,
  type DeliveryDetailsResult,
} from "../../data/delivery.schemas";
import type { DeliveryService } from "../services/delivery.service";
import type { PostPaymentRegenerationService } from "../services/post-payment-regeneration.service";

describe("Delivery Server Functions & Runners (RPC Boundaries)", () => {
  const validOrderId = "123e4567-e89b-12d3-a456-426614174000";

  const sampleDeliveryDetails: DeliveryDetailsResult = {
    orderId: validOrderId,
    status: "PAID",
    offerTitle: "Hambúrguer Artesanal",
    businessName: "Burger House",
    businessSegment: "burger-shop",
    paidAt: "2026-10-18T12:00:00.000Z",
    regenerationWindowEndsAt: "2026-10-18T12:30:00.000Z",
    canRegenerate: true,
    regenerationsUsed: 0,
    maxRegenerations: 3,
    remainingRegenerations: 3,
    feedCardUrl: "data:image/png;base64,feed",
    storyCardUrl: "data:image/png;base64,story",
    downloadCount: 0,
    customerWhatsapp: "11999998888",
    permanentOrderUrl: `/pedido/${validOrderId}`,
  };

  describe("1. Schema Validations at Boundary", () => {
    describe("getOrderDeliveryDetailsInputSchema", () => {
      it("valida payload correto com orderId UUID válido", () => {
        const result = getOrderDeliveryDetailsInputSchema.safeParse({
          orderId: validOrderId,
        });
        expect(result.success).toBe(true);
      });

      it("rejeita orderId inválido ou ausente", () => {
        const invalid = getOrderDeliveryDetailsInputSchema.safeParse({
          orderId: "not-a-uuid",
        });
        expect(invalid.success).toBe(false);

        const empty = getOrderDeliveryDetailsInputSchema.safeParse({});
        expect(empty.success).toBe(false);
      });
    });

    describe("recordDownloadInputSchema", () => {
      it("valida formatos aceitos (feed e story)", () => {
        const feed = recordDownloadInputSchema.safeParse({
          orderId: validOrderId,
          format: "feed",
        });
        expect(feed.success).toBe(true);

        const story = recordDownloadInputSchema.safeParse({
          orderId: validOrderId,
          format: "story",
        });
        expect(story.success).toBe(true);
      });

      it("rejeita formato inválido", () => {
        const invalid = recordDownloadInputSchema.safeParse({
          orderId: validOrderId,
          format: "banner",
        });
        expect(invalid.success).toBe(false);
      });
    });

    describe("requestRegenerationInputSchema", () => {
      it("valida payload mínimo com orderId", () => {
        const result = requestRegenerationInputSchema.safeParse({
          orderId: validOrderId,
        });
        expect(result.success).toBe(true);
      });

      it("valida payload completo com alterações e instrução", () => {
        const result = requestRegenerationInputSchema.safeParse({
          orderId: validOrderId,
          offerTitle: "Novo Título",
          promoPrice: "R$ 19,90",
          originalPrice: "R$ 29,90",
          callToAction: "Compre Agora",
          customAdjustmentPrompt: "Mude o fundo para azul",
        });
        expect(result.success).toBe(true);
      });

      it("rejeita instrução excedendo 500 caracteres", () => {
        const longPrompt = "a".repeat(501);
        const result = requestRegenerationInputSchema.safeParse({
          orderId: validOrderId,
          customAdjustmentPrompt: longPrompt,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("deliveryDetailsResultSchema", () => {
      it("valida DTO completo de retorno", () => {
        const result = deliveryDetailsResultSchema.safeParse(
          sampleDeliveryDetails,
        );
        expect(result.success).toBe(true);
      });
    });
  });

  describe("2. Server Function RPC Declarations", () => {
    it("getOrderDeliveryDetailsFn deve ser GET", () => {
      expect(getOrderDeliveryDetailsFn).toBeDefined();
      expect(typeof getOrderDeliveryDetailsFn).toBe("function");
      expect(getOrderDeliveryDetailsFn.method).toBe("GET");
    });

    it("recordCardDownloadFn deve ser POST", () => {
      expect(recordCardDownloadFn).toBeDefined();
      expect(typeof recordCardDownloadFn).toBe("function");
      expect(recordCardDownloadFn.method).toBe("POST");
    });

    it("requestCardRegenerationFn deve ser POST", () => {
      expect(requestCardRegenerationFn).toBeDefined();
      expect(typeof requestCardRegenerationFn).toBe("function");
      expect(requestCardRegenerationFn.method).toBe("POST");
    });
  });

  describe("3. Execution Handlers & Service Delegation", () => {
    it("executeGetOrderDeliveryDetails delega para service.getDeliveryDetails e retorna detalhes", async () => {
      const mockService = {
        getDeliveryDetails: vi.fn().mockResolvedValue(sampleDeliveryDetails),
      } as unknown as DeliveryService;

      const result = await executeGetOrderDeliveryDetails(
        { orderId: validOrderId },
        mockService,
      );

      expect(mockService.getDeliveryDetails).toHaveBeenCalledWith(validOrderId);
      expect(result).toEqual(sampleDeliveryDetails);
    });

    it("executeRecordCardDownload delega para service.recordDownload e retorna resultado", async () => {
      const mockService = {
        recordDownload: vi.fn().mockResolvedValue({
          success: true,
          downloadCount: 1,
        }),
      } as unknown as DeliveryService;

      const result = await executeRecordCardDownload(
        { orderId: validOrderId, format: "feed" },
        mockService,
      );

      expect(mockService.recordDownload).toHaveBeenCalledWith(
        validOrderId,
        "feed",
      );
      expect(result).toEqual({ success: true, downloadCount: 1 });
    });

    it("executeRequestCardRegeneration delega para service.regenerateOrderCard e retorna detalhes atualizados", async () => {
      const updatedDetails: DeliveryDetailsResult = {
        ...sampleDeliveryDetails,
        regenerationsUsed: 1,
        remainingRegenerations: 2,
        offerTitle: "Título Regenerado",
      };

      const mockService = {
        regenerateOrderCard: vi.fn().mockResolvedValue(updatedDetails),
      } as unknown as PostPaymentRegenerationService;

      const input = {
        orderId: validOrderId,
        offerTitle: "Título Regenerado",
      };

      const result = await executeRequestCardRegeneration(input, mockService);

      expect(mockService.regenerateOrderCard).toHaveBeenCalledWith(input);
      expect(result).toEqual(updatedDetails);
    });
  });
});
