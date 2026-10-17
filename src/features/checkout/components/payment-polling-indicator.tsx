import { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Clock, RotateCw, AlertTriangle, RefreshCw } from "lucide-react";

export interface PaymentPollingIndicatorProps {
  status: string;
  expiresAt?: string | null;
  isChecking?: boolean;
  onCheckNow?: () => void;
  onRegenerateCharge?: () => void;
  isRegenerating?: boolean;
}

export function PaymentPollingIndicator({
  status,
  expiresAt,
  isChecking = false,
  onCheckNow,
  onRegenerateCharge,
  isRegenerating = false,
}: PaymentPollingIndicatorProps) {
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() => {
    if (!expiresAt) return 1800;
    const diff = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / 1000,
    );
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000,
      );
      setTimeLeftSec(Math.max(0, diff));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = status === "EXPIRED" || timeLeftSec <= 0;

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;
  const formattedCountdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (isExpired) {
    return (
      <Alert
        variant="destructive"
        className="rounded-xl border-destructive/40 bg-destructive/10"
      >
        <AlertTriangle className="size-5" />
        <AlertTitle className="text-sm font-bold">
          Código Pix Expirado
        </AlertTitle>
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
              className="h-10 w-full rounded-lg bg-destructive text-destructive-foreground font-bold hover:bg-destructive/90"
            >
              <RefreshCw
                className={`size-4 ${isRegenerating ? "animate-spin" : ""}`}
                data-icon="inline-start"
              />
              <span>
                {isRegenerating
                  ? "Gerando Novo Pix..."
                  : "Gerar Novo Código Pix"}
              </span>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full border-border bg-card shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* shadcn-ignore: live status indicator dot */}
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <Typography
              variant="muted"
              className="text-xs font-semibold text-foreground"
            >
              Aguardando pagamento via Pix...
            </Typography>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{formattedCountdown}</span>
          </div>
        </div>

        <Typography variant="muted" className="text-[11px] leading-relaxed">
          Não precisa fechar esta página. Assim que o pagamento for
          identificado, seus arquivos em alta resolução serão desbloqueados
          automaticamente.
        </Typography>

        {onCheckNow && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCheckNow}
            disabled={isChecking}
            className="h-9 w-full rounded-lg border-border text-xs font-semibold text-foreground/80 hover:bg-muted"
          >
            <RotateCw
              className={`size-3.5 ${isChecking ? "animate-spin" : ""}`}
              data-icon="inline-start"
            />
            <span>
              {isChecking ? "Checando status..." : "Já paguei? Verificar agora"}
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
