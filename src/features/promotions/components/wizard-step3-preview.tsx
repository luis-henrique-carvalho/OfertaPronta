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
  const hasLastDraft = Boolean(
    draft.previewCardImageUrl || draft.lastDraft?.previewCardImageUrl,
  );
  const activePreviewUrl =
    draft.previewCardImageUrl ?? draft.lastDraft?.previewCardImageUrl ?? null;
  const activeBusinessName =
    draft.businessName || draft.lastDraft?.businessName || "";
  const activeOfferTitle =
    draft.offerTitle || draft.lastDraft?.offerTitle || "";
  const activePromoPrice =
    draft.promoPrice || draft.lastDraft?.promoPrice || "";
  const activeSegment =
    draft.businessSegment || draft.lastDraft?.businessSegment || "supermarket";

  return (
    <div className="flex flex-col gap-6">
      {isQuotaExceeded && (
        <AiQuotaExceededAlert
          reason={draft.limitReason ?? "visitor"}
          hasLastDraft={hasLastDraft}
          onCheckout={onCheckout}
          isInitiatingCheckout={isInitiatingCheckout}
        />
      )}

      {checkoutError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription className="text-xs">
            {checkoutError}
          </AlertDescription>
        </Alert>
      )}

      <LiveCardPreview
        businessSegment={activeSegment}
        businessName={activeBusinessName}
        offerTitle={activeOfferTitle}
        promoPrice={activePromoPrice}
        originalPrice={draft.originalPrice ?? draft.lastDraft?.originalPrice}
        callToAction={draft.callToAction ?? draft.lastDraft?.callToAction}
        whatsapp={draft.whatsapp ?? draft.lastDraft?.whatsapp}
        previewCardImageUrl={activePreviewUrl}
        productImageDataUrl={
          draft.productImageDataUrl ?? draft.lastDraft?.productImageDataUrl
        }
        referenceImageDataUrl={
          draft.referenceImageDataUrl ?? draft.lastDraft?.referenceImageDataUrl
        }
        stylePresetId={draft.stylePresetId ?? draft.lastDraft?.stylePresetId}
        targetAspectRatio={
          draft.targetAspectRatio ?? draft.lastDraft?.targetAspectRatio
        }
        showWatermark={true}
      />

      <PreviewCheckoutActionCard
        isQuotaExceeded={isQuotaExceeded}
        hasDraft={hasLastDraft}
        isLoading={isInitiatingCheckout}
        onPrevStep={onPrevStep}
        onCheckout={onCheckout}
      />
    </div>
  );
}
