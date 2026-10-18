import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "../../../../server/db";
import { orders } from "../../../../server/db/schema/orders";
import { deliveryExports } from "../../../../server/db/schema/delivery";
import { eq } from "drizzle-orm";
import { DeliveryService } from "./delivery.service";
import { deliveryDetailsResultSchema } from "../../data/delivery.schemas";

// 1x1 transparent PNG data URL for test fake master image
const FAKE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("DeliveryService Deep Module (TDD)", () => {
  let service: DeliveryService;
  let mockFormatFeed: ReturnType<typeof vi.fn>;
  let mockFormatStory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFormatFeed = vi.fn().mockImplementation(async (_buffer: Buffer) => {
      return Buffer.from("fake-feed-hd-png");
    });
    mockFormatStory = vi.fn().mockImplementation(async (_buffer: Buffer) => {
      return Buffer.from("fake-story-hd-png");
    });

    service = new DeliveryService({
      database: db,
      formatFeed: mockFormatFeed,
      formatStory: mockFormatStory,
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
      expect(validated.feedCardUrl).toContain("data:image/png;base64,");
      expect(validated.storyCardUrl).toContain("data:image/png;base64,");
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
    it("should update existing exports with new feed and story buffers", async () => {
      const order = await createTestOrder("PAID");
      await service.ensureDeliveryExports(order.id);

      mockFormatFeed.mockResolvedValueOnce(Buffer.from("updated-feed-hd"));
      mockFormatStory.mockResolvedValueOnce(Buffer.from("updated-story-hd"));

      const newMasterBuffer = Buffer.from("new-master-art");
      const updated = await service.updateExports(order.id, newMasterBuffer);

      expect(updated.orderId).toBe(order.id);
      expect(updated.feedUrl).toContain(
        Buffer.from("updated-feed-hd").toString("base64"),
      );
      expect(updated.storyUrl).toContain(
        Buffer.from("updated-story-hd").toString("base64"),
      );
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });
  });
});
