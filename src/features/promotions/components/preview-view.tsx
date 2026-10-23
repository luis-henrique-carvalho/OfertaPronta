import type { BlockedReason, DraftClientDto } from "../data/offer-brief.schema";
import { LiveCardPreview } from "./live-card-preview";
import { AiQuotaExceededAlert } from "./ai-quota-exceeded-alert";
import { PreviewCheckoutActionCard } from "./preview-checkout-action-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface PreviewViewProps {
  draft?: DraftClientDto | null;
  lastDraft?: DraftClientDto | null;
  isLimitReached?: boolean;
  limitReason?: BlockedReason | null;
  isInitiatingCheckout?: boolean;
  checkoutError?: string | null;
  onCheckout?: () => void;
  onPrevStep?: () => void;
  className?: string;
}

export function PreviewView({
  draft,
  lastDraft,
  isLimitReached = false,
  limitReason = "visitor",
  isInitiatingCheckout = false,
  checkoutError,
  onCheckout,
  onPrevStep,
  className,
}: PreviewViewProps) {
  const activeDraft = draft ?? lastDraft ?? null;
  const hasLastDraft = Boolean(activeDraft?.previewCardImageUrl);

  return (
    <div
      data-testid="preview-view"
      className={cn("flex flex-col gap-6", className)}
    >
      {isLimitReached && (
        <AiQuotaExceededAlert
          reason={limitReason}
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

      {activeDraft && (
        <LiveCardPreview
          businessSegment={activeDraft.businessSegment}
          businessName={activeDraft.businessName}
          offerTitle={activeDraft.offerTitle}
          promoPrice={activeDraft.promoPrice}
          originalPrice={activeDraft.originalPrice}
          callToAction={activeDraft.callToAction}
          whatsapp={activeDraft.whatsapp}
          previewCardImageUrl={activeDraft.previewCardImageUrl}
          productImageDataUrl={activeDraft.productImageDataUrl}
          referenceImageDataUrl={activeDraft.referenceImageDataUrl}
          stylePresetId={activeDraft.stylePresetId}
          targetAspectRatio={activeDraft.targetAspectRatio}
          showWatermark={true}
        />
      )}

      {onCheckout && (
        <PreviewCheckoutActionCard
          isQuotaExceeded={isLimitReached}
          hasDraft={hasLastDraft}
          isLoading={isInitiatingCheckout}
          onPrevStep={onPrevStep}
          onCheckout={onCheckout}
        />
      )}
    </div>
  );
}
