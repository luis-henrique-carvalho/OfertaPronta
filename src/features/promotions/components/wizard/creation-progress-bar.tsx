import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "1. Ramo",
  2: "2. O Anúncio",
  3: "3. Suas Imagens",
  4: "4. Visual do Card",
};

export interface CreationProgressBarProps {
  step: 1 | 2 | 3 | 4;
}

export function CreationProgressBar({ step }: CreationProgressBarProps) {
  return (
    <div
      data-testid="wizard-progress-bar"
      className="mx-auto w-full max-w-lg px-4 pt-4"
    >
      <div className="flex items-center justify-between pb-2 text-xs font-semibold">
        <span className="flex items-center gap-1 text-primary">
          <Sparkles className="size-3.5" />
          Passo {step} de 4
        </span>
        <span className="text-foreground">{STEP_TITLES[step]}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {([1, 2, 3, 4] as const).map((s) => (
          <div
            key={s}
            data-testid={`step-indicator-${s}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              s <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
