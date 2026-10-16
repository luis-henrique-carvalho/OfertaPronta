import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

export function AiQuotaExceededAlert() {
  return (
    <Alert className="border-amber-500/40 bg-amber-500/10 text-foreground">
      <Sparkles className="size-4 text-amber-500 shrink-0" />
      <AlertTitle className="font-bold text-amber-600 dark:text-amber-400">
        Limite da prévia gratuita atingido
      </AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
        Você já gerou sua prévia gratuita deste rascunho. Para gerar novas
        variações ou refinar com IA, conclua o pagamento Pix (R$ 9,90) — com
        direito a até 3 regenerações pós-compra!
      </AlertDescription>
    </Alert>
  );
}
