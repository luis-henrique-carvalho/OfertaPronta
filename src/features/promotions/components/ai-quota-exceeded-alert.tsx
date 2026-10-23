import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sparkles, QrCode, Loader2 } from "lucide-react";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";
import type { BlockedReason } from "../data/offer-brief.schema";
import { cn } from "@/lib/utils";

export interface AiQuotaExceededAlertProps {
  reason?: BlockedReason | null;
  hasLastDraft?: boolean;
  onCheckout?: () => void;
  isInitiatingCheckout?: boolean;
  className?: string;
}

export function AiQuotaExceededAlert({
  reason = "visitor",
  hasLastDraft = true,
  onCheckout,
  isInitiatingCheckout = false,
  className,
}: AiQuotaExceededAlertProps = {}) {
  const defaultPlan = getDefaultCampaignPlan();

  const getAlertTitle = () => {
    switch (reason) {
      case "global":
        return "Prévias grátis esgotadas por hoje";
      case "ip":
        return "Limite de rede local atingido";
      case "visitor":
      default:
        return "Limite da prévia gratuita atingido";
    }
  };

  const getAlertMessage = () => {
    if (hasLastDraft) {
      switch (reason) {
        case "global":
          return `Prévias grátis esgotadas por hoje. Libere este card por ${defaultPlan.formattedPrice} ou volte amanhã.`;
        case "ip":
          return `Você já usou suas prévias grátis de hoje. Libere este card sem marca d'água por ${defaultPlan.formattedPrice}.`;
        case "visitor":
        default:
          return `Você já usou suas prévias grátis de hoje. Libere este card sem marca d'água por ${defaultPlan.formattedPrice}.`;
      }
    } else {
      switch (reason) {
        case "global":
          return "Prévias grátis esgotadas por hoje. Limite diário do serviço atingido. Volte amanhã.";
        case "ip":
          return "Limite de prévias gratuitas atingido para sua rede local. Volte amanhã para criar novos cards.";
        case "visitor":
        default:
          return "Limite de 2 prévias diárias atingido para este dispositivo/navegador. Volte amanhã para criar novos cards.";
      }
    }
  };

  return (
    <Alert
      data-testid="ai-quota-exceeded-alert"
      className={cn(
        "border-amber-500/40 bg-amber-500/10 text-foreground rounded-2xl p-4",
        className,
      )}
    >
      <Sparkles className="size-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5">
        <AlertTitle className="font-bold text-amber-600 dark:text-amber-400 text-sm sm:text-base">
          {getAlertTitle()}
        </AlertTitle>
        <AlertDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {getAlertMessage()}
        </AlertDescription>

        {hasLastDraft && onCheckout && (
          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              disabled={isInitiatingCheckout}
              onClick={onCheckout}
              data-testid="btn-quota-checkout"
              className="h-11 min-h-[44px] w-full sm:w-auto rounded-xl bg-primary text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              {isInitiatingCheckout ? (
                <>
                  <Loader2 className="size-4 animate-spin shrink-0" />
                  <span>Iniciando Pix...</span>
                </>
              ) : (
                <>
                  <QrCode className="size-4 shrink-0" />
                  <span>Liberar por {defaultPlan.formattedPrice}</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
}
