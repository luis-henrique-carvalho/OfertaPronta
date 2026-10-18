import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, PlusCircle, ShieldCheck } from "lucide-react";
import type {
  DeliveryDetailsResult,
  DownloadFormat,
  RequestRegenerationInput,
} from "../data/delivery.schemas";
import { useDeliveryOrder } from "../hooks/use-delivery-order";
import { DeliveryHeaderStatus } from "../components/delivery-header-status";
import { AdCardDeliveryPreview } from "../components/ad-card-delivery-preview";
import { DownloadActionsCard } from "../components/download-actions-card";
import { OrderWhatsappShareCard } from "../components/order-whatsapp-share-card";
import { AiRegenerationPanel } from "../components/ai-regeneration-panel";

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

  const handleCreateNew = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (typeof window !== "undefined") {
      window.location.href = "/criar";
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-5 sm:max-w-xl sm:py-7">
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
            variant="secondary"
            className="hidden sm:inline-flex gap-1 px-2.5 py-0.5 text-[11px] font-semibold"
          >
            <ShieldCheck className="size-3 text-emerald-500" />
            Entrega Garantida
          </Badge>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
            onClick={handleCreateNew}
          >
            <PlusCircle className="size-3.5" data-icon="inline-start" />
            <span>Nova Oferta</span>
          </Button>
        </div>
      </div>

      {/* 1. Banner Comemorativo de Pagamento Confirmado */}
      <DeliveryHeaderStatus
        offerTitle={details.offerTitle}
        businessName={details.businessName}
        businessSegment={details.businessSegment}
      />

      {/* 2. Visualizador HD com Alternância Feed e Story */}
      <AdCardDeliveryPreview
        feedCardUrl={details.feedCardUrl}
        storyCardUrl={details.storyCardUrl}
        offerTitle={details.offerTitle}
      />

      {/* 3. Ações Diretas de Download em PNG HD */}
      <DownloadActionsCard
        orderId={details.orderId}
        downloadCount={details.downloadCount}
        onDownload={triggerDownload}
        isDownloading={isDownloading}
        activeFormat={activeDownloadFormat}
      />

      {/* 4. Compartilhamento e Acesso Fácil via WhatsApp */}
      <OrderWhatsappShareCard
        orderId={details.orderId}
        offerTitle={details.offerTitle}
        permanentOrderUrl={details.permanentOrderUrl}
        customerWhatsapp={details.customerWhatsapp}
      />

      {/* 5. Painel Retrátil de Refinamento com IA */}
      <AiRegenerationPanel
        orderId={details.orderId}
        offerTitle={details.offerTitle}
        canRegenerate={details.canRegenerate}
        regenerationsUsed={details.regenerationsUsed}
        maxRegenerations={details.maxRegenerations}
        remainingRegenerations={details.remainingRegenerations}
        regenerationWindowEndsAt={details.regenerationWindowEndsAt}
        onRegenerationSuccess={updateDetails}
        regenerationFn={regenerationFn}
      />

      {/* Rodapé de Confiança */}
      <div className="flex flex-col items-center gap-1 py-4 text-center">
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
          Link do pedido: {details.permanentOrderUrl}
        </Typography>
      </div>
    </div>
  );
}
