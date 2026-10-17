import { Alert, AlertDescription } from "@/components/ui/alert";
import type { useOfferBriefDraft } from "../hooks/use-offer-brief-draft";
import { LiveCardPreview } from "./live-card-preview";
import { PreviewCheckoutActionCard } from "./preview-checkout-action-card";
import { AiQuotaExceededAlert } from "./ai-quota-exceeded-alert";

export interface WizardStep3PreviewProps {
  isQuotaExceeded: boolean;
  checkoutError: string | null;
  draft: ReturnType<typeof useOfferBriefDraft>;
  isInitiatingCheckout: boolean;
  onPrevStep: () => void;
  onCheckout: () => void;
}

export function WizardStep3Preview({
  isQuotaExceeded,
  checkoutError,
  draft,
  isInitiatingCheckout,
  onPrevStep,
  onCheckout,
}: WizardStep3PreviewProps) {
  return (
    <div className="flex flex-col gap-6">
      {isQuotaExceeded && <AiQuotaExceededAlert />}

      {checkoutError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription className="text-xs">
            {checkoutError}
          </AlertDescription>
        </Alert>
      )}

      <LiveCardPreview
        businessSegment={draft.businessSegment}
        businessName={draft.businessName}
        offerTitle={draft.offerTitle}
        promoPrice={draft.promoPrice}
        originalPrice={draft.originalPrice}
        callToAction={draft.callToAction}
        whatsapp={draft.whatsapp}
        previewCardImageUrl={draft.previewCardImageUrl}
        productImageDataUrl={draft.productImageDataUrl}
        referenceImageDataUrl={draft.referenceImageDataUrl}
        stylePresetId={draft.stylePresetId}
        targetAspectRatio={draft.targetAspectRatio}
        showWatermark={true}
      />

      <PreviewCheckoutActionCard
        isQuotaExceeded={isQuotaExceeded}
        isLoading={isInitiatingCheckout}
        onPrevStep={onPrevStep}
        onCheckout={onCheckout}
      />
    </div>
  );
}
