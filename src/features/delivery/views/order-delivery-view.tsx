import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, PlusCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import type {
  DeliveryDetailsResult,
  DownloadFormat,
  RequestRegenerationInput,
} from "../data/delivery.schemas";
import { useDeliveryOrder } from "../hooks/use-delivery-order";
import { toAbsoluteOrderUrl } from "../lib/delivery-urls";
import { AdCardUnifiedDeliveryHero } from "../components/ad-card-unified-delivery-hero";
import { AiRegenerationQuickPanel } from "../components/ai-regeneration-quick-panel";
import { trackPurchase } from "@/lib/tracking";
import { PREVIEW_QUOTA_QUERY_KEY } from "@/features/promotions/hooks/use-preview-quota";

export interface OrderDeliveryViewProps {
  initialDetails: DeliveryDetailsResult;
  onNavigateHome?: () => void;
  getOrderDetailsFn?: (args: {
    data: { orderId: string };
  }) => Promise<DeliveryDetailsResult>;
  recordDownloadFn?: (args: {
    data: { orderId: string; format: DownloadFormat };
  }) => Promise<{ success: boolean; downloadCount: number }>;
  regenerationFn?: (args: {
    data: RequestRegenerationInput;
  }) => Promise<DeliveryDetailsResult>;
}

export function OrderDeliveryView({
  initialDetails,
  onNavigateHome,
  getOrderDetailsFn,
  recordDownloadFn,
  regenerationFn,
}: OrderDeliveryViewProps) {
  const queryClient = useQueryClient();
  const {
    details,
    updateDetails,
    triggerDownload,
    isDownloading,
    activeDownloadFormat,
  } = useDeliveryOrder({
    initialDetails,
    getOrderDetailsFn,
    recordDownloadFn,
  });

  useEffect(() => {
    if (details.status === "PAID") {
      const amountCents =
        details.frozenPlan?.amountCents ?? details.amountCents ?? 990;
      trackPurchase(details.orderId, amountCents);
      queryClient.invalidateQueries({ queryKey: PREVIEW_QUOTA_QUERY_KEY });
    }
  }, [
    details.status,
    details.orderId,
    details.frozenPlan?.amountCents,
    details.amountCents,
    queryClient,
  ]);

  const handleCreateNew = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (typeof window !== "undefined") {
      window.location.href = "/criar";
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3.5 px-4 py-4 sm:max-w-xl sm:py-6">
      {/* Barra de Navegação Superior */}
      <div className="flex items-center justify-between">
        <a href="/" className="flex items-center gap-1.5 focus:outline-none">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="size-3.5" />
          </div>
          <Typography variant="h4" className="text-sm font-bold tracking-tight">
            Oferta<span className="text-primary">Pronta</span>
          </Typography>
        </a>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden sm:inline-flex gap-1 border-emerald-600/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
          >
            <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
            Entrega Garantida
          </Badge>

          <div className="flex items-center gap-1.5">
            {details.status === "PAID" && (
              <Badge
                variant="outline"
                className="border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300"
              >
                +2 prévias grátis
              </Badge>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
              onClick={handleCreateNew}
              title="+2 prévias grátis liberadas para sua próxima arte"
            >
              <PlusCircle className="size-3.5" data-icon="inline-start" />
              <span>Nova Oferta</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Header Compacto e Discreto: Pagamento Confirmado + Título da Oferta */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <div className="flex items-center gap-1.5 truncate">
            <Badge
              variant="outline"
              className="border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300"
            >
              Pagamento Confirmado
            </Badge>
            <Typography
              variant="muted"
              className="truncate text-xs font-bold text-foreground"
            >
              {details.offerTitle}
            </Typography>
          </div>
        </div>

        {details.businessName && (
          <Typography
            variant="muted"
            className="hidden sm:inline text-xs text-muted-foreground shrink-0"
          >
            {details.businessName}
            {details.businessSegment ? ` • ${details.businessSegment}` : ""}
          </Typography>
        )}
      </div>

      {/* Hero Card Unificado: Preview HD + Tabs Feed/Story + Download Sincronizado + WhatsApp */}
      <AdCardUnifiedDeliveryHero
        orderId={details.orderId}
        feedCardUrl={details.feedCardUrl}
        storyCardUrl={details.storyCardUrl}
        offerTitle={details.offerTitle}
        businessName={details.businessName}
        businessSegment={details.businessSegment}
        permanentOrderUrl={details.permanentOrderUrl}
        customerWhatsapp={details.customerWhatsapp}
        downloadCount={details.downloadCount}
        remainingRegenerations={details.remainingRegenerations}
        onDownload={triggerDownload}
        onEditCard={() => {
          const el = document.getElementById("painel-edicao-ia");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }}
        isDownloading={isDownloading}
        activeFormat={activeDownloadFormat}
      />

      {/* Painel Rápido de Refinamento por Micro-Passos (ou Mensagem Acolhedora de Salvo) */}
      <AiRegenerationQuickPanel
        orderId={details.orderId}
        offerTitle={details.offerTitle}
        canRegenerate={details.canRegenerate}
        regenerationsUsed={details.regenerationsUsed}
        maxRegenerations={details.maxRegenerations}
        remainingRegenerations={details.remainingRegenerations}
        regenerationWindowEndsAt={details.regenerationWindowEndsAt}
        onRegenerationSuccess={updateDetails}
        regenerationFn={regenerationFn}
        onNavigateHome={handleCreateNew}
      />

      {/* Rodapé de Confiança e Link Permanente */}
      <div className="flex flex-col items-center gap-1 py-3 text-center">
        <Typography
          variant="muted"
          className="text-[11px] text-muted-foreground"
        >
          Suas artes em alta resolução estão salvas permanentemente no
          OfertaPronta.
        </Typography>
        <Typography
          variant="muted"
          className="text-[10px] text-muted-foreground/70"
        >
          Link do pedido: {toAbsoluteOrderUrl(details.permanentOrderUrl)}
        </Typography>
      </div>
    </div>
  );
}
