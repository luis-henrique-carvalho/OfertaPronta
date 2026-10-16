import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export interface AiGenerationErrorAlertProps {
  message?: string;
  disabled: boolean;
  onRetry: () => void;
}

export function AiGenerationErrorAlert({
  message,
  disabled,
  onRetry,
}: AiGenerationErrorAlertProps) {
  return (
    <Alert
      variant="destructive"
      className="border-destructive/40 bg-destructive/10"
    >
      <AlertCircle className="size-4 shrink-0" />
      <AlertTitle className="font-bold">
        Instabilidade temporária na geração por IA
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 mt-1">
        <Typography
          variant="muted"
          className="text-xs text-destructive-foreground"
        >
          {message ||
            "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Seus dados continuam preenchidos."}
        </Typography>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onRetry}
          className="w-fit border-destructive/40 hover:bg-destructive/10 text-xs font-semibold"
        >
          <RotateCcw className="size-3.5 mr-1" />
          Tentar Novamente
        </Button>
      </AlertDescription>
    </Alert>
  );
}
