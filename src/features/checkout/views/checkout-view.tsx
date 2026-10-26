import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Typography } from "@/components/ui/typography";
import type { CheckoutDetailsResult } from "../data/checkout.schemas";
import { useOrderPolling } from "../hooks/use-order-polling";
import { usePixCheckout } from "../hooks/use-pix-checkout";
import { AdCardCheckoutShowcase } from "../components/ad-card-checkout-showcase";
import { CobrandingDiscountCard } from "../components/cobranding-discount-card";
import { UnifiedPixPaymentCard } from "../components/unified-pix-payment-card";
import { DevPaymentSimulatorCard } from "../components/dev-payment-simulator-card";
import { CheckoutPaidSuccessCard } from "../components/checkout-paid-success-card";
import { CheckoutHeader } from "../components/checkout-header";
import { StickyPixPaymentBar } from "../components/sticky-pix-payment-bar";
import { trackInitiateCheckout } from "@/lib/tracking";

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

  useEffect(() => {
    if (details.orderId && details.amountCents) {
      trackInitiateCheckout(details.orderId, details.amountCents);
    }
  }, [details.orderId, details.amountCents]);

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

  const { isPaid, status, refetch, isFetching } = useOrderPolling({
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
    simulatePayment,
    isSimulatingPayment,
    simulatePaymentError,
    toggleCobranding,
    isUpdatingCobranding,
  } = usePixCheckout({
    orderId: details.orderId,
    onCobrandingSuccess: (updated) => {
      setDetails(updated);
    },
  });

  const handleToggleCobranding = async (accepted: boolean) => {
    try {
      const updated = await toggleCobranding(accepted);
      if (updated) {
        setDetails(updated);
      }
    } catch {
      // Falha tratada pelo hook com rollback e toast
    }
  };

  const handleSimulatePayment = async () => {
    try {
      const result = await simulatePayment();
      if (result?.success) {
        handleDeliveryNavigation(details.orderId);
      }
    } catch {
      // Falha tratada pelo hook
    }
  };

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
    planName?: string | null;
    maxPostPaymentRegenerations?: number | null;
  };

  const offerTitle = frozen.offerTitle || "Oferta Especial";
  const businessName = frozen.businessName || null;
  const previewCardImageUrl = frozen.previewCardImageUrl || null;
  const targetAspectRatio = frozen.targetAspectRatio || "feed";
  const initialWhatsapp = details.customerWhatsapp || frozen.whatsapp || null;

  if (isPaid || isSuccessPaid) {
    return <CheckoutPaidSuccessCard />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 pb-24 sm:gap-6 sm:py-8 lg:pb-8">
      <CheckoutHeader onNavigateBack={onNavigateBack} />

      {/* Modo de Desenvolvimento: Simulação de Pagamento Pix */}
      {details.isDevMode && !isPaid && !isSuccessPaid && (
        <DevPaymentSimulatorCard
          onSimulatePayment={handleSimulatePayment}
          isSimulating={isSimulatingPayment}
          error={simulatePaymentError}
        />
      )}

      {/* Layout Responsivo:
          - Mobile (< lg): Showcase imponente no topo com a arte em destaque, seguido de Co-branding e Painel Pix completo. Barra fixa de pagamento sempre visível no rodapé.
          - Desktop (lg:): Grid de 2 colunas amplas com Showcase + Co-branding à esquerda e Painel Pix à direita (sticky, sem scroll).
      */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Showcase Visual do Card Gerado (colunas 1-5 linha 1 no desktop) */}
        <div className="lg:col-start-1 lg:col-span-5 lg:row-start-1">
          <AdCardCheckoutShowcase
            previewCardImageUrl={previewCardImageUrl}
            offerTitle={offerTitle}
            businessName={businessName}
            targetAspectRatio={targetAspectRatio}
            amountCents={details.amountCents}
            planName={frozen.planName}
            maxRegenerations={frozen.maxPostPaymentRegenerations}
            cobrandingAccepted={details.cobrandingAccepted}
            cobrandingCreditText={details.cobrandingCreditText}
          />
        </div>

        {/* Card de Desconto com Assinatura de Marca (Co-branding)
            colunas 1-5 linha 2 no desktop (logo abaixo do showcase)
        */}
        {details.cobrandingPromotionAvailable !== false && (
          <div className="lg:col-start-1 lg:col-span-5 lg:row-start-2">
            <CobrandingDiscountCard
              orderId={details.orderId}
              isAccepted={details.cobrandingAccepted ?? false}
              discountPercent={details.cobrandingDiscountPercent ?? 30}
              originalAmountCents={details.originalAmountCents ?? 990}
              discountedAmountCents={
                details.cobrandingAccepted ? details.amountCents : undefined
              }
              creditText={details.cobrandingCreditText}
              isUpdating={isUpdatingCobranding}
              onToggle={handleToggleCobranding}
            />
          </div>
        )}

        {/* Painel Unificado de Pagamento Pix
            colunas 6-12 linhas 1-2 no desktop (coluna direita completa, sticky no topo)
        */}
        <div
          id="pix-payment-section"
          className="flex flex-col gap-3 lg:col-start-6 lg:col-span-7 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-6"
        >
          <UnifiedPixPaymentCard
            copiaECola={details.charge?.copiaECola}
            qrCodeBase64={details.charge?.qrCodeBase64}
            amountCents={details.amountCents}
            status={status}
            expiresAt={details.charge?.expiresAt}
            isCopied={isCopied}
            onCopyPix={copyPixCode}
            isChecking={isFetching}
            onCheckNow={handleCheckNow}
            onRegenerateCharge={handleRegenerate}
            isRegenerating={isRegenerating}
            initialWhatsapp={initialWhatsapp}
            onSaveWhatsapp={updateWhatsapp}
            isSavingWhatsapp={isUpdatingWhatsapp}
          />

          {/* Segurança e Rodapé */}
          <div className="flex flex-col items-center gap-1 py-1 text-center">
            <Typography
              variant="muted"
              className="text-[11px] text-muted-foreground"
            >
              Pagamento processado com segurança via Pix Dinâmico Pushin Pay.
            </Typography>
          </div>
        </div>
      </div>

      {/* Barra Fixa de Pagamento no Rodapé para Mobile (Sticky Bottom Bar) */}
      <StickyPixPaymentBar
        amountCents={details.amountCents}
        copiaECola={details.charge?.copiaECola}
        isCopied={isCopied}
        onCopyPix={copyPixCode}
      />
    </div>
  );
}
