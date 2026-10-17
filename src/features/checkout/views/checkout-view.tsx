import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2, ArrowLeft, Store } from "lucide-react";
import type { CheckoutDetailsResult } from "../data/checkout.schemas";
import { useOrderPolling } from "../hooks/use-order-polling";
import { usePixCheckout } from "../hooks/use-pix-checkout";
import { OrderSummaryCard } from "../components/order-summary-card";
import { PixCopiaEColaCard } from "../components/pix-copia-cola-card";
import { PixQrCodeCard } from "../components/pix-qr-code-card";
import { PaymentPollingIndicator } from "../components/payment-polling-indicator";
import { OrderWhatsappRecoveryCard } from "../components/order-whatsapp-recovery-card";

export interface CheckoutViewProps {
  initialDetails: CheckoutDetailsResult;
  onNavigateToDelivery?: (orderId: string) => void;
  onNavigateBack?: () => void;
}

export function CheckoutView({
  initialDetails,
  onNavigateToDelivery,
  onNavigateBack,
}: CheckoutViewProps) {
  const [details, setDetails] = useState<CheckoutDetailsResult>(initialDetails);
  const [isSuccessPaid, setIsSuccessPaid] = useState(
    initialDetails.status === "PAID",
  );

  let navigateHook: ReturnType<typeof useNavigate> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigateHook = useNavigate();
  } catch {
    navigateHook = null;
  }

  const handleDeliveryNavigation = (orderId: string) => {
    setIsSuccessPaid(true);
    setTimeout(() => {
      if (onNavigateToDelivery) {
        onNavigateToDelivery(orderId);
      } else if (navigateHook) {
        navigateHook({
          href: `/pedido/${orderId}`,
        });
      } else if (typeof window !== "undefined") {
        window.location.href = `/pedido/${orderId}`;
      }
    }, 1200);
  };

  const { isPaid, status, isExpired, refetch, isFetching } = useOrderPolling({
    orderId: details.orderId,
    initialStatus: details.status,
    onPaymentConfirmed: () => {
      handleDeliveryNavigation(details.orderId);
    },
  });

  const {
    copyPixCode,
    isCopied,
    updateWhatsapp,
    isUpdatingWhatsapp,
    regenerateCharge,
    isRegenerating,
  } = usePixCheckout({
    orderId: details.orderId,
  });

  const handleRegenerate = async () => {
    try {
      const refreshed = await regenerateCharge();
      if (refreshed) {
        setDetails(refreshed);
      }
    } catch {
      // Falha tratada pelo hook
    }
  };

  const handleCheckNow = () => {
    refetch();
  };

  const frozen = details.frozenSnapshot as {
    offerTitle?: string;
    businessName?: string;
    previewCardImageUrl?: string;
    targetAspectRatio?: string;
    whatsapp?: string;
  };

  const offerTitle = frozen.offerTitle || "Oferta Especial";
  const businessName = frozen.businessName || null;
  const previewCardImageUrl = frozen.previewCardImageUrl || null;
  const targetAspectRatio = frozen.targetAspectRatio || "feed";
  const initialWhatsapp = details.customerWhatsapp || frozen.whatsapp || null;

  if (isPaid || isSuccessPaid) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <Card className="w-full border-primary/20 bg-card p-6 shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 p-0">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-10 text-emerald-500" />
            </div>

            <div className="flex flex-col gap-1">
              <Typography variant="h3" className="text-xl font-black">
                Pagamento Pix Confirmado!
              </Typography>
              <Typography variant="muted" className="text-xs">
                Seu card em alta definição sem marca d&apos;água está sendo
                liberado...
              </Typography>
            </div>

            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
              <ShieldCheck className="size-3.5 text-primary" />
              Redirecionando para seu pedido
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
      {/* Top Header do Checkout */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onNavigateBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onNavigateBack}
              className="size-9 rounded-lg"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div className="flex items-center gap-1.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Store className="size-3.5" />
            </div>
            <Typography variant="h4" className="text-sm font-bold">
              Oferta<span className="text-primary">Pronta</span>
            </Typography>
          </div>
        </div>

        <Badge
          variant="secondary"
          className="gap-1 px-2.5 py-0.5 text-[11px] font-semibold"
        >
          <ShieldCheck className="size-3 text-emerald-500" />
          Checkout Seguro Pix
        </Badge>
      </div>

      {/* Resumo do Pedido */}
      <OrderSummaryCard
        amountCents={details.amountCents}
        offerTitle={offerTitle}
        businessName={businessName}
        previewCardImageUrl={previewCardImageUrl}
        targetAspectRatio={targetAspectRatio}
      />

      {/* Indicador de Status / Polling em Tempo Real */}
      <PaymentPollingIndicator
        status={status}
        expiresAt={details.charge?.expiresAt}
        isChecking={isFetching}
        onCheckNow={handleCheckNow}
        onRegenerateCharge={handleRegenerate}
        isRegenerating={isRegenerating}
      />

      {/* Copia e Cola Pix */}
      {!isExpired && details.charge?.copiaECola && (
        <PixCopiaEColaCard
          copiaECola={details.charge.copiaECola}
          isCopied={isCopied}
          onCopy={copyPixCode}
        />
      )}

      {/* QR Code Visual Pix */}
      {!isExpired && details.charge?.qrCodeBase64 && (
        <PixQrCodeCard
          qrCodeBase64={details.charge.qrCodeBase64}
          defaultOpen={false}
        />
      )}

      {/* WhatsApp para Envio do Link de Download */}
      <OrderWhatsappRecoveryCard
        initialWhatsapp={initialWhatsapp}
        onSaveWhatsapp={updateWhatsapp}
        isSaving={isUpdatingWhatsapp}
      />

      {/* Segurança e Rodapé */}
      <div className="flex flex-col items-center gap-1 py-3 text-center">
        <Typography
          variant="muted"
          className="text-[11px] text-muted-foreground"
        >
          Pagamento processado com segurança via Pix Dinâmico Pushin Pay.
        </Typography>
      </div>
    </div>
  );
}
