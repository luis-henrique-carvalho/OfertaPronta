import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateOrderWhatsappFn,
  regenerateExpiredChargeFn,
  simulateDevPaymentFn,
} from "../server/functions/checkout.functions";
import type { CheckoutDetailsResult } from "../data/checkout.schemas";

export interface UsePixCheckoutOptions {
  orderId: string;
  updateWhatsappFn?: (args: {
    data: { orderId: string; whatsapp: string };
  }) => Promise<{ success: boolean }>;
  regenerateFn?: (args: {
    data: { orderId: string };
  }) => Promise<CheckoutDetailsResult>;
  simulatePaymentFn?: (args: {
    data: { orderId: string };
  }) => Promise<{ success: boolean; orderId: string }>;
}

function usePixClipboard() {
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const copyPixCode = useCallback(async (code: string): Promise<boolean> => {
    if (!code) return false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setIsCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 2500);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isCopied, copyPixCode };
}

export function usePixCheckout({
  orderId,
  updateWhatsappFn = updateOrderWhatsappFn,
  regenerateFn = regenerateExpiredChargeFn,
  simulatePaymentFn = simulateDevPaymentFn,
}: UsePixCheckoutOptions) {
  const queryClient = useQueryClient();
  const { isCopied, copyPixCode } = usePixClipboard();

  const updateWhatsappMutation = useMutation({
    mutationFn: async (whatsapp: string) => {
      return updateWhatsappFn({ data: { orderId, whatsapp } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["order-checkout-details", orderId],
      });
    },
  });

  const regenerateChargeMutation = useMutation({
    mutationFn: async () => {
      return regenerateFn({ data: { orderId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["order-checkout-details", orderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["order-payment-status", orderId],
      });
    },
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: async () => {
      return simulatePaymentFn({ data: { orderId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["order-payment-status", orderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["order-checkout-details", orderId],
      });
    },
  });

  return {
    copyPixCode,
    isCopied,
    updateWhatsapp: updateWhatsappMutation.mutateAsync,
    isUpdatingWhatsapp: updateWhatsappMutation.isPending,
    updateWhatsappError: updateWhatsappMutation.error,
    regenerateCharge: regenerateChargeMutation.mutateAsync,
    isRegenerating: regenerateChargeMutation.isPending,
    regenerateError: regenerateChargeMutation.error,
    simulatePayment: simulatePaymentMutation.mutateAsync,
    isSimulatingPayment: simulatePaymentMutation.isPending,
    simulatePaymentError: simulatePaymentMutation.error,
  };
}
