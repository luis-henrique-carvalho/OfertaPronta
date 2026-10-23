import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export interface CreationErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export function CreationErrorAlert({
  message,
  onDismiss,
}: CreationErrorAlertProps) {
  return (
    <Card
      data-testid="wizard-generation-error-alert"
      className="rounded-2xl border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start justify-between gap-3 mb-4 animate-in fade-in"
    >
      <div className="space-y-1">
        <Typography variant="h4" className="text-sm font-bold text-destructive">
          Não foi possível gerar a arte no momento
        </Typography>
        <Typography variant="muted" className="text-xs text-destructive/90">
          {message}
        </Typography>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDismiss}
        className="shrink-0 h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
      >
        Fechar
      </Button>
    </Card>
  );
}
