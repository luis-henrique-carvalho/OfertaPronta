// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePixCheckout } from "./use-pix-checkout";
import type { CheckoutDetailsResult } from "../data/checkout.schemas";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function createWrapper(
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

const baseDetails: CheckoutDetailsResult = {
  orderId: "order-123",
  draftId: "draft-xyz",
  status: "PENDING",
  amountCents: 990,
  originalAmountCents: 990,
  cobrandingAccepted: false,
  cobrandingPromotionAvailable: true,
  cobrandingDiscountPercent: 30,
  cobrandingCreditText: "Design por @ofertapronta",
  frozenSnapshot: {},
  charge: {
    txId: "tx-1",
    copiaECola: "pix-code",
    qrCodeBase64: "base64",
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    status: "PENDING",
  },
};

describe("usePixCheckout Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("copies Pix code to clipboard and temporarily sets isCopied to true", async () => {
    const { result } = renderHook(
      () =>
        usePixCheckout({
          orderId: "order-123",
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isCopied).toBe(false);

    let success = false;
    await act(async () => {
      success = await result.current.copyPixCode(
        "00020126580014br.gov.bcb.pix",
      );
    });

    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "00020126580014br.gov.bcb.pix",
    );
    expect(result.current.isCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(result.current.isCopied).toBe(false);
  });

  it("updates customer whatsapp via mutation", async () => {
    const mockUpdateWhatsappFn = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(
      () =>
        usePixCheckout({
          orderId: "order-123",
          updateWhatsappFn: mockUpdateWhatsappFn,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.updateWhatsapp("11988887777");
    });

    expect(mockUpdateWhatsappFn).toHaveBeenCalledWith({
      data: {
        orderId: "order-123",
        whatsapp: "11988887777",
      },
    });
  });

  it("regenerates expired charge via mutation", async () => {
    const mockRegenerateFn = vi.fn().mockResolvedValue({
      ...baseDetails,
      charge: {
        txId: "tx-new",
        copiaECola: "new-pix-code",
        qrCodeBase64: "data:image/png;base64,abc",
        expiresAt: new Date(Date.now() + 1800000).toISOString(),
        status: "PENDING",
      },
    });

    const { result } = renderHook(
      () =>
        usePixCheckout({
          orderId: "order-123",
          regenerateFn: mockRegenerateFn,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.regenerateCharge();
    });

    expect(mockRegenerateFn).toHaveBeenCalledWith({
      data: {
        orderId: "order-123",
      },
    });
  });

  it("toggles cobranding to true via mutation and triggers callback", async () => {
    const discountedDetails: CheckoutDetailsResult = {
      ...baseDetails,
      amountCents: 693,
      cobrandingAccepted: true,
      charge: {
        ...baseDetails.charge!,
        txId: "tx-discounted",
      },
    };

    const mockUpdateCobrandingFn = vi.fn().mockResolvedValue(discountedDetails);
    const mockOnSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        usePixCheckout({
          orderId: "order-123",
          updateCobrandingFn: mockUpdateCobrandingFn,
          onCobrandingSuccess: mockOnSuccess,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isUpdatingCobranding).toBe(false);

    let updatedResult: CheckoutDetailsResult | undefined;
    await act(async () => {
      updatedResult = await result.current.toggleCobranding(true);
    });

    expect(mockUpdateCobrandingFn).toHaveBeenCalledWith({
      data: {
        orderId: "order-123",
        cobrandingAccepted: true,
      },
    });
    expect(updatedResult).toEqual(discountedDetails);
    expect(mockOnSuccess).toHaveBeenCalledWith(discountedDetails);
    expect(result.current.isUpdatingCobranding).toBe(false);
  });

  it("toggles cobranding to false to restore original amount", async () => {
    const originalDetails: CheckoutDetailsResult = {
      ...baseDetails,
      amountCents: 990,
      cobrandingAccepted: false,
    };

    const mockUpdateCobrandingFn = vi.fn().mockResolvedValue(originalDetails);

    const { result } = renderHook(
      () =>
        usePixCheckout({
          orderId: "order-123",
          updateCobrandingFn: mockUpdateCobrandingFn,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.toggleCobranding(false);
    });

    expect(mockUpdateCobrandingFn).toHaveBeenCalledWith({
      data: {
        orderId: "order-123",
        cobrandingAccepted: false,
      },
    });
  });

  it("reverts optimistic state and displays toast on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(
      ["order-checkout-details", "order-123"],
      baseDetails,
    );

    const mockUpdateCobrandingFn = vi
      .fn()
      .mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(
      () =>
        usePixCheckout({
          orderId: "order-123",
          updateCobrandingFn: mockUpdateCobrandingFn,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      try {
        await result.current.toggleCobranding(true);
      } catch {
        // Expected mutation rejection
      }
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível atualizar a opção de desconto. Tente novamente.",
    );

    const cached = queryClient.getQueryData<CheckoutDetailsResult>([
      "order-checkout-details",
      "order-123",
    ]);
    expect(cached?.cobrandingAccepted).toBe(false);
    expect(cached?.amountCents).toBe(990);
  });
});
