import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  updateOrderWhatsappFn,
  regenerateExpiredChargeFn,
  simulateDevPaymentFn,
  updateOrderCobrandingFn,
} from "../server/functions/checkout.functions";
import type { CheckoutDetailsResult } from "../data/checkout.schemas";
import { calculateCobrandingPrice } from "@/lib/campaign-catalog";

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
  updateCobrandingFn?: (args: {
    data: { orderId: string; cobrandingAccepted: boolean };
  }) => Promise<CheckoutDetailsResult>;
  onCobrandingSuccess?: (details: CheckoutDetailsResult) => void;
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

interface UseCobrandingMutationOptions {
  orderId: string;
  updateCobrandingFn: (args: {
    data: { orderId: string; cobrandingAccepted: boolean };
  }) => Promise<CheckoutDetailsResult>;
  onCobrandingSuccess?: (details: CheckoutDetailsResult) => void;
}

function useCobrandingMutation({
  orderId,
  updateCobrandingFn,
  onCobrandingSuccess,
}: UseCobrandingMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<
    CheckoutDetailsResult,
    Error,
    boolean,
    { previousDetails?: CheckoutDetailsResult }
  >({
    mutationFn: async (accepted: boolean) => {
      return updateCobrandingFn({
        data: { orderId, cobrandingAccepted: accepted },
      });
    },
    onMutate: async (accepted: boolean) => {
      await queryClient.cancelQueries({
        queryKey: ["order-checkout-details", orderId],
      });
      const previousDetails = queryClient.getQueryData<CheckoutDetailsResult>([
        "order-checkout-details",
        orderId,
      ]);

      if (previousDetails) {
        const originalAmount = previousDetails.originalAmountCents ?? 990;
        const discountPercent = previousDetails.cobrandingDiscountPercent ?? 30;
        const calc = calculateCobrandingPrice(originalAmount, discountPercent);
        queryClient.setQueryData<CheckoutDetailsResult>(
          ["order-checkout-details", orderId],
          {
            ...previousDetails,
            cobrandingAccepted: accepted,
            amountCents: accepted ? calc.amountCents : originalAmount,
          },
        );
      }

      return { previousDetails };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDetails) {
        queryClient.setQueryData(
          ["order-checkout-details", orderId],
          context.previousDetails,
        );
      }
      toast.error(
        "Não foi possível atualizar a opção de desconto. Tente novamente.",
      );
    },
    onSuccess: (updatedDetails) => {
      queryClient.setQueryData(
        ["order-checkout-details", orderId],
        updatedDetails,
      );
      queryClient.invalidateQueries({
        queryKey: ["order-checkout-details", orderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["order-payment-status", orderId],
      });
      onCobrandingSuccess?.(updatedDetails);
    },
  });
}

export function usePixCheckout({
  orderId,
  updateWhatsappFn = updateOrderWhatsappFn,
  regenerateFn = regenerateExpiredChargeFn,
  simulatePaymentFn = simulateDevPaymentFn,
  updateCobrandingFn = updateOrderCobrandingFn,
  onCobrandingSuccess,
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

  const updateCobrandingMutation = useCobrandingMutation({
    orderId,
    updateCobrandingFn,
    onCobrandingSuccess,
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
    toggleCobranding: updateCobrandingMutation.mutateAsync,
    isUpdatingCobranding: updateCobrandingMutation.isPending,
    updateCobrandingError: updateCobrandingMutation.error,
  };
}
