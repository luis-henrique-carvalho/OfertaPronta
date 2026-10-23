import { useQuery } from "@tanstack/react-query";
import { getPreviewQuotaFn } from "../server/functions/generator.functions";
import type {
  BlockedReason,
  GetPreviewQuotaOutput,
} from "../data/offer-brief.schema";

export const PREVIEW_QUOTA_QUERY_KEY = ["free-preview-quota"] as const;

export type GetPreviewQuotaFunction = () => Promise<GetPreviewQuotaOutput>;

export interface UsePreviewQuotaOptions {
  getPreviewQuotaFn?: GetPreviewQuotaFunction;
  enabled?: boolean;
  refetchInterval?: number | false;
}

/**
 * Formata o texto descritivo amigável de prévias gratuitas restantes para o dia.
 */
export function formatRemainingQuotaLabel(
  remaining: number | null | undefined,
): string {
  if (remaining === null || remaining === undefined) {
    return "";
  }
  if (remaining === 0) {
    return "0 prévias grátis restantes hoje";
  }
  if (remaining === 1) {
    return "1 prévia grátis restante hoje";
  }
  return `${remaining} prévias grátis restantes hoje`;
}

/**
 * Formata a mensagem de bloqueio por motivo de esgotamento de cota.
 */
export function formatBlockedReasonMessage(
  reason: BlockedReason | null | undefined,
): string {
  switch (reason) {
    case "global":
      return "Prévias grátis esgotadas por hoje. Limite diário do serviço atingido.";
    case "ip":
      return "Limite de prévias gratuitas atingido para sua conexão local.";
    case "visitor":
    default:
      return "Você já utilizou suas 2 prévias grátis de hoje para este navegador.";
  }
}

/**
 * Hook para consulta reativa da cota diária de prévias gratuitas via TanStack Query.
 */
export function usePreviewQuota(options: UsePreviewQuotaOptions = {}) {
  const fetcher = options.getPreviewQuotaFn ?? (() => getPreviewQuotaFn());

  const query = useQuery({
    queryKey: PREVIEW_QUOTA_QUERY_KEY,
    queryFn: async (): Promise<GetPreviewQuotaOutput> => {
      return await fetcher();
    },
    enabled: options.enabled ?? true,
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: options.refetchInterval ?? false,
  });

  const remaining = query.data?.remaining ?? null;
  const blockedReason = query.data?.blockedReason ?? null;
  const isBlocked =
    blockedReason !== null ||
    (query.data !== undefined && query.data.remaining === 0);
  const remainingLabel = formatRemainingQuotaLabel(remaining);
  const blockedMessage = isBlocked
    ? formatBlockedReasonMessage(blockedReason)
    : null;

  return {
    data: query.data,
    error: query.error,
    isError: query.isError,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    status: query.status,
    remaining,
    blockedReason,
    isBlocked,
    remainingLabel,
    blockedMessage,
  };
}
