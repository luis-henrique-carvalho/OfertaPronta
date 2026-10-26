import { Typography } from "@/components/ui/typography";
import { AdCardCheckoutShowcase } from "./ad-card-checkout-showcase";
import { CobrandingDiscountCard } from "./cobranding-discount-card";
import { UnifiedPixPaymentCard } from "./unified-pix-payment-card";
import { StickyPixPaymentBar } from "./sticky-pix-payment-bar";
import type { CheckoutDetailsResult } from "../data/checkout.schemas";

export interface ResponsiveCheckoutLayoutProps {
  details: CheckoutDetailsResult;
  status: string;
  isCopied: boolean;
  isFetching: boolean;
  isRegenerating: boolean;
  isUpdatingCobranding: boolean;
  isUpdatingWhatsapp: boolean;
  initialWhatsapp: string | null;
  onCopyPix: (code: string) => void | Promise<unknown>;
  onCheckNow: () => void;
  onRegenerateCharge: () => Promise<void>;
  onSaveWhatsapp: (whatsapp: string) => Promise<unknown> | void;
  onToggleCobranding: (accepted: boolean) => Promise<void>;
}

export function ResponsiveCheckoutLayout({
  details,
  status,
  isCopied,
  isFetching,
  isRegenerating,
  isUpdatingCobranding,
  isUpdatingWhatsapp,
  initialWhatsapp,
  onCopyPix,
  onCheckNow,
  onRegenerateCharge,
  onSaveWhatsapp,
  onToggleCobranding,
}: ResponsiveCheckoutLayoutProps) {
  const frozen = details.frozenSnapshot as {
    offerTitle?: string;
    businessName?: string;
    promoPrice?: string;
    previewCardImageUrl?: string;
    targetAspectRatio?: string;
    planName?: string | null;
    maxPostPaymentRegenerations?: number | null;
  };

  const offerTitle = frozen.offerTitle || "Oferta Especial";
  const businessName = frozen.businessName || null;
  const previewCardImageUrl = frozen.previewCardImageUrl || null;
  const targetAspectRatio = frozen.targetAspectRatio || "feed";

  return (
    <>
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
            promoPrice={frozen.promoPrice}
            targetAspectRatio={targetAspectRatio}
            amountCents={details.amountCents}
            planName={frozen.planName}
            maxRegenerations={frozen.maxPostPaymentRegenerations}
            cobrandingAccepted={details.cobrandingAccepted}
            cobrandingCreditText={details.cobrandingCreditText}
          />
        </div>

        {/* Card de Desconto com Assinatura de Marca (Co-branding) */}
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
              onToggle={onToggleCobranding}
            />
          </div>
        )}

        {/* Painel Unificado de Pagamento Pix */}
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
            onCopyPix={onCopyPix}
            isChecking={isFetching}
            onCheckNow={onCheckNow}
            onRegenerateCharge={onRegenerateCharge}
            isRegenerating={isRegenerating}
            initialWhatsapp={initialWhatsapp}
            onSaveWhatsapp={onSaveWhatsapp}
            isSavingWhatsapp={isUpdatingWhatsapp}
          />

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
        onCopyPix={onCopyPix}
      />
    </>
  );
}
