// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOrderPolling } from "./use-order-polling";

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

describe("useOrderPolling Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches payment status and reports pending status", async () => {
    const mockCheckStatusFn = vi.fn().mockResolvedValue({
      status: "PENDING",
      isPaid: false,
    });

    const { result } = renderHook(
      () =>
        useOrderPolling({
          orderId: "order-123",
          checkStatusFn: mockCheckStatusFn,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.isPaid).toBe(false);

    await waitFor(() => {
      expect(mockCheckStatusFn).toHaveBeenCalledWith({
        data: { orderId: "order-123" },
      });
    });
  });

  it("invokes onPaymentConfirmed callback when status transitions to PAID", async () => {
    const onPaymentConfirmed = vi.fn();
    const mockCheckStatusFn = vi.fn().mockResolvedValue({
      status: "PAID",
      isPaid: true,
    });

    const { result } = renderHook(
      () =>
        useOrderPolling({
          orderId: "order-456",
          onPaymentConfirmed,
          checkStatusFn: mockCheckStatusFn,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isPaid).toBe(true);
    });

    expect(onPaymentConfirmed).toHaveBeenCalledTimes(1);
  });

  it("handles initialStatus PAID without firing polling", async () => {
    const onPaymentConfirmed = vi.fn();
    const mockCheckStatusFn = vi.fn();

    const { result } = renderHook(
      () =>
        useOrderPolling({
          orderId: "order-already-paid",
          initialStatus: "PAID",
          onPaymentConfirmed,
          checkStatusFn: mockCheckStatusFn,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPaid).toBe(true);
    expect(result.current.status).toBe("PAID");
    expect(mockCheckStatusFn).not.toHaveBeenCalled();
    expect(onPaymentConfirmed).toHaveBeenCalledTimes(1);
  });

  it("flags isExpired when status is EXPIRED", async () => {
    const mockCheckStatusFn = vi.fn().mockResolvedValue({
      status: "EXPIRED",
      isPaid: false,
    });

    const { result } = renderHook(
      () =>
        useOrderPolling({
          orderId: "order-expired",
          checkStatusFn: mockCheckStatusFn,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isExpired).toBe(true);
    });
  });
});
