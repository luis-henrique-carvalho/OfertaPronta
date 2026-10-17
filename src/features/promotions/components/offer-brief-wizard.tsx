import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useOfferBriefDraft,
  type SaveDraftFunction,
  type GeneratePreviewFunction,
} from "../hooks/use-offer-brief-draft";
import type { SaveOfferDraftInput } from "../data/offer-brief.schema";
import { SEGMENT_CATALOG } from "../data/offer-brief.schema";
import { initiateCheckoutFn as defaultInitiateCheckoutFn } from "@/features/checkout/server/functions/checkout.functions";
import { WizardStep1Segment } from "./wizard-step1-segment";
import { FlexibleVisualInputs } from "./flexible-visual-inputs";
import { WizardProgressBar } from "./wizard-progress-bar";
import { OfferDetailsFormCard } from "./offer-details-form-card";
import { WizardStep3Preview } from "./wizard-step3-preview";
import { ContextualAiLoader } from "./contextual-ai-loader";
import { AiGenerationErrorAlert } from "./ai-generation-error-alert";
import { ArrowLeft, Wand2 } from "lucide-react";

export type InitiateCheckoutFunction = (input: {
  data: { draftId: string; customerWhatsapp?: string };
}) => Promise<{ orderId: string }>;

export interface OfferBriefWizardProps {
  initialDraft?: Partial<SaveOfferDraftInput> & { aiGenerationCount?: number };
  saveDraftFn?: SaveDraftFunction;
  generatePreviewFn?: GeneratePreviewFunction;
  initiateCheckoutFn?: InitiateCheckoutFunction;
  onNavigateToCheckout?: (orderId: string) => void;
}

export function OfferBriefWizard({
  initialDraft,
  saveDraftFn: customSaveDraftFn,
  generatePreviewFn: customGeneratePreviewFn,
  initiateCheckoutFn: customInitiateCheckoutFn,
  onNavigateToCheckout,
}: OfferBriefWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isInitiatingCheckout, setIsInitiatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  let navigateHook: ReturnType<typeof useNavigate> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigateHook = useNavigate();
  } catch {
    navigateHook = null;
  }

  const draft = useOfferBriefDraft({
    initialDraft,
    saveDraftFn: customSaveDraftFn,
    generatePreviewFn: customGeneratePreviewFn,
  });
  const currentCatalog = SEGMENT_CATALOG[draft.businessSegment];

  const handleNextStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const isValid = draft.validateForm();
      if (!isValid) return;

      const result = await draft.generateAiPreview();
      if (result.success || result.code === "AI_QUOTA_EXCEEDED") {
        setCurrentStep(3);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const handleCheckout = async () => {
    setIsInitiatingCheckout(true);
    setCheckoutError(null);
    try {
      let targetDraftId = draft.draftId;
      if (!targetDraftId) {
        const savedId = await draft.saveDraft();
        if (savedId) {
          targetDraftId = savedId;
        }
      }

      if (!targetDraftId) {
        setIsInitiatingCheckout(false);
        setCheckoutError(
          "Salve o rascunho antes de prosseguir para o checkout",
        );
        return;
      }

      const checkoutFn = customInitiateCheckoutFn ?? defaultInitiateCheckoutFn;
      const res = await checkoutFn({
        data: {
          draftId: targetDraftId,
          customerWhatsapp: draft.whatsapp || undefined,
        },
      });
      if (onNavigateToCheckout) {
        onNavigateToCheckout(res.orderId);
      } else if (navigateHook) {
        navigateHook({
          to: "/checkout/$orderId",
          params: { orderId: res.orderId },
        });
      } else if (typeof window !== "undefined") {
        window.location.href = `/checkout/${res.orderId}`;
      }
    } catch (err: unknown) {
      setIsInitiatingCheckout(false);
      const msg =
        err instanceof Error ? err.message : "Erro ao iniciar checkout Pix";
      setCheckoutError(msg);
    }
  };

  const isQuotaExceeded = draft.generationError?.code === "AI_QUOTA_EXCEEDED";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <WizardProgressBar currentStep={currentStep} />

      <ContextualAiLoader
        open={draft.isGenerating}
        stage={draft.generationStage}
      />

      {/* ETAPA 1: Seleção de Segmento Comercial */}
      {currentStep === 1 && (
        <WizardStep1Segment
          businessSegment={draft.businessSegment}
          onSegmentChange={draft.setBusinessSegment}
          onNextStep={handleNextStep}
        />
      )}

      {/* ETAPA 2: Dados do Briefing + Insumos Visuais Combináveis */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-6">
          {draft.generationError &&
            draft.generationError.code !== "AI_QUOTA_EXCEEDED" && (
              <AiGenerationErrorAlert
                message={draft.generationError.message}
                disabled={draft.isGenerating || draft.isSaving}
                onRetry={handleNextStep}
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

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={draft.isGenerating || draft.isSaving}
              onClick={handlePrevStep}
              className="h-13 w-1/3 rounded-xl border-border font-semibold text-xs sm:text-sm px-2"
            >
              <ArrowLeft className="size-4 mr-1 shrink-0" />
              <span>Voltar</span>
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={draft.isSaving || draft.isGenerating}
              onClick={handleNextStep}
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
      )}

      {/* ETAPA 3: Prévia Completa do Card Publicitário & Avanço para Checkout */}
      {currentStep === 3 && (
        <WizardStep3Preview
          isQuotaExceeded={isQuotaExceeded}
          checkoutError={checkoutError}
          draft={draft}
          isInitiatingCheckout={isInitiatingCheckout}
          onPrevStep={handlePrevStep}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}
