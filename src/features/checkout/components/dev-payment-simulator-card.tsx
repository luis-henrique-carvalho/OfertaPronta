import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { FlaskConical, Zap, Loader2 } from "lucide-react";

export interface DevPaymentSimulatorCardProps {
  onSimulatePayment: () => void;
  isSimulating: boolean;
  error?: Error | null;
}

export function DevPaymentSimulatorCard({
  onSimulatePayment,
  isSimulating,
  error,
}: DevPaymentSimulatorCardProps) {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px]"
          >
            <FlaskConical className="size-3.5" />
            Modo Desenvolvimento
          </Badge>
          <Typography
            variant="muted"
            className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium"
          >
            DEV_BYPASS_PAYMENT
          </Typography>
        </div>

        <div className="flex flex-col gap-1">
          <Typography
            variant="h4"
            className="text-sm font-bold text-foreground"
          >
            Teste Local: Simulação de Pagamento
          </Typography>
          <Typography
            variant="muted"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            Você está no ambiente de desenvolvimento. Clique no botão abaixo
            para simular a confirmação imediata do Pix sem efetuar cobrança
            real.
          </Typography>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {error.message || "Falha ao simular pagamento."}
          </div>
        )}

        <Button
          type="button"
          onClick={onSimulatePayment}
          disabled={isSimulating}
          className="h-10 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm gap-2 transition-colors"
        >
          {isSimulating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Simulando confirmação Pix...</span>
            </>
          ) : (
            <>
              <Zap className="size-4 fill-current" />
              <span>⚡ Simular Pagamento Pix Aprovado</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
