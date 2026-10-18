// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Route } from "./pedido.$orderId";
import * as deliveryFunctions from "../features/delivery/server/functions/delivery.functions";
import type { DeliveryDetailsResult } from "../features/delivery/data/delivery.schemas";

describe("Pedido Route (/pedido/$orderId)", () => {
  const orderId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

  const mockDetails: DeliveryDetailsResult = {
    orderId,
    status: "PAID",
    offerTitle: "Super Promoção",
    businessName: "Mercado Local",
    businessSegment: "Supermercado",
    paidAt: new Date().toISOString(),
    regenerationWindowEndsAt: new Date(Date.now() + 1800000).toISOString(),
    canRegenerate: true,
    regenerationsUsed: 0,
    maxRegenerations: 3,
    remainingRegenerations: 3,
    feedCardUrl: "https://example.com/feed.png",
    storyCardUrl: "https://example.com/story.png",
    downloadCount: 0,
    customerWhatsapp: "11988887777",
    permanentOrderUrl: `https://ofertapronta.com/pedido/${orderId}`,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loader returns details on paid order", async () => {
    vi.spyOn(deliveryFunctions, "getOrderDeliveryDetailsFn").mockResolvedValue(
      mockDetails,
    );

    const loaderFn = Route.options.loader;
    expect(typeof loaderFn).toBe("function");

    if (typeof loaderFn === "function") {
      const fn = loaderFn as (ctx: unknown) => Promise<unknown>;
      const result = await fn({
        params: { orderId },
        location: {},
        cause: "enter",
      });

      expect(result).toEqual({
        details: mockDetails,
        error: null,
        isNotPaid: false,
      });
    }
  });

  it("loader throws redirect to checkout when order is not paid", async () => {
    vi.spyOn(deliveryFunctions, "getOrderDeliveryDetailsFn").mockRejectedValue(
      new Error("ORDER_NOT_PAID: Pedido ainda não foi pago"),
    );

    const loaderFn = Route.options.loader;
    expect(typeof loaderFn).toBe("function");

    if (typeof loaderFn === "function") {
      const fn = loaderFn as (ctx: unknown) => Promise<unknown>;
      await expect(
        fn({
          params: { orderId },
          location: {},
          cause: "enter",
        }),
      ).rejects.toThrow();
    }
  });

  it("loader returns error when order is not found", async () => {
    vi.spyOn(deliveryFunctions, "getOrderDeliveryDetailsFn").mockRejectedValue(
      new Error("Pedido não encontrado"),
    );

    const loaderFn = Route.options.loader;
    expect(typeof loaderFn).toBe("function");

    if (typeof loaderFn === "function") {
      const fn = loaderFn as (ctx: unknown) => Promise<unknown>;
      const result = await fn({
        params: { orderId },
        location: {},
        cause: "enter",
      });

      expect(result).toEqual({
        details: null,
        error: "Pedido não encontrado",
        isNotPaid: false,
      });
    }
  });
});
