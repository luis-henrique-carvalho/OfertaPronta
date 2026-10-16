import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export interface WizardProgressBarProps {
  currentStep: 1 | 2 | 3;
}

export function WizardProgressBar({ currentStep }: WizardProgressBarProps) {
  return (
    <Card className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between text-xs font-semibold">
        <Typography
          variant="muted"
          className="flex items-center gap-1.5 text-primary font-semibold text-xs"
        >
          <Sparkles className="size-3.5" />
          Criação de Card com IA
        </Typography>
        <Typography variant="muted" className="text-xs">
          Etapa {currentStep} de 3
        </Typography>
      </div>

      {/* Indicadores Visuais de Etapa */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div
          className={`h-2 rounded-full transition-all ${
            currentStep >= 1 ? "bg-primary" : "bg-muted"
          }`}
        />
        <div
          className={`h-2 rounded-full transition-all ${
            currentStep >= 2 ? "bg-primary" : "bg-muted"
          }`}
        />
        <div
          className={`h-2 rounded-full transition-all ${
            currentStep === 3 ? "bg-secondary" : "bg-muted"
          }`}
        />
      </div>

      <div className="flex justify-between pt-1 text-[11px] font-medium text-muted-foreground">
        <span className={currentStep === 1 ? "font-bold text-foreground" : ""}>
          1. Ramo
        </span>
        <span className={currentStep === 2 ? "font-bold text-foreground" : ""}>
          2. Oferta & Fotos
        </span>
        <span className={currentStep === 3 ? "font-bold text-secondary" : ""}>
          3. Prévia do Card
        </span>
      </div>
    </Card>
  );
}
