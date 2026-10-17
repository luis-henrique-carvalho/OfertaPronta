import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkPaymentStatusFn } from "../server/functions/checkout.functions";
import type { CheckPaymentStatusResult } from "../data/checkout.schemas";

export interface UseOrderPollingOptions {
  orderId: string;
  initialStatus?: string;
  enabled?: boolean;
  onPaymentConfirmed?: () => void;
  checkStatusFn?: (args: {
    data: { orderId: string };
  }) => Promise<CheckPaymentStatusResult>;
}

export function useOrderPolling({
  orderId,
  initialStatus = "PENDING",
  enabled = true,
  onPaymentConfirmed,
  checkStatusFn = checkPaymentStatusFn,
}: UseOrderPollingOptions) {
  const hasTriggeredRef = useRef(false);

  const isInitiallyTerminal =
    initialStatus === "PAID" ||
    initialStatus === "CANCELLED" ||
    initialStatus === "EXPIRED";

  const query = useQuery({
    queryKey: ["order-payment-status", orderId],
    queryFn: () => checkStatusFn({ data: { orderId } }),
    enabled: Boolean(orderId) && enabled && !isInitiallyTerminal,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) {
        return initialStatus === "PENDING" ? 3000 : false;
      }
      if (
        data.isPaid ||
        data.status === "PAID" ||
        data.status === "CANCELLED" ||
        data.status === "EXPIRED"
      ) {
        return false;
      }
      return 3000;
    },
    refetchOnWindowFocus: true,
  });

  const isPaid =
    query.data?.isPaid ||
    query.data?.status === "PAID" ||
    initialStatus === "PAID";
  const status = query.data?.status || initialStatus;

  useEffect(() => {
    if (isPaid && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      onPaymentConfirmed?.();
    }
  }, [isPaid, onPaymentConfirmed]);

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    status,
    isPaid: Boolean(isPaid),
    isExpired: status === "EXPIRED",
    isCancelled: status === "CANCELLED",
    isPending: status === "PENDING",
  };
}
