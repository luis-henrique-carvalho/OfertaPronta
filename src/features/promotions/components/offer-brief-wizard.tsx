// shadcn-ignore: componente container orquestrador que coordena as etapas do wizard
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useOfferBriefDraft,
  type SaveDraftFunction,
  type GeneratePreviewFunction,
} from "../hooks/use-offer-brief-draft";
import {
  usePreviewQuota,
  type GetPreviewQuotaFunction,
} from "../hooks/use-preview-quota";
import type { SaveOfferDraftInput } from "../data/offer-brief.schema";
import { SEGMENT_CATALOG } from "../data/offer-brief.schema";
import { initiateCheckoutFn as defaultInitiateCheckoutFn } from "@/features/checkout/server/functions/checkout.functions";
import { WizardStep1Segment } from "./wizard-step1-segment";
import { WizardStep2Form } from "./wizard-step2-form";
import { WizardProgressBar } from "./wizard-progress-bar";
import { WizardStep3Preview } from "./wizard-step3-preview";
import { ContextualAiLoader } from "./contextual-ai-loader";

export type InitiateCheckoutFunction = (input: {
  data: { draftId: string; customerWhatsapp?: string };
}) => Promise<{ orderId: string }>;

export interface OfferBriefWizardProps {
  initialDraft?: Partial<SaveOfferDraftInput> & { aiGenerationCount?: number };
  saveDraftFn?: SaveDraftFunction;
  generatePreviewFn?: GeneratePreviewFunction;
  initiateCheckoutFn?: InitiateCheckoutFunction;
  getPreviewQuotaFn?: GetPreviewQuotaFunction;
  onNavigateToCheckout?: (orderId: string) => void;
}

export function OfferBriefWizard({
  initialDraft,
  saveDraftFn: customSaveDraftFn,
  generatePreviewFn: customGeneratePreviewFn,
  initiateCheckoutFn: customInitiateCheckoutFn,
  getPreviewQuotaFn: customGetPreviewQuotaFn,
  onNavigateToCheckout,
}: OfferBriefWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isInitiatingCheckout, setIsInitiatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const quota = usePreviewQuota({
    getPreviewQuotaFn: customGetPreviewQuotaFn,
  });

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
      if (
        result.success ||
        result.code === "AI_QUOTA_EXCEEDED" ||
        result.status === "LIMIT_REACHED" ||
        draft.isLimitReached
      ) {
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

  const isQuotaExceeded =
    draft.isLimitReached || draft.generationError?.code === "AI_QUOTA_EXCEEDED";

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
        <WizardStep2Form
          draft={draft}
          currentCatalog={currentCatalog}
          quotaRemainingLabel={quota.remainingLabel}
          onPrevStep={handlePrevStep}
          onNextStep={handleNextStep}
        />
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
