import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step4ActiveReferenceBannerProps {
  referenceImageDataUrl: string;
  onOpenShowcase: () => void;
  onClearReference?: () => void;
  className?: string;
}

export function Step4ActiveReferenceBanner({
  referenceImageDataUrl,
  onOpenShowcase,
  onClearReference,
  className,
}: Step4ActiveReferenceBannerProps) {
  return (
    <Card
      data-testid="active-reference-banner"
      className={cn(
        "overflow-hidden rounded-2xl border-2 border-primary/40 bg-primary/5 p-3.5 sm:p-4 shadow-xs",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="relative size-16 sm:size-20 shrink-0 aspect-4/5 sm:aspect-square overflow-hidden rounded-xl border border-black/15 bg-muted shadow-2xs">
            {/* shadcn-ignore: miniatura visual da arte de referência ativa */}
            <img
              src={referenceImageDataUrl}
              alt="Referência ativa"
              className="size-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="default"
                className="gap-1 text-[10px] font-bold uppercase tracking-wide bg-primary text-primary-foreground"
              >
                <Sparkles className="size-3 shrink-0" />
                <span>Referência Ativa</span>
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] font-medium border-primary/30 text-primary"
              >
                Inspiração da Vitrine
              </Badge>
            </div>

            <Typography
              variant="h4"
              className="text-xs sm:text-sm font-bold text-foreground leading-snug"
            >
              Referência da Vitrine Ativa
            </Typography>

            <Typography
              variant="muted"
              className="text-[11px] sm:text-xs text-muted-foreground leading-snug"
            >
              A IA usará esta arte para guiar a iluminação, composição e paleta
              de cores do seu card.
            </Typography>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="btn-change-showcase-reference"
            onClick={onOpenShowcase}
            className="flex-1 sm:flex-none min-h-[44px] text-xs font-semibold gap-1.5 border-primary/40 hover:bg-primary/10 select-none"
          >
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span>Trocar na Vitrine</span>
          </Button>

          {onClearReference && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="btn-remove-reference"
              onClick={onClearReference}
              className="flex-1 sm:flex-none min-h-[44px] text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 select-none"
            >
              <Trash2 className="size-3.5 shrink-0" />
              <span>Remover Referência</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
