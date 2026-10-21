import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveOfferDraftInput } from "../data/offer-brief.schema";
import { getCreationSegment } from "../data/creation-catalog";
import {
  useOfferBriefDraft,
  type SaveDraftFunction,
  type GeneratePreviewFunction,
  type InitiateCheckoutFunction,
} from "../hooks/use-offer-brief-draft";
import { ContextualAiLoader } from "./contextual-ai-loader";
import { Step1SegmentSelect } from "./wizard/step1-segment-select";
import { Step2OfferDetails } from "./wizard/step2-offer-details";
import { Step3VisualAssets } from "./wizard/step3-visual-assets";
import { Step4StyleAndPalette } from "./wizard/step4-style-and-palette";
import { CreationFixedFooter } from "./wizard/creation-fixed-footer";

export interface OfferCreationWizardProps {
  initialDraft?: Partial<SaveOfferDraftInput> & {
    aiGenerationCount?: number;
    customStyleNote?: string;
  };
  saveDraftFn?: SaveDraftFunction;
  generatePreviewFn?: GeneratePreviewFunction;
  initiateCheckoutFn?: InitiateCheckoutFunction;
  onNavigateToCheckout?: (orderId: string) => void;
  navigate?: (opts: { to: string; params: { orderId: string } }) => void;
  className?: string;
}

const STEP_TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "1. Ramo",
  2: "2. O Anúncio",
  3: "3. Suas Imagens",
  4: "4. Visual do Card",
};

export function OfferCreationWizard({
  initialDraft,
  saveDraftFn,
  generatePreviewFn,
  initiateCheckoutFn,
  onNavigateToCheckout,
  navigate,
  className,
}: OfferCreationWizardProps = {}) {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

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

  const handleGenerate = async () => {
    const result = await draft.generateCardAndInitiateCheckout();
    if (result.success) {
      if (onNavigateToCheckout) {
        onNavigateToCheckout(result.orderId);
      } else if (navigate) {
        navigate({
          to: "/checkout/$orderId",
          params: { orderId: result.orderId },
        });
      } else if (typeof window !== "undefined") {
        window.location.href = `/checkout/${result.orderId}`;
      }
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
      <div
        data-testid="wizard-progress-bar"
        className="mx-auto w-full max-w-lg px-4 pt-4"
      >
        <div className="flex items-center justify-between pb-2 text-xs font-semibold">
          <span className="flex items-center gap-1 text-primary">
            <Sparkles className="size-3.5" />
            Passo {step} de 4
          </span>
          <span className="text-foreground">{STEP_TITLES[step]}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {([1, 2, 3, 4] as const).map((s) => (
            <div
              key={s}
              data-testid={`step-indicator-${s}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                s <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Conteúdo Central do Passo Atual */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-5 pb-6">
        {draft.generationError && (
          <Card
            data-testid="wizard-generation-error-alert"
            className="rounded-2xl border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start justify-between gap-3 mb-4 animate-in fade-in"
          >
            <div className="space-y-1">
              <Typography
                variant="h4"
                className="text-sm font-bold text-destructive"
              >
                Não foi possível gerar a arte no momento
              </Typography>
              <Typography
                variant="muted"
                className="text-xs text-destructive/90"
              >
                {draft.generationError.message}
              </Typography>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={draft.clearGenerationError}
              className="shrink-0 h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              Fechar
            </Button>
          </Card>
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
      />

      {/* Modal de Carregamento Contextual com IA */}
      <ContextualAiLoader
        open={draft.isGenerating}
        stage={draft.generationStage}
      />
    </div>
  );
}
