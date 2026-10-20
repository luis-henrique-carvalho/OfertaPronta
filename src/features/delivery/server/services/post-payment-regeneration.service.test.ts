import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "../../../../server/db";
import { orders } from "../../../../server/db/schema/orders";
import { deliveryExports } from "../../../../server/db/schema/delivery";
import { eq } from "drizzle-orm";
import { DeliveryService } from "./delivery.service";
import { PostPaymentRegenerationService } from "./post-payment-regeneration.service";
import type {
  GenerateAdCardInput,
  GenerateAdCardResult,
} from "../../../promotions/server/services/ai-card-generator.service";
import { requestRegenerationInputSchema } from "../../data/delivery.schemas";

const FAKE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("PostPaymentRegenerationService Deep Module (TDD)", () => {
  let deliveryService: DeliveryService;
  let service: PostPaymentRegenerationService;
  let mockGenerateAdCard: ReturnType<typeof vi.fn>;
  let mockFormatFeed: ReturnType<typeof vi.fn>;
  let mockFormatStory: ReturnType<typeof vi.fn>;
  let mockApplySignature: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFormatFeed = vi.fn().mockImplementation(async (_buffer: Buffer) => {
      return Buffer.from("fake-feed-hd-png");
    });
    mockFormatStory = vi.fn().mockImplementation(async (_buffer: Buffer) => {
      return Buffer.from("fake-story-hd-png");
    });
    mockApplySignature = vi
      .fn()
      .mockImplementation(async (buffer: Buffer, _options) => {
        return Buffer.concat([
          buffer,
          Buffer.from("-with-cobranding-signature"),
        ]);
      });

    deliveryService = new DeliveryService({
      database: db,
      formatFeed: mockFormatFeed,
      formatStory: mockFormatStory,
      applySignature: mockApplySignature,
    });

    mockGenerateAdCard = vi
      .fn()
      .mockImplementation(
        async (_input: GenerateAdCardInput): Promise<GenerateAdCardResult> => {
          return {
            rawImageBuffer: Buffer.from("new-clean-master-image-buffer"),
            mimeType: "image/png",
          };
        },
      );

    service = new PostPaymentRegenerationService({
      database: db,
      deliveryService,
      generateAdCard: mockGenerateAdCard,
    });
  });

  async function createTestOrder(
    status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED",
    overrides: Partial<typeof orders.$inferInsert> = {},
  ) {
    const orderId = crypto.randomUUID();
    const paidAt = status === "PAID" ? new Date() : null;

    const [order] = await db
      .insert(orders)
      .values({
        id: orderId,
        planId: "single_campaign",
        status,
        amountCents: 990,
        cleanMasterImageDataUrl: FAKE_PNG_DATA_URL,
        frozenSnapshot: {
          businessSegment: "burger-shop",
          targetAspectRatio: "feed",
          businessName: "Burger House",
          offerTitle: "Combo X-Burguer Original",
          promoPrice: "R$ 29,90",
          originalPrice: "R$ 39,90",
          callToAction: "Peça pelo WhatsApp",
          whatsapp: "11999998888",
          productImageDataUrl: "data:image/jpeg;base64,orig-product-photo",
          referenceImageDataUrl: "data:image/jpeg;base64,orig-ref-photo",
          stylePresetId: "rustic-wood",
          customStyleInstructions: "Estilo rústico escuro",
          previewCardImageUrl: FAKE_PNG_DATA_URL,
        },
        customerWhatsapp: "11999998888",
        customerEmail: "cliente@teste.com",
        aiRegenerationCount: 0,
        paidAt,
        ...overrides,
      })
      .returning();

    return order;
  }

  describe("Validation & Eligibility Rules", () => {
    it("should throw ORDER_NOT_FOUND when order does not exist", async () => {
      const nonExistentOrderId = crypto.randomUUID();

      await expect(
        service.regenerateOrderCard({
          orderId: nonExistentOrderId,
          offerTitle: "Novo Título",
        }),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_FOUND",
      });
    });

    it("should throw ORDER_NOT_PAID when order status is PENDING", async () => {
      const order = await createTestOrder("PENDING");

      await expect(
        service.regenerateOrderCard({
          orderId: order.id,
          offerTitle: "Novo Título",
        }),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_PAID",
      });
    });

    it("should throw ORDER_NOT_PAID when order status is EXPIRED or CANCELLED", async () => {
      const order = await createTestOrder("EXPIRED");

      await expect(
        service.regenerateOrderCard({
          orderId: order.id,
          offerTitle: "Novo Título",
        }),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_PAID",
      });
    });

    it("should throw REGENERATION_QUOTA_EXCEEDED when aiRegenerationCount >= 3", async () => {
      const order = await createTestOrder("PAID", {
        aiRegenerationCount: 3,
      });

      await expect(
        service.regenerateOrderCard({
          orderId: order.id,
          offerTitle: "4º Ajuste Não Permitido",
        }),
      ).rejects.toMatchObject({
        code: "REGENERATION_QUOTA_EXCEEDED",
        message: expect.stringContaining(
          "Você já utilizou o limite máximo de 3 regenerações incluídas neste pedido",
        ),
      });

      expect(mockGenerateAdCard).not.toHaveBeenCalled();
    });

    it("should throw REGENERATION_WINDOW_EXPIRED when paidAt is older than 30 minutes", async () => {
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      const order = await createTestOrder("PAID", {
        paidAt: thirtyOneMinutesAgo,
        aiRegenerationCount: 0,
      });

      await expect(
        service.regenerateOrderCard({
          orderId: order.id,
          offerTitle: "Ajuste Fora do Prazo",
        }),
      ).rejects.toMatchObject({
        code: "REGENERATION_WINDOW_EXPIRED",
        message: expect.stringContaining(
          "A janela de 30 minutos para ajustes por IA neste pedido expirou",
        ),
      });

      expect(mockGenerateAdCard).not.toHaveBeenCalled();
    });
  });

  describe("Regeneration Execution & State Transitions", () => {
    it("should successfully regenerate card, increment aiRegenerationCount, update exports, and return updated delivery details", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      mockFormatFeed.mockResolvedValueOnce(Buffer.from("new-feed-hd-png"));
      mockFormatStory.mockResolvedValueOnce(Buffer.from("new-story-hd-png"));

      const result = await service.regenerateOrderCard({
        orderId: order.id,
        offerTitle: "Super Smash Burger Duplo",
        promoPrice: "R$ 24,90",
        customAdjustmentPrompt: "Destaque mais as chamas na carne",
      });

      // Verification of returned details
      expect(result.orderId).toBe(order.id);
      expect(result.status).toBe("PAID");
      expect(result.offerTitle).toBe("Super Smash Burger Duplo");
      expect(result.regenerationsUsed).toBe(1);
      expect(result.remainingRegenerations).toBe(2);
      expect(result.canRegenerate).toBe(true);
      expect(result.feedCardUrl).toContain(
        Buffer.from("new-feed-hd-png").toString("base64"),
      );
      expect(result.storyCardUrl).toContain(
        Buffer.from("new-story-hd-png").toString("base64"),
      );

      // Verify orders table in database was updated
      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order.id));

      expect(updatedOrder.aiRegenerationCount).toBe(1);
      expect(updatedOrder.cleanMasterImageDataUrl).toContain(
        Buffer.from("new-clean-master-image-buffer").toString("base64"),
      );

      // Verify deliveryExports table in database was updated
      const [updatedExport] = await db
        .select()
        .from(deliveryExports)
        .where(eq(deliveryExports.orderId, order.id));

      expect(updatedExport.feedUrl).toContain(
        Buffer.from("new-feed-hd-png").toString("base64"),
      );
      expect(updatedExport.storyUrl).toContain(
        Buffer.from("new-story-hd-png").toString("base64"),
      );
    });

    it("should preserve original product image, reference image, style preset and business segment", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      await service.regenerateOrderCard({
        orderId: order.id,
        offerTitle: "Combo Premium 2.0",
        promoPrice: "R$ 34,90",
      });

      expect(mockGenerateAdCard).toHaveBeenCalledWith(
        expect.objectContaining({
          businessSegment: "burger-shop",
          businessName: "Burger House",
          offerTitle: "Combo Premium 2.0",
          promoPrice: "R$ 34,90",
          originalPrice: "R$ 39,90",
          callToAction: "Peça pelo WhatsApp",
          productImageDataUrl: "data:image/jpeg;base64,orig-product-photo",
          referenceImageDataUrl: "data:image/jpeg;base64,orig-ref-photo",
          stylePresetId: "rustic-wood",
        }),
      );
    });

    it("should merge customAdjustmentPrompt with original customStyleInstructions", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      await service.regenerateOrderCard({
        orderId: order.id,
        customAdjustmentPrompt: "Fundo com iluminação neon azul",
      });

      expect(mockGenerateAdCard).toHaveBeenCalledWith(
        expect.objectContaining({
          customStyleInstructions: expect.stringContaining(
            "iluminação neon azul",
          ),
        }),
      );
    });

    it("should NOT increment aiRegenerationCount if generateAdCard fails (resilience)", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      mockGenerateAdCard.mockRejectedValueOnce(
        new Error("Gemini API rate limit or safety filter triggered"),
      );

      await expect(
        service.regenerateOrderCard({
          orderId: order.id,
          offerTitle: "Tentativa Que Falhará",
        }),
      ).rejects.toThrow("Gemini API rate limit or safety filter triggered");

      // Verify that aiRegenerationCount was NOT debited
      const [persistedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order.id));

      expect(persistedOrder.aiRegenerationCount).toBe(0);
      expect(persistedOrder.cleanMasterImageDataUrl).toBe(FAKE_PNG_DATA_URL);
    });

    it("should pass cleanMasterImageDataUrl as baseCardImageDataUrl to generateAdCard to ensure layout preservation", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      await service.regenerateOrderCard({
        orderId: order.id,
        customAdjustmentPrompt: "Mudar apenas a cor da logo para verde",
      });

      expect(mockGenerateAdCard).toHaveBeenCalledWith(
        expect.objectContaining({
          baseCardImageDataUrl: FAKE_PNG_DATA_URL,
          customStyleInstructions: expect.stringContaining(
            "Mudar apenas a cor da logo para verde",
          ),
        }),
      );
    });

    it("should isolate current customAdjustmentPrompt without accumulating contradictory past adjustments", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      // Rodada 1: Mudar para verde
      await service.regenerateOrderCard({
        orderId: order.id,
        customAdjustmentPrompt: "Mudar a logo para verde",
      });

      // Rodada 2: Mudar para vermelho (sobre a arte gerada na rodada 1)
      await service.regenerateOrderCard({
        orderId: order.id,
        customAdjustmentPrompt: "Mudar a logo para vermelho",
      });

      // Na rodada 2, a instrução ativa para a IA deve focar no ajuste atual e não acumular 'verde'
      const lastCallArgs =
        mockGenerateAdCard.mock.calls[
          mockGenerateAdCard.mock.calls.length - 1
        ][0];
      expect(lastCallArgs.customStyleInstructions).toContain(
        "Mudar a logo para vermelho",
      );
      expect(lastCallArgs.customStyleInstructions).not.toContain(
        "Mudar a logo para verde",
      );
    });

    it("should update stylePresetId when a new stylePresetId is explicitly provided", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      await service.regenerateOrderCard({
        orderId: order.id,
        stylePresetId: "burger-dark-bold",
      });

      expect(mockGenerateAdCard).toHaveBeenCalledWith(
        expect.objectContaining({
          stylePresetId: "burger-dark-bold",
        }),
      );

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order.id));

      const snapshot = updatedOrder.frozenSnapshot as Record<string, unknown>;
      expect(snapshot.stylePresetId).toBe("burger-dark-bold");
    });

    it("should combine colorPalette with original customStyleInstructions into AI instructions", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      await service.regenerateOrderCard({
        orderId: order.id,
        colorPalette: "Preto e Dourado",
      });

      expect(mockGenerateAdCard).toHaveBeenCalledWith(
        expect.objectContaining({
          customStyleInstructions:
            "Estilo rústico escuro. Ajuste solicitado pelo cliente: Paleta de cores: Preto e Dourado",
        }),
      );

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order.id));

      const snapshot = updatedOrder.frozenSnapshot as Record<string, unknown>;
      expect(snapshot.colorPalette).toBe("Preto e Dourado");
      expect(snapshot.customStyleInstructions).toContain(
        "Paleta de cores: Preto e Dourado",
      );
    });

    it("should combine both colorPalette and customAdjustmentPrompt with original style instructions", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      await service.regenerateOrderCard({
        orderId: order.id,
        colorPalette: "Vermelho e Amarelo",
        customAdjustmentPrompt: "Destaque mais as chamas na carne",
      });

      expect(mockGenerateAdCard).toHaveBeenCalledWith(
        expect.objectContaining({
          customStyleInstructions:
            "Estilo rústico escuro. Ajuste solicitado pelo cliente: Paleta de cores: Vermelho e Amarelo. Destaque mais as chamas na carne",
        }),
      );
    });

    it("should isolate colorPalette across successive regenerations without stacking stale palettes", async () => {
      const order = await createTestOrder("PAID");
      await deliveryService.ensureDeliveryExports(order.id);

      // Rodada 1: Dourado e Preto
      await service.regenerateOrderCard({
        orderId: order.id,
        colorPalette: "Dourado e Preto",
      });

      // Rodada 2: Vermelho e Amarelo
      await service.regenerateOrderCard({
        orderId: order.id,
        colorPalette: "Vermelho e Amarelo",
      });

      const lastCallArgs =
        mockGenerateAdCard.mock.calls[
          mockGenerateAdCard.mock.calls.length - 1
        ][0];
      expect(lastCallArgs.customStyleInstructions).toContain(
        "Paleta de cores: Vermelho e Amarelo",
      );
      expect(lastCallArgs.customStyleInstructions).not.toContain(
        "Dourado e Preto",
      );
    });

    it("should preserve and re-apply cobranding signature on regenerated exports when order has cobrandingAccepted: true", async () => {
      const order = await createTestOrder("PAID", {
        cobrandingAccepted: true,
        cobrandingCreditText: "Design por @ofertapronta",
      });
      await deliveryService.ensureDeliveryExports(order.id);
      mockApplySignature.mockClear();

      mockFormatFeed.mockResolvedValueOnce(Buffer.from("regen-feed-raw"));
      mockFormatStory.mockResolvedValueOnce(Buffer.from("regen-story-raw"));

      const result = await service.regenerateOrderCard({
        orderId: order.id,
        offerTitle: "Título Regenerado com Co-Branding",
      });

      expect(mockApplySignature).toHaveBeenCalledTimes(2);
      expect(mockApplySignature).toHaveBeenCalledWith(
        Buffer.from("regen-feed-raw"),
        { creditText: "Design por @ofertapronta", aspectRatio: "feed" },
      );
      expect(mockApplySignature).toHaveBeenCalledWith(
        Buffer.from("regen-story-raw"),
        { creditText: "Design por @ofertapronta", aspectRatio: "story" },
      );

      expect(result.feedCardUrl).toContain(
        Buffer.from("regen-feed-raw-with-cobranding-signature").toString(
          "base64",
        ),
      );
      expect(result.storyCardUrl).toContain(
        Buffer.from("regen-story-raw-with-cobranding-signature").toString(
          "base64",
        ),
      );
    });
  });

  describe("requestRegenerationInputSchema Schema Validation", () => {
    it("should validate successfully with stylePresetId and colorPalette", () => {
      const input = {
        orderId: crypto.randomUUID(),
        stylePresetId: "market-fresh",
        colorPalette: "Verde e Branco",
      };

      const parsed = requestRegenerationInputSchema.parse(input);
      expect(parsed.stylePresetId).toBe("market-fresh");
      expect(parsed.colorPalette).toBe("Verde e Branco");
    });

    it("should validate successfully with null/undefined for stylePresetId and colorPalette", () => {
      const input = {
        orderId: crypto.randomUUID(),
        stylePresetId: null,
        colorPalette: null,
      };

      const parsed = requestRegenerationInputSchema.parse(input);
      expect(parsed.stylePresetId).toBeNull();
      expect(parsed.colorPalette).toBeNull();
    });
  });
});
