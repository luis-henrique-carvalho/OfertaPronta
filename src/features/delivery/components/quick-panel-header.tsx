import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { RegenerationCountdownTimer } from "./regeneration-countdown-timer";

export interface QuickPanelHeaderProps {
  remainingRegenerations: number;
  maxRegenerations: number;
  regenerationWindowEndsAt: string;
  onExpire: () => void;
}

export function QuickPanelHeader({
  remainingRegenerations,
  maxRegenerations,
  regenerationWindowEndsAt,
  onExpire,
}: QuickPanelHeaderProps) {
  return (
    <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <CardTitle className="text-base font-bold sm:text-lg">
              Precisa de algum ajuste na arte?
            </CardTitle>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary dark:text-primary-foreground"
          >
            <Sparkles className="size-3 text-primary" />
            <span>
              {remainingRegenerations} de {maxRegenerations} ajustes restantes
            </span>
          </Badge>

          <RegenerationCountdownTimer
            windowEndsAt={regenerationWindowEndsAt}
            onExpire={onExpire}
          />
        </div>

        <CardDescription className="pt-0.5 text-xs text-muted-foreground">
          Selecione o que deseja ajustar. A IA gera um novo card mantendo seu
          produto.
        </CardDescription>
      </div>
    </CardHeader>
  );
}
