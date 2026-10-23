import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Wand2,
  Loader2,
  Sparkles,
  QrCode,
} from "lucide-react";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";
import { cn } from "@/lib/utils";

export interface CreationFixedFooterProps {
  step: 1 | 2 | 3 | 4;
  isStep2Valid?: boolean;
  isGenerating?: boolean;
  onBack: () => void;
  onNext: () => void;
  onGenerate: () => void;
  className?: string;
  quotaRemaining?: number | null;
  quotaBlocked?: boolean;
  quotaLabel?: string;
  hasLastDraft?: boolean;
  onCheckoutLastDraft?: () => void;
  isCheckingOut?: boolean;
}

export function CreationFixedFooter({
  step,
  isStep2Valid = true,
  isGenerating = false,
  onBack,
  onNext,
  onGenerate,
  className,
  quotaBlocked = false,
  quotaLabel,
  hasLastDraft = false,
  onCheckoutLastDraft,
  isCheckingOut = false,
}: CreationFixedFooterProps) {
  const defaultPlan = getDefaultCampaignPlan();
  const isBackVisible = step > 1;
  const isLastStep = step === 4;

  const isNextDisabled = isGenerating || (step === 2 && !isStep2Valid);

  return (
    <footer
      data-testid="creation-fixed-footer"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 p-3.5 backdrop-blur-md shadow-lg",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-1.5">
        {isLastStep && quotaLabel && !quotaBlocked && (
          <div
            data-testid="quota-counter"
            className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground"
          >
            <Sparkles className="size-3 text-primary shrink-0" />
            <span>{quotaLabel}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {isBackVisible && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              data-testid="btn-wizard-back"
              disabled={isGenerating || isCheckingOut}
              onClick={onBack}
              className="h-12 min-h-[48px] w-1/3 rounded-xl border-border font-semibold text-xs sm:text-sm"
            >
              <ArrowLeft className="size-4 mr-1 shrink-0" />
              Voltar
            </Button>
          )}

          {isLastStep ? (
            quotaBlocked ? (
              hasLastDraft && onCheckoutLastDraft ? (
                <Button
                  type="button"
                  size="lg"
                  data-testid="btn-wizard-generate"
                  disabled={isCheckingOut}
                  onClick={onCheckoutLastDraft}
                  className={cn(
                    "h-12 min-h-[48px] rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all",
                    isBackVisible ? "w-2/3" : "w-full",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="size-4 mr-1.5 animate-spin shrink-0" />
                      Iniciando Pix...
                    </>
                  ) : (
                    <>
                      <QrCode className="size-4 mr-1.5 shrink-0" />
                      Liberar por {defaultPlan.formattedPrice}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  data-testid="btn-wizard-generate"
                  disabled={true}
                  className={cn(
                    "h-12 min-h-[48px] rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all",
                    isBackVisible ? "w-2/3" : "w-full",
                    "bg-muted text-muted-foreground opacity-80 cursor-not-allowed",
                  )}
                >
                  Prévias esgotadas hoje
                </Button>
              )
            ) : (
              <Button
                type="button"
                size="lg"
                data-testid="btn-wizard-generate"
                disabled={isGenerating}
                onClick={onGenerate}
                className={cn(
                  "h-12 min-h-[48px] rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all",
                  isBackVisible ? "w-2/3" : "w-full",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 mr-1.5 animate-spin shrink-0" />
                    Criando Card com IA...
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4 mr-1.5 shrink-0" />
                    Gerar Meu Card
                  </>
                )}
              </Button>
            )
          ) : (
            <Button
              type="button"
              size="lg"
              data-testid="btn-wizard-next"
              disabled={isNextDisabled}
              onClick={onNext}
              className={cn(
                "h-12 min-h-[48px] rounded-xl font-bold text-xs sm:text-sm transition-all",
                isBackVisible ? "w-2/3" : "w-full",
              )}
            >
              Continuar
              <ArrowRight className="size-4 ml-1 shrink-0" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}
