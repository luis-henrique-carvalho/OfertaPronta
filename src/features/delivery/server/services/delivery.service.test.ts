import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "../../../../server/db";
import { orders } from "../../../../server/db/schema/orders";
import { deliveryExports } from "../../../../server/db/schema/delivery";
import { eq } from "drizzle-orm";
import { DeliveryService } from "./delivery.service";
import { deliveryDetailsResultSchema } from "../../data/delivery.schemas";
import {
  setStorageServiceForTesting,
  InMemoryStorageDriver,
} from "../../../../server/storage";

// 1x1 transparent PNG data URL for test fake master image
const FAKE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("DeliveryService Deep Module (TDD)", () => {
  let service: DeliveryService;
  let storageDriver: InMemoryStorageDriver;
  let mockFormatFeed: ReturnType<typeof vi.fn>;
  let mockFormatStory: ReturnType<typeof vi.fn>;
  let mockApplySignature: ReturnType<typeof vi.fn>;
  let mockGenerateAdCard: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storageDriver = new InMemoryStorageDriver();
    setStorageServiceForTesting(storageDriver);

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
    mockGenerateAdCard = vi.fn().mockImplementation(async () => {
      return {
        rawImageBuffer: Buffer.from("fake-ai-master-png"),
        mimeType: "image/png",
      };
    });

    service = new DeliveryService({
      database: db,
      baseUrl: "",
      formatFeed: mockFormatFeed,
      formatStory: mockFormatStory,
      applySignature: mockApplySignature,
      storageService: storageDriver,
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
          offerTitle: "Combo X-Burguer Artesanal",
          businessName: "Burger House",
          businessSegment: "burger-shop",
          whatsapp: "11999998888",
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

  describe("ensureDeliveryExports", () => {
    it("should throw ORDER_NOT_FOUND when order does not exist", async () => {
      const nonExistentOrderId = crypto.randomUUID();

      await expect(
        service.ensureDeliveryExports(nonExistentOrderId),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_FOUND",
      });
    });

    it("should throw ORDER_NOT_PAID when order is in PENDING status", async () => {
      const order = await createTestOrder("PENDING");

      await expect(
        service.ensureDeliveryExports(order.id),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_PAID",
      });
    });

    it("should throw ORDER_NOT_PAID when order is in EXPIRED status", async () => {
      const order = await createTestOrder("EXPIRED");

      await expect(
        service.ensureDeliveryExports(order.id),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_PAID",
      });
    });

    it("should throw ORDER_NOT_PAID when order is in CANCELLED status", async () => {
      const order = await createTestOrder("CANCELLED");

      await expect(
        service.ensureDeliveryExports(order.id),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_PAID",
      });
    });

    it("should derive Feed and Story HD exports and persist in database when order is PAID", async () => {
      const order = await createTestOrder("PAID");

      const result = await service.ensureDeliveryExports(order.id);

      // Verify schema conformance
      const validated = deliveryDetailsResultSchema.parse(result);
      expect(validated.orderId).toBe(order.id);
      expect(validated.status).toBe("PAID");
      expect(validated.offerTitle).toBe("Combo X-Burguer Artesanal");
      expect(validated.businessName).toBe("Burger House");
      expect(validated.businessSegment).toBe("burger-shop");
      expect(validated.downloadCount).toBe(0);
      expect(validated.canRegenerate).toBe(true);
      expect(validated.regenerationsUsed).toBe(0);
      expect(validated.remainingRegenerations).toBe(3);
      expect(validated.feedCardUrl).toBeDefined();
      expect(validated.feedCardUrl.length).toBeGreaterThan(0);
      expect(validated.storyCardUrl).toBeDefined();
      expect(validated.storyCardUrl.length).toBeGreaterThan(0);
      expect(validated.permanentOrderUrl).toBe(`/pedido/${order.id}`);

      // Verify Sharp formatting was called with the decoded clean master buffer
      expect(mockFormatFeed).toHaveBeenCalledTimes(1);
      expect(mockFormatStory).toHaveBeenCalledTimes(1);

      // Verify persistence in PostgreSQL
      const [savedExport] = await db
        .select()
        .from(deliveryExports)
        .where(eq(deliveryExports.orderId, order.id));

      expect(savedExport).toBeDefined();
      expect(savedExport.downloadCount).toBe(0);
      expect(savedExport.expiresAt).toBeNull();
      expect(savedExport.feedAssetKey).toBe(`orders/${order.id}/feed.png`);
      expect(savedExport.storyAssetKey).toBe(`orders/${order.id}/story.png`);

      // Verify assets were uploaded to storage
      const storedFeed = await storageDriver.getAsset(
        savedExport.feedAssetKey!,
      );
      const storedStory = await storageDriver.getAsset(
        savedExport.storyAssetKey!,
      );
      expect(storedFeed).not.toBeNull();
      expect(storedStory).not.toBeNull();
    });

    it("should be strictly idempotent: secondary calls return existing exports without re-formatting", async () => {
      const order = await createTestOrder("PAID");

      const firstCall = await service.ensureDeliveryExports(order.id);
      expect(mockFormatFeed).toHaveBeenCalledTimes(1);
      expect(mockFormatStory).toHaveBeenCalledTimes(1);

      const secondCall = await service.ensureDeliveryExports(order.id);
      expect(mockFormatFeed).toHaveBeenCalledTimes(1); // not called again
      expect(mockFormatStory).toHaveBeenCalledTimes(1); // not called again

      expect(secondCall.orderId).toBe(firstCall.orderId);
      expect(secondCall.feedCardUrl).toBe(firstCall.feedCardUrl);
      expect(secondCall.storyCardUrl).toBe(firstCall.storyCardUrl);
    });

    it("should fallback to previewCardImageUrl if cleanMasterImageDataUrl is not set on order", async () => {
      const order = await createTestOrder("PAID", {
        cleanMasterImageDataUrl: null,
      });

      const result = await service.ensureDeliveryExports(order.id);

      expect(result).toBeDefined();
      expect(mockFormatFeed).toHaveBeenCalledTimes(1);
      expect(mockFormatStory).toHaveBeenCalledTimes(1);
    });

    it("should generate ad card on-the-fly via AI when order has pendingAiGeneration: true and no clean master art", async () => {
      const order = await createTestOrder("PAID", {
        cleanMasterImageDataUrl: null,
        cleanMasterAssetKey: null,
        frozenSnapshot: {
          offerTitle: "Arroz 5kg Tipo 1",
          businessName: "Mercado Central",
          businessSegment: "supermarket",
          promoPrice: "R$ 21,90",
          whatsapp: "11988887777",
          pendingAiGeneration: true,
          previewCardImageUrl: null,
        },
        aiRegenerationCount: 0,
      });

      const result = await service.ensureDeliveryExports(order.id);

      // Verify AI generation was invoked with frozen snapshot data
      expect(mockGenerateAdCard).toHaveBeenCalledTimes(1);
      expect(mockGenerateAdCard).toHaveBeenCalledWith(
        expect.objectContaining({
          businessSegment: "supermarket",
          businessName: "Mercado Central",
          offerTitle: "Arroz 5kg Tipo 1",
          promoPrice: "R$ 21,90",
        }),
      );

      // Verify delivery details returned
      expect(result.orderId).toBe(order.id);
      expect(result.status).toBe("PAID");
      expect(result.feedCardUrl).toBeDefined();
      expect(result.storyCardUrl).toBeDefined();
      expect(result.remainingRegenerations).toBe(3);
      expect(result.regenerationsUsed).toBe(0);

      // Verify formats were derived from the AI generated buffer
      expect(mockFormatFeed).toHaveBeenCalledWith(
        Buffer.from("fake-ai-master-png"),
      );
      expect(mockFormatStory).toHaveBeenCalledWith(
        Buffer.from("fake-ai-master-png"),
      );

      // Verify cleanMasterAssetKey was persisted on order in DB and aiRegenerationCount remains 0
      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order.id));
      expect(updatedOrder.cleanMasterAssetKey).toBeDefined();
      expect(updatedOrder.cleanMasterAssetKey).toMatch(/^orders\//);
      expect(updatedOrder.aiRegenerationCount).toBe(0);

      // Verify stored asset in StorageService
      const storedAsset = await storageDriver.getAsset(
        updatedOrder.cleanMasterAssetKey!,
      );
      expect(storedAsset).not.toBeNull();
      expect(storedAsset?.buffer.toString()).toBe("fake-ai-master-png");
    });

    it("should be idempotent and not invoke AI generation again on repeated calls", async () => {
      const order = await createTestOrder("PAID", {
        cleanMasterImageDataUrl: null,
        cleanMasterAssetKey: null,
        frozenSnapshot: {
          offerTitle: "Arroz 5kg Tipo 1",
          businessName: "Mercado Central",
          businessSegment: "supermarket",
          promoPrice: "R$ 21,90",
          pendingAiGeneration: true,
          previewCardImageUrl: null,
        },
        aiRegenerationCount: 0,
      });

      const firstCall = await service.ensureDeliveryExports(order.id);
      expect(mockGenerateAdCard).toHaveBeenCalledTimes(1);

      const secondCall = await service.ensureDeliveryExports(order.id);
      // AI generation should NOT be called again
      expect(mockGenerateAdCard).toHaveBeenCalledTimes(1);

      expect(secondCall.orderId).toBe(firstCall.orderId);
      expect(secondCall.feedCardUrl).toBe(firstCall.feedCardUrl);
      expect(secondCall.storyCardUrl).toBe(firstCall.storyCardUrl);
    });
  });

  describe("getDeliveryDetails", () => {
    it("should throw ORDER_NOT_PAID if order is not PAID", async () => {
      const order = await createTestOrder("PENDING");

      await expect(service.getDeliveryDetails(order.id)).rejects.toMatchObject({
        code: "ORDER_NOT_PAID",
      });
    });

    it("should return full delivery details for a paid order", async () => {
      const order = await createTestOrder("PAID");

      const details = await service.getDeliveryDetails(order.id);

      expect(details.orderId).toBe(order.id);
      expect(details.status).toBe("PAID");
      expect(details.offerTitle).toBe("Combo X-Burguer Artesanal");
    });

    it("should mark canRegenerate as false if paidAt is older than 30 minutes", async () => {
      const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000);
      const order = await createTestOrder("PAID", {
        paidAt: fortyMinutesAgo,
      });

      const details = await service.getDeliveryDetails(order.id);

      expect(details.canRegenerate).toBe(false);
      expect(details.remainingRegenerations).toBe(3);
    });

    it("should mark canRegenerate as false if aiRegenerationCount is 3", async () => {
      const order = await createTestOrder("PAID", {
        aiRegenerationCount: 3,
      });

      const details = await service.getDeliveryDetails(order.id);

      expect(details.canRegenerate).toBe(false);
      expect(details.regenerationsUsed).toBe(3);
      expect(details.remainingRegenerations).toBe(0);
    });
  });

  describe("recordDownload", () => {
    it("should throw ORDER_NOT_PAID if order is not paid", async () => {
      const order = await createTestOrder("PENDING");

      await expect(
        service.recordDownload(order.id, "feed"),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_PAID",
      });
    });

    it("should increment downloadCount atomically and update lastDownloadedAt", async () => {
      const order = await createTestOrder("PAID");
      await service.ensureDeliveryExports(order.id);

      const firstDownload = await service.recordDownload(order.id, "feed");
      expect(firstDownload.success).toBe(true);
      expect(firstDownload.downloadCount).toBe(1);

      const secondDownload = await service.recordDownload(order.id, "story");
      expect(secondDownload.success).toBe(true);
      expect(secondDownload.downloadCount).toBe(2);

      const [stored] = await db
        .select()
        .from(deliveryExports)
        .where(eq(deliveryExports.orderId, order.id));

      expect(stored.downloadCount).toBe(2);
      expect(stored.lastDownloadedAt).toBeInstanceOf(Date);
    });
  });

  describe("getExportBinary", () => {
    it("should throw ORDER_NOT_PAID if order is not paid", async () => {
      const order = await createTestOrder("PENDING");

      await expect(
        service.getExportBinary(order.id, "feed"),
      ).rejects.toMatchObject({
        code: "ORDER_NOT_PAID",
      });
    });

    it("should return binary PNG buffer, correct content-type and filename, and increment download count", async () => {
      const order = await createTestOrder("PAID");

      const result = await service.getExportBinary(order.id, "feed");

      expect(result.contentType).toBe("image/png");
      expect(result.filename).toBe(`ofertapronta-feed-${order.id}.png`);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);

      // Verify that downloadCount was incremented
      const [stored] = await db
        .select()
        .from(deliveryExports)
        .where(eq(deliveryExports.orderId, order.id));

      expect(stored.downloadCount).toBe(1);
    });
  });

  describe("updateExports", () => {
    it("should update existing exports with new feed and story buffers in storage", async () => {
      const order = await createTestOrder("PAID");
      await service.ensureDeliveryExports(order.id);

      mockFormatFeed.mockResolvedValueOnce(Buffer.from("updated-feed-hd"));
      mockFormatStory.mockResolvedValueOnce(Buffer.from("updated-story-hd"));

      const newMasterBuffer = Buffer.from("new-master-art");
      const updated = await service.updateExports(order.id, newMasterBuffer);

      expect(updated.orderId).toBe(order.id);
      expect(updated.feedUrl).toBeDefined();
      expect(updated.storyUrl).toBeDefined();
      expect(updated.feedAssetKey).toBe(`orders/${order.id}/feed.png`);
      expect(updated.storyAssetKey).toBe(`orders/${order.id}/story.png`);
      expect(updated.updatedAt).toBeInstanceOf(Date);

      const storedFeed = await storageDriver.getAsset(updated.feedAssetKey!);
      expect(storedFeed?.buffer.toString()).toBe("updated-feed-hd");
    });

    it("should apply cobranding signature in updateExports when order has cobrandingAccepted: true", async () => {
      const order = await createTestOrder("PAID", {
        cobrandingAccepted: true,
        cobrandingCreditText: "Design por @ofertapronta",
      });
      await service.ensureDeliveryExports(order.id);
      mockApplySignature.mockClear();

      mockFormatFeed.mockResolvedValueOnce(Buffer.from("regen-feed-raw"));
      mockFormatStory.mockResolvedValueOnce(Buffer.from("regen-story-raw"));

      const newMasterBuffer = Buffer.from("new-regen-master");
      const updated = await service.updateExports(order.id, newMasterBuffer);

      expect(mockApplySignature).toHaveBeenCalledTimes(2);
      expect(mockApplySignature).toHaveBeenCalledWith(
        Buffer.from("regen-feed-raw"),
        { creditText: "Design por @ofertapronta", aspectRatio: "feed" },
      );
      expect(mockApplySignature).toHaveBeenCalledWith(
        Buffer.from("regen-story-raw"),
        { creditText: "Design por @ofertapronta", aspectRatio: "story" },
      );

      expect(updated.feedUrl).toBeDefined();
      expect(updated.storyUrl).toBeDefined();
      expect(updated.feedAssetKey).toBe(`orders/${order.id}/feed.png`);

      const storedFeed = await storageDriver.getAsset(updated.feedAssetKey!);
      expect(storedFeed?.buffer.toString()).toBe(
        "regen-feed-raw-with-cobranding-signature",
      );
    });
  });

  describe("Co-branding Signature Application in Delivery", () => {
    it("should apply cobranding signature to Feed and Story when order has cobrandingAccepted: true", async () => {
      const order = await createTestOrder("PAID", {
        cobrandingAccepted: true,
        cobrandingCreditText: "Design por @ofertapronta",
      });

      const result = await service.ensureDeliveryExports(order.id);

      expect(mockApplySignature).toHaveBeenCalledTimes(2);
      expect(mockApplySignature).toHaveBeenCalledWith(
        Buffer.from("fake-feed-hd-png"),
        { creditText: "Design por @ofertapronta", aspectRatio: "feed" },
      );
      expect(mockApplySignature).toHaveBeenCalledWith(
        Buffer.from("fake-story-hd-png"),
        { creditText: "Design por @ofertapronta", aspectRatio: "story" },
      );

      expect(result.feedCardUrl).toBeDefined();
      expect(result.storyCardUrl).toBeDefined();

      const [stored] = await db
        .select()
        .from(deliveryExports)
        .where(eq(deliveryExports.orderId, order.id));
      const storedFeed = await storageDriver.getAsset(stored.feedAssetKey!);
      expect(storedFeed?.buffer.toString()).toBe(
        "fake-feed-hd-png-with-cobranding-signature",
      );
    });

    it("should NOT apply cobranding signature when order has cobrandingAccepted: false", async () => {
      const order = await createTestOrder("PAID", {
        cobrandingAccepted: false,
        cobrandingCreditText: null,
      });

      const result = await service.ensureDeliveryExports(order.id);

      expect(mockApplySignature).not.toHaveBeenCalled();
      expect(result.feedCardUrl).toBeDefined();
      expect(result.storyCardUrl).toBeDefined();

      const [stored] = await db
        .select()
        .from(deliveryExports)
        .where(eq(deliveryExports.orderId, order.id));
      const storedFeed = await storageDriver.getAsset(stored.feedAssetKey!);
      expect(storedFeed?.buffer.toString()).toBe("fake-feed-hd-png");
    });
  });

  describe("StorageService & Backward Compatibility Fallback Seams", () => {
    it("should retrieve clean master from StorageService via cleanMasterAssetKey when present", async () => {
      const masterBuffer = Buffer.from("clean-master-stored-in-r2");
      await storageDriver.uploadAsset({
        key: "masters/my-draft/master.png",
        buffer: masterBuffer,
        contentType: "image/png",
        isPublic: false,
      });

      const order = await createTestOrder("PAID", {
        cleanMasterImageDataUrl: null,
        cleanMasterAssetKey: "masters/my-draft/master.png",
      });

      const result = await service.ensureDeliveryExports(order.id);
      expect(result).toBeDefined();
      expect(mockFormatFeed).toHaveBeenCalledWith(masterBuffer);
      expect(mockFormatStory).toHaveBeenCalledWith(masterBuffer);
    });

    it("should fallback to legacy Base64 cleanMasterImageDataUrl when cleanMasterAssetKey is absent", async () => {
      const order = await createTestOrder("PAID", {
        cleanMasterAssetKey: null,
        cleanMasterImageDataUrl: FAKE_PNG_DATA_URL,
      });

      const result = await service.ensureDeliveryExports(order.id);
      expect(result).toBeDefined();
      expect(mockFormatFeed).toHaveBeenCalledTimes(1);
    });

    it("should fallback to Base64 in deliveryExports when assetKey is not present (legacy export)", async () => {
      const order = await createTestOrder("PAID");
      await db.insert(deliveryExports).values({
        orderId: order.id,
        feedUrl: FAKE_PNG_DATA_URL,
        storyUrl: FAKE_PNG_DATA_URL,
        feedAssetKey: null,
        storyAssetKey: null,
        downloadCount: 0,
      });

      const binary = await service.getExportBinary(order.id, "feed");
      expect(binary.buffer).toBeInstanceOf(Buffer);
      expect(binary.contentType).toBe("image/png");
      expect(binary.buffer.length).toBeGreaterThan(0);
    });

    it("should not increment downloadCount when recordDownload: false is passed (inline mode)", async () => {
      const order = await createTestOrder("PAID");
      await service.ensureDeliveryExports(order.id);

      const binary = await service.getExportBinary(order.id, "feed", {
        recordDownload: false,
      });
      expect(binary.buffer).toBeInstanceOf(Buffer);

      const [stored] = await db
        .select()
        .from(deliveryExports)
        .where(eq(deliveryExports.orderId, order.id));

      expect(stored.downloadCount).toBe(0);
    });

    it("should not contain any references or substring checks for storage.local.fake", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const code = fs.readFileSync(
        path.join(__dirname, "delivery.service.ts"),
        "utf-8",
      );
      expect(code.includes("storage.local.fake")).toBe(false);
    });
  });
});
