// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDeliveryOrder, useCardRegeneration } from "./index";
import type { DeliveryDetailsResult } from "../data/delivery.schemas";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

const mockDetails: DeliveryDetailsResult = {
  orderId: "e9b5ec28-c137-4f65-8b35-71cb941e7ec9",
  status: "PAID",
  offerTitle: "Combo Família Burger",
  businessName: "Burger Artesanal",
  businessSegment: "Hamburgueria",
  paidAt: new Date().toISOString(),
  regenerationWindowEndsAt: new Date(Date.now() + 1800000).toISOString(),
  canRegenerate: true,
  regenerationsUsed: 0,
  maxRegenerations: 3,
  remainingRegenerations: 3,
  feedCardUrl: "data:image/png;base64,feedmock",
  storyCardUrl: "data:image/png;base64,storymock",
  downloadCount: 0,
  customerWhatsapp: "11999998888",
  permanentOrderUrl:
    "https://ofertapronta.com/pedido/e9b5ec28-c137-4f65-8b35-71cb941e7ec9",
};

describe("Delivery Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useDeliveryOrder", () => {
    it("initializes with initial details", () => {
      const { result } = renderHook(
        () => useDeliveryOrder({ initialDetails: mockDetails }),
        { wrapper: createWrapper() },
      );

      expect(result.current.details.orderId).toBe(mockDetails.orderId);
      expect(result.current.details.offerTitle).toBe("Combo Família Burger");
      expect(result.current.details.downloadCount).toBe(0);
    });

    it("triggers download and records download metric via recordDownloadFn", async () => {
      const mockRecordDownload = vi.fn().mockResolvedValue({
        success: true,
        downloadCount: 1,
      });

      const { result } = renderHook(
        () =>
          useDeliveryOrder({
            initialDetails: mockDetails,
            recordDownloadFn: mockRecordDownload,
          }),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.triggerDownload("feed");
      });

      expect(mockRecordDownload).toHaveBeenCalledWith({
        data: {
          orderId: mockDetails.orderId,
          format: "feed",
        },
      });

      expect(result.current.details.downloadCount).toBe(1);
    });

    it("updates details state when updateDetails is called", () => {
      const { result } = renderHook(
        () => useDeliveryOrder({ initialDetails: mockDetails }),
        { wrapper: createWrapper() },
      );

      const updated: DeliveryDetailsResult = {
        ...mockDetails,
        offerTitle: "Combo Premium Burger",
        remainingRegenerations: 2,
        regenerationsUsed: 1,
      };

      act(() => {
        result.current.updateDetails(updated);
      });

      expect(result.current.details.offerTitle).toBe("Combo Premium Burger");
      expect(result.current.details.remainingRegenerations).toBe(2);
    });
  });

  describe("useCardRegeneration", () => {
    it("calls regenerationFn and triggers onSuccess callback", async () => {
      const updatedDetails: DeliveryDetailsResult = {
        ...mockDetails,
        offerTitle: "Super Combo Refinado",
        remainingRegenerations: 2,
        regenerationsUsed: 1,
      };

      const mockRegenFn = vi.fn().mockResolvedValue(updatedDetails);
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () =>
          useCardRegeneration({
            orderId: mockDetails.orderId,
            regenerationFn: mockRegenFn,
            onSuccess,
          }),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.regenerate({
          offerTitle: "Super Combo Refinado",
          promoPrice: "R$ 49,90",
        });
      });

      expect(mockRegenFn).toHaveBeenCalledWith({
        data: {
          orderId: mockDetails.orderId,
          offerTitle: "Super Combo Refinado",
          promoPrice: "R$ 49,90",
        },
      });

      expect(onSuccess).toHaveBeenCalledWith(updatedDetails);
    });

    it("handles error and triggers onError callback", async () => {
      const mockRegenFn = vi
        .fn()
        .mockRejectedValue(new Error("Cota de 3 ajustes excedida"));
      const onError = vi.fn();

      const { result } = renderHook(
        () =>
          useCardRegeneration({
            orderId: mockDetails.orderId,
            regenerationFn: mockRegenFn,
            onError,
          }),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        try {
          await result.current.regenerate({
            offerTitle: "Tentativa Inválida",
          });
        } catch {
          // Capturado pelo hook
        }
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(result.current.error?.message).toBe(
          "Cota de 3 ajustes excedida",
        );
      });
    });
  });
});
