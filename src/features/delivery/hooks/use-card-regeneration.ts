import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestCardRegenerationFn } from "../server/functions/delivery.functions";
import type {
  DeliveryDetailsResult,
  RequestRegenerationInput,
} from "../data/delivery.schemas";

export interface UseCardRegenerationOptions {
  orderId: string;
  onSuccess?: (updatedDetails: DeliveryDetailsResult) => void;
  onError?: (error: Error) => void;
  regenerationFn?: (args: {
    data: RequestRegenerationInput;
  }) => Promise<DeliveryDetailsResult>;
}

export type RegenerationFormInput = Omit<RequestRegenerationInput, "orderId">;

export function useCardRegeneration({
  orderId,
  onSuccess,
  onError,
  regenerationFn = requestCardRegenerationFn,
}: UseCardRegenerationOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: RegenerationFormInput) => {
      return regenerationFn({
        data: {
          orderId,
          ...input,
        },
      });
    },
    onSuccess: (updatedDetails) => {
      queryClient.setQueryData(
        ["order-delivery-details", orderId],
        updatedDetails,
      );
      onSuccess?.(updatedDetails);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  return {
    regenerate: mutation.mutateAsync,
    isRegenerating: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
    data: mutation.data,
  };
}
