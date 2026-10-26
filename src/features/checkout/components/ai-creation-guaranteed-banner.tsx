import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

export function AiCreationGuaranteedBanner() {
  return (
    <Alert
      data-testid="ai-creation-guaranteed-banner"
      className="border-primary/30 bg-primary/5 text-primary"
    >
      <Sparkles className="size-4 text-primary shrink-0" />
      <AlertTitle className="text-xs font-bold text-foreground">
        Criação por IA Garantida
      </AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground">
        Seu card será gerado pela Inteligência Artificial assim que o pagamento
        Pix for confirmado.
      </AlertDescription>
    </Alert>
  );
}
