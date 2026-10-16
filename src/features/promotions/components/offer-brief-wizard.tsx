import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOfferBriefDraft } from "../hooks/use-offer-brief-draft";
import { SEGMENT_CATALOG } from "../data/offer-brief.schema";
import { SegmentSelector } from "./segment-selector";
import { FlexibleVisualInputs } from "./flexible-visual-inputs";
import { LiveCardPreview } from "./live-card-preview";
import { WizardProgressBar } from "./wizard-progress-bar";
import { OfferDetailsFormCard } from "./offer-details-form-card";
import { PreviewCheckoutActionCard } from "./preview-checkout-action-card";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";

export function OfferBriefWizard() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const draft = useOfferBriefDraft();
  const currentCatalog = SEGMENT_CATALOG[draft.businessSegment];

  const handleNextStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const isValid = draft.validateForm();
      if (!isValid) return;

      await draft.saveDraft();
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <WizardProgressBar currentStep={currentStep} />

      {/* ETAPA 1: Seleção de Segmento Comercial */}
      {currentStep === 1 && (
        <div className="flex flex-col gap-6">
          <SegmentSelector
            value={draft.businessSegment}
            onChange={(newSegment) => draft.setBusinessSegment(newSegment)}
          />

          <Button
            type="button"
            size="lg"
            onClick={handleNextStep}
            className="h-13 w-full rounded-xl bg-primary text-base font-bold shadow-md hover:bg-primary/90"
          >
            Avançar para dados da oferta
            <ArrowRight className="size-5 ml-1" />
          </Button>
        </div>
      )}

      {/* ETAPA 2: Dados do Briefing + Insumos Visuais Combináveis */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-6">
          <OfferDetailsFormCard
            currentCatalog={currentCatalog}
            businessName={draft.businessName}
            offerTitle={draft.offerTitle}
            promoPrice={draft.promoPrice}
            originalPrice={draft.originalPrice}
            callToAction={draft.callToAction}
            whatsapp={draft.whatsapp}
            validationErrors={draft.validationErrors}
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
              onClick={handlePrevStep}
              className="h-13 w-1/3 rounded-xl border-border font-semibold text-xs sm:text-sm px-2"
            >
              <ArrowLeft className="size-4 mr-1 shrink-0" />
              <span>Voltar</span>
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={draft.isSaving}
              onClick={handleNextStep}
              className="h-13 w-2/3 rounded-xl bg-primary text-xs sm:text-base font-bold shadow-md hover:bg-primary/90 px-3 whitespace-normal break-words text-center"
            >
              {draft.isSaving ? (
                <>Salvando dados...</>
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
        <div className="flex flex-col gap-6">
          <LiveCardPreview
            businessSegment={draft.businessSegment}
            businessName={draft.businessName}
            offerTitle={draft.offerTitle}
            promoPrice={draft.promoPrice}
            originalPrice={draft.originalPrice}
            callToAction={draft.callToAction}
            whatsapp={draft.whatsapp}
            productImageDataUrl={draft.productImageDataUrl}
            referenceImageDataUrl={draft.referenceImageDataUrl}
            stylePresetId={draft.stylePresetId}
            showWatermark={true}
          />

          <PreviewCheckoutActionCard
            onPrevStep={handlePrevStep}
            onCheckout={() => {
              alert("Avançando para o Checkout Pix (R$ 9,90)...");
            }}
          />
        </div>
      )}
    </div>
  );
}
