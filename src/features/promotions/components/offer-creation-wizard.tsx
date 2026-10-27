// shadcn-ignore: componente container orquestrador que coordena as etapas do wizard
import * as React from "react";
import { cn } from "@/lib/utils";
import type { SaveOfferDraftInput } from "../data/offer-brief.schema";
import { getCreationSegment } from "../data/creation-catalog";
import {
  useOfferBriefDraft,
  type SaveDraftFunction,
  type GeneratePreviewFunction,
  type InitiateCheckoutFunction,
} from "../hooks/use-offer-brief-draft";
import {
  usePreviewQuota,
  type GetPreviewQuotaFunction,
} from "../hooks/use-preview-quota";
import { ContextualAiLoader } from "./contextual-ai-loader";
import { AiQuotaExceededAlert } from "./ai-quota-exceeded-alert";
import { Step1SegmentSelect } from "./wizard/step1-segment-select";
import { Step2OfferDetails } from "./wizard/step2-offer-details";
import { Step3VisualAssets } from "./wizard/step3-visual-assets";
import { Step4StyleAndPalette } from "./wizard/step4-style-and-palette";
import { CreationFixedFooter } from "./wizard/creation-fixed-footer";
import { CreationProgressBar } from "./wizard/creation-progress-bar";
import { CreationErrorAlert } from "./wizard/creation-error-alert";

export interface OfferCreationWizardProps {
  initialDraft?: Partial<SaveOfferDraftInput> & {
    aiGenerationCount?: number;
    customStyleNote?: string;
  };
  saveDraftFn?: SaveDraftFunction;
  generatePreviewFn?: GeneratePreviewFunction;
  initiateCheckoutFn?: InitiateCheckoutFunction;
  getPreviewQuotaFn?: GetPreviewQuotaFunction;
  onNavigateToCheckout?: (orderId: string) => void;
  navigate?: (opts: { to: string; params: { orderId: string } }) => void;
  className?: string;
}

function navigateToCheckout(
  orderId: string,
  onNavigateToCheckout?: (orderId: string) => void,
  navigate?: (opts: { to: string; params: { orderId: string } }) => void,
) {
  if (onNavigateToCheckout) {
    onNavigateToCheckout(orderId);
  } else if (navigate) {
    navigate({
      to: "/checkout/$orderId",
      params: { orderId },
    });
  } else if (typeof window !== "undefined") {
    window.location.href = `/checkout/${orderId}`;
  }
}

export function OfferCreationWizard({
  initialDraft,
  saveDraftFn,
  generatePreviewFn,
  initiateCheckoutFn,
  getPreviewQuotaFn,
  onNavigateToCheckout,
  navigate,
  className,
}: OfferCreationWizardProps = {}) {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  const quota = usePreviewQuota({
    getPreviewQuotaFn,
  });

  const draft = useOfferBriefDraft({
    initialDraft,
    saveDraftFn,
    generatePreviewFn,
    initiateCheckoutFn,
  });

  const currentSegmentData = getCreationSegment(draft.businessSegment);

  const handleNext = () => {
    if (step === 2) {
      const isValid = draft.validateStep2();
      if (!isValid) return;
    }
    setStep((curr) => Math.min(4, curr + 1) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    setStep((curr) => Math.max(1, curr - 1) as 1 | 2 | 3 | 4);
  };

  const isQuotaBlocked = quota.isBlocked || draft.isLimitReached;

  const handleGenerate = async () => {
    if (isQuotaBlocked) {
      const result = await draft.checkoutWithoutPreview();
      if (result.success) {
        navigateToCheckout(result.orderId, onNavigateToCheckout, navigate);
      }
      return;
    }
    const result = await draft.generateCardAndInitiateCheckout();
    if (result.success) {
      navigateToCheckout(result.orderId, onNavigateToCheckout, navigate);
    }
  };

  const handleCheckoutLastDraft = async () => {
    const result = await draft.initiateLastDraftCheckout();
    if (result.success) {
      navigateToCheckout(result.orderId, onNavigateToCheckout, navigate);
    }
  };

  return (
    <div
      data-testid="offer-creation-wizard"
      className={cn(
        "flex min-h-[calc(100vh-120px)] flex-col justify-between pb-28",
        className,
      )}
    >
      {/* Barra de Progresso Mobile-First */}
      <CreationProgressBar step={step} />

      {/* Conteúdo Central do Passo Atual */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-5 pb-6">
        {draft.isLimitReached && (
          <AiQuotaExceededAlert
            reason={draft.limitReason}
            hasLastDraft={Boolean(draft.previewCardImageUrl || draft.lastDraft)}
            onCheckout={handleCheckoutLastDraft}
            isInitiatingCheckout={draft.isInitiatingCheckout}
            className="mb-4"
          />
        )}

        {draft.generationError && !draft.isLimitReached && (
          <CreationErrorAlert
            message={draft.generationError.message}
            onDismiss={draft.clearGenerationError}
          />
        )}

        {step === 1 && (
          <Step1SegmentSelect
            segment={draft.businessSegment}
            targetAspectRatio={draft.targetAspectRatio}
            onSelectSegment={(newSegment) => {
              draft.setBusinessSegment(newSegment);
              const firstStyle = getCreationSegment(newSegment).styles[0]?.id;
              if (firstStyle) {
                draft.setStylePresetId(firstStyle);
              }
            }}
            onTargetAspectRatioChange={draft.setTargetAspectRatio}
          />
        )}

        {step === 2 && (
          <Step2OfferDetails
            segmentData={currentSegmentData}
            intent={draft.cardIntent}
            customIntentText={draft.customIntentText}
            businessName={draft.businessName}
            offerTitle={draft.offerTitle}
            promoPrice={draft.promoPrice}
            validationErrors={draft.validationErrors}
            onIntentChange={draft.setCardIntent}
            onCustomIntentTextChange={draft.setCustomIntentText}
            onBusinessNameChange={draft.setBusinessName}
            onOfferTitleChange={draft.setOfferTitle}
            onPromoPriceChange={draft.setPromoPrice}
          />
        )}

        {step === 3 && (
          <Step3VisualAssets
            productImageDataUrl={draft.productImageDataUrl}
            referenceImageDataUrl={draft.referenceImageDataUrl}
            logoImageDataUrl={draft.logoImageDataUrl}
            onProductImageChange={draft.setProductImageDataUrl}
            onReferenceImageChange={draft.setReferenceImageDataUrl}
            onLogoImageChange={draft.setLogoImageDataUrl}
            onSkipAllImages={() => {
              draft.setProductImageDataUrl(undefined);
              draft.setReferenceImageDataUrl(undefined);
              draft.setLogoImageDataUrl(undefined);
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <Step4StyleAndPalette
            segmentData={currentSegmentData}
            selectedStyleId={draft.stylePresetId}
            businessName={draft.businessName}
            offerTitle={draft.offerTitle}
            promoPrice={draft.promoPrice}
            productImageDataUrl={draft.productImageDataUrl}
            referenceImageDataUrl={draft.referenceImageDataUrl}
            customStyleNote={draft.customStyleNote}
            onSelectStyle={draft.setStylePresetId}
            onSelectReference={draft.setReferenceFromShowcase}
            onClearReference={draft.clearReferenceImage}
            onCustomStyleNoteChange={draft.setCustomStyleNote}
          />
        )}
      </div>

      {/* Rodapé Fixo de Navegação */}
      <CreationFixedFooter
        step={step}
        isStep2Valid={draft.isStep2Valid}
        isGenerating={draft.isGenerating}
        onBack={handleBack}
        onNext={handleNext}
        onGenerate={handleGenerate}
        quotaRemaining={quota.remaining}
        quotaBlocked={quota.isBlocked || draft.isLimitReached}
        quotaLabel={quota.remainingLabel}
        hasLastDraft={Boolean(draft.previewCardImageUrl || draft.lastDraft)}
        onCheckoutLastDraft={handleCheckoutLastDraft}
        isCheckingOut={draft.isInitiatingCheckout}
      />

      {/* Modal de Carregamento Contextual com IA */}
      <ContextualAiLoader
        open={draft.isGenerating}
        stage={draft.generationStage}
      />
    </div>
  );
}
