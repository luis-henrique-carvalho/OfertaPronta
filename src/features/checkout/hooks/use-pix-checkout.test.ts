// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePixCheckout } from "./use-pix-checkout";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
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
      orderId: "order-123",
      draftId: "draft-xyz",
      status: "PENDING",
      amountCents: 990,
      frozenSnapshot: {},
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
});
