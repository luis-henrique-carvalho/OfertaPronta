import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderDeliveryDetailsFn } from "../server/functions/delivery.functions";
import type {
  DeliveryDetailsResult,
  DownloadFormat,
} from "../data/delivery.schemas";

export interface UseDeliveryOrderOptions {
  initialDetails: DeliveryDetailsResult;
  getOrderDetailsFn?: (args: {
    data: { orderId: string };
  }) => Promise<DeliveryDetailsResult>;
  recordDownloadFn?: (args: {
    data: { orderId: string; format: DownloadFormat };
  }) => Promise<{ success: boolean; downloadCount: number }>;
}

function triggerBrowserFileDownload(
  orderId: string,
  format: DownloadFormat,
): void {
  if (typeof window === "undefined") return;
  const link = document.createElement("a");
  link.href = `/api/delivery/download?orderId=${orderId}&format=${format}`;
  link.download = `ofertapronta-${format}-${orderId}.png`;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function updateOptimisticDownloadCount(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
  setDetails: React.Dispatch<React.SetStateAction<DeliveryDetailsResult>>,
): void {
  setDetails((prev) => ({
    ...prev,
    downloadCount: prev.downloadCount + 1,
  }));
  queryClient.setQueryData(
    ["order-delivery-details", orderId],
    (old: DeliveryDetailsResult | undefined) =>
      old ? { ...old, downloadCount: old.downloadCount + 1 } : old,
  );
}

export function useDeliveryOrder({
  initialDetails,
  getOrderDetailsFn = getOrderDeliveryDetailsFn,
  recordDownloadFn,
}: UseDeliveryOrderOptions) {
  const queryClient = useQueryClient();
  const [details, setDetails] = useState<DeliveryDetailsResult>(initialDetails);
  const [activeDownloadFormat, setActiveDownloadFormat] =
    useState<DownloadFormat | null>(null);

  const orderId = details.orderId;

  const query = useQuery({
    queryKey: ["order-delivery-details", orderId],
    queryFn: async () => {
      const result = await getOrderDetailsFn({ data: { orderId } });
      setDetails(result);
      return result;
    },
    initialData: initialDetails,
    enabled: Boolean(orderId),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: recordDownloadMutateAsync } = useMutation({
    mutationFn: async (format: DownloadFormat) => {
      if (!recordDownloadFn) {
        return { success: true, downloadCount: details.downloadCount + 1 };
      }
      return recordDownloadFn({ data: { orderId, format } });
    },
    onSuccess: (res) => {
      setDetails((prev) => ({ ...prev, downloadCount: res.downloadCount }));
      queryClient.setQueryData(
        ["order-delivery-details", orderId],
        (old: DeliveryDetailsResult | undefined) =>
          old ? { ...old, downloadCount: res.downloadCount } : old,
      );
    },
  });

  const triggerDownload = useCallback(
    async (format: DownloadFormat) => {
      setActiveDownloadFormat(format);
      try {
        triggerBrowserFileDownload(orderId, format);
        if (recordDownloadFn) {
          await recordDownloadMutateAsync(format);
        } else {
          updateOptimisticDownloadCount(queryClient, orderId, setDetails);
        }
      } catch {
        // Fallback silencioso
      } finally {
        setActiveDownloadFormat(null);
      }
    },
    [orderId, recordDownloadFn, recordDownloadMutateAsync, queryClient],
  );

  const updateDetails = useCallback(
    (newDetails: DeliveryDetailsResult) => {
      setDetails(newDetails);
      queryClient.setQueryData(
        ["order-delivery-details", newDetails.orderId],
        newDetails,
      );
    },
    [queryClient],
  );

  return {
    details,
    updateDetails,
    triggerDownload,
    isDownloading: activeDownloadFormat !== null,
    activeDownloadFormat,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
