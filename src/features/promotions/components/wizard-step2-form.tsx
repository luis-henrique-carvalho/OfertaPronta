import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Wand2, Sparkles } from "lucide-react";
import type { useOfferBriefDraft } from "../hooks/use-offer-brief-draft";
import type { SEGMENT_CATALOG } from "../data/offer-brief.schema";
import { OfferDetailsFormCard } from "./offer-details-form-card";
import { FlexibleVisualInputs } from "./flexible-visual-inputs";
import { AiGenerationErrorAlert } from "./ai-generation-error-alert";

export interface WizardStep2FormProps {
  draft: ReturnType<typeof useOfferBriefDraft>;
  currentCatalog: (typeof SEGMENT_CATALOG)[keyof typeof SEGMENT_CATALOG];
  quotaRemainingLabel?: string | null;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export function WizardStep2Form({
  draft,
  currentCatalog,
  quotaRemainingLabel,
  onPrevStep,
  onNextStep,
}: WizardStep2FormProps) {
  return (
    <div className="flex flex-col gap-6">
      {draft.generationError &&
        draft.generationError.code !== "AI_QUOTA_EXCEEDED" && (
          <AiGenerationErrorAlert
            message={draft.generationError.message}
            disabled={draft.isGenerating || draft.isSaving}
            onRetry={onNextStep}
          />
        )}

      <OfferDetailsFormCard
        currentCatalog={currentCatalog}
        targetAspectRatio={draft.targetAspectRatio}
        businessName={draft.businessName}
        offerTitle={draft.offerTitle}
        promoPrice={draft.promoPrice}
        originalPrice={draft.originalPrice}
        callToAction={draft.callToAction}
        whatsapp={draft.whatsapp}
        validationErrors={draft.validationErrors}
        onTargetAspectRatioChange={draft.setTargetAspectRatio}
        onBusinessNameChange={draft.setBusinessName}
        onOfferTitleChange={draft.setOfferTitle}
        onPromoPriceChange={draft.setPromoPrice}
        onOriginalPriceChange={draft.setOriginalPrice}
        onCallToActionChange={draft.setCallToAction}
        onWhatsappChange={draft.setWhatsapp}
      />

      <FlexibleVisualInputs
        segment={draft.businessSegment}
        productImageDataUrl={draft.productImageDataUrl}
        referenceImageDataUrl={draft.referenceImageDataUrl}
        stylePresetId={draft.stylePresetId}
        customStyleInstructions={draft.customStyleInstructions}
        onProductImageChange={draft.setProductImageDataUrl}
        onReferenceImageChange={draft.setReferenceImageDataUrl}
        onStylePresetChange={draft.setStylePresetId}
        onCustomStyleInstructionsChange={draft.setCustomStyleInstructions}
        onApplyExample={draft.applyExample}
      />

      {quotaRemainingLabel && (
        <div
          data-testid="quota-counter"
          className="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span>{quotaRemainingLabel}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={draft.isGenerating || draft.isSaving}
          onClick={onPrevStep}
          className="h-13 w-1/3 rounded-xl border-border font-semibold text-xs sm:text-sm px-2"
        >
          <ArrowLeft className="size-4 mr-1 shrink-0" />
          <span>Voltar</span>
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={draft.isSaving || draft.isGenerating}
          onClick={onNextStep}
          className="h-13 w-2/3 rounded-xl bg-primary text-xs sm:text-base font-bold shadow-md hover:bg-primary/90 px-3 whitespace-normal break-words text-center"
        >
          {draft.isGenerating ? (
            <>
              <Spinner className="size-4 mr-1.5 shrink-0" />
              <span>Gerando arte com IA...</span>
            </>
          ) : draft.isSaving ? (
            <>
              <Spinner className="size-4 mr-1.5 shrink-0" />
              <span>Salvando dados...</span>
            </>
          ) : (
            <>
              <span>Gerar Prévia com IA</span>
              <Wand2 className="size-4 sm:size-5 ml-1 shrink-0" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
