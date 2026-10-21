import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReferenceStyleCardProps {
  referenceImageDataUrl: string;
  isRefSelected: boolean;
  onSelect: () => void;
}

export function ReferenceStyleCard({
  referenceImageDataUrl,
  isRefSelected,
  onSelect,
}: ReferenceStyleCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <Card
      data-testid="reference-style-card"
      role="button"
      tabIndex={0}
      aria-pressed={isRefSelected}
      aria-label="Estilo do seu Print de Referência: A IA vai copiar a estética, paleta de cores e tipografia do print que você enviou"
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all p-3.5 flex items-center gap-3.5 select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isRefSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
          : "border-border bg-card hover:border-primary/40 opacity-80 hover:opacity-100",
      )}
    >
      <div className="relative size-16 sm:size-20 shrink-0 aspect-square overflow-hidden rounded-xl border border-black/15 shadow-xs">
        <img
          src={referenceImageDataUrl}
          alt="Print de referência"
          className="size-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant={isRefSelected ? "default" : "secondary"}
            className="text-[10px] font-extrabold uppercase tracking-wide gap-1"
          >
            <Sparkles className="size-3 shrink-0" />
            <span>Ativo / Recomendado</span>
          </Badge>
          {isRefSelected && (
            <CheckCircle2
              data-testid="reference-selected-check-icon"
              className="size-4 text-primary shrink-0 ml-auto"
            />
          )}
        </div>

        <Typography
          variant="h4"
          className="text-sm font-bold text-foreground leading-tight"
        >
          Estilo do seu Print de Referência
        </Typography>

        <Typography variant="muted" className="text-xs leading-snug">
          A IA vai copiar a estética, paleta de cores e tipografia do print que
          você enviou.
        </Typography>
      </div>
    </Card>
  );
}
