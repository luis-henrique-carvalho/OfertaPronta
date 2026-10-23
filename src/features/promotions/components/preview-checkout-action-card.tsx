import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2, Layers, QrCode, ArrowLeft, Loader2 } from "lucide-react";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";

export interface PreviewCheckoutActionCardProps {
  onPrevStep?: () => void;
  onCheckout: () => void;
  isQuotaExceeded?: boolean;
  isLoading?: boolean;
  hasDraft?: boolean;
}

export function PreviewCheckoutActionCard({
  onPrevStep,
  onCheckout,
  isQuotaExceeded = false,
  isLoading = false,
  hasDraft = true,
}: PreviewCheckoutActionCardProps) {
  const defaultPlan = getDefaultCampaignPlan();

  return (
    <>
      {/* Informações de Entrega e CTA de Pagamento Pix */}
      {hasDraft && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-secondary">
              <CheckCircle2 className="size-4" />
              <Typography
                variant="muted"
                className="text-xs font-bold text-secondary"
              >
                Card Pronto nos 2 Formatos (Feed + Story)
              </Typography>
            </div>
            <CardTitle className="pt-1 text-2xl font-black">
              Gostou da prévia? Libere em Alta Resolução
            </CardTitle>
            <CardDescription>
              Pague apenas {defaultPlan.formattedPrice} via Pix Dinâmico e baixe
              os arquivos nítidos sem marca d&apos;água imediatamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Layers className="size-4 text-primary" />
                {defaultPlan.formatsLabel}
              </span>
              <span className="text-primary font-black text-sm">
                {defaultPlan.formattedPrice} {defaultPlan.shortLabel}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação Final */}
      <div className="flex flex-col gap-3">
        {hasDraft && (
          <Button
            type="button"
            size="lg"
            disabled={isLoading}
            className="h-auto min-h-14 w-full rounded-2xl bg-primary py-3.5 px-4 text-sm sm:text-base font-bold shadow-lg hover:bg-primary/90 whitespace-normal break-words text-center disabled:opacity-70"
            onClick={onCheckout}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 mr-1.5 shrink-0 animate-spin" />
                <span>Preparando Pix...</span>
              </>
            ) : (
              <>
                <QrCode className="size-5 mr-1.5 shrink-0" />
                <span>
                  {isQuotaExceeded
                    ? `Liberar por ${defaultPlan.formattedPrice}`
                    : `Liberar em HD sem marca d'água (${defaultPlan.formattedPrice})`}
                </span>
              </>
            )}
          </Button>
        )}

        {onPrevStep && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isLoading}
            onClick={onPrevStep}
            className="h-11 w-full rounded-xl border-border font-medium text-xs text-muted-foreground"
          >
            <ArrowLeft className="size-3.5 mr-1" />
            Editar dados ou trocar fotos
          </Button>
        )}
      </div>
    </>
  );
}
