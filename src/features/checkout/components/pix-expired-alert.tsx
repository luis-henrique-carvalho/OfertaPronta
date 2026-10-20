import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { AlertTriangle, RefreshCw } from "lucide-react";

export interface PixExpiredAlertProps {
  onRegenerateCharge?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export function PixExpiredAlert({
  onRegenerateCharge,
  isRegenerating = false,
  className,
}: PixExpiredAlertProps) {
  return (
    <Alert
      variant="destructive"
      className={`rounded-xl border-destructive/40 bg-destructive/10 ${className ?? ""}`}
    >
      <AlertTriangle className="size-5" />
      <AlertTitle className="text-sm font-bold">Código Pix Expirado</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 pt-1">
        <Typography variant="muted" className="text-xs text-destructive/90">
          O prazo de 30 minutos desta cobrança encerrou. Toque no botão abaixo
          para gerar um novo código Pix atualizado.
        </Typography>

        {onRegenerateCharge && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onRegenerateCharge}
            disabled={isRegenerating}
            className="h-10 w-full rounded-lg bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            <RefreshCw
              className={`size-4 ${isRegenerating ? "animate-spin" : ""}`}
              data-icon="inline-start"
            />
            <span>
              {isRegenerating ? "Gerando Novo Pix..." : "Gerar Novo Código Pix"}
            </span>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
