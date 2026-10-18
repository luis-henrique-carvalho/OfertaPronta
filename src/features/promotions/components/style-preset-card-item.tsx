import { Typography } from "@/components/ui/typography";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CuratedStylePreset } from "../data/style-presets-catalog";
import { StyleMockupThumbnail } from "./style-mockup-thumbnail";
import { StylePresetDetailsDialog } from "./style-preset-details-dialog";

export interface StylePresetCardItemProps {
  preset: CuratedStylePreset;
  isSelected: boolean;
  onSelectPreset: (presetId: string) => void;
}

export function StylePresetCardItem({
  preset,
  isSelected,
  onSelectPreset,
}: StylePresetCardItemProps) {
  return (
    <div
      data-testid={`preset-item-${preset.id}`}
      className="relative flex flex-col h-full group"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectPreset(preset.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectPreset(preset.id);
          }
        }}
        aria-pressed={isSelected}
        aria-label={`Selecionar estilo ${preset.label}`}
        data-testid={`preset-card-${preset.id}`}
        className={cn(
          "relative flex h-full min-h-[220px] w-full flex-col justify-between p-2.5 sm:p-3 text-left rounded-2xl border transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isSelected
            ? "border-primary bg-primary/[0.03] ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
            : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/20 hover:shadow-sm",
        )}
      >
        {/* Contêiner da Arte Visual do Mockup */}
        <div className="relative w-full overflow-hidden rounded-xl bg-muted/40 aspect-[4/5]">
          <StyleMockupThumbnail
            mockup={preset.mockup}
            className={cn(
              "w-full h-full transition-transform duration-300 group-hover:scale-[1.02]",
              isSelected && "scale-[1.01]",
            )}
          />

          {/* Badge de Seleção Ativa no Canto Superior Esquerdo */}
          {isSelected && (
            <div
              data-testid={`preset-selected-badge-${preset.id}`}
              className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-md animate-in fade-in zoom-in-90 duration-150"
            >
              <Check className="size-3 stroke-[3]" />
              <span className="hidden xs:inline">Ativo</span>
            </div>
          )}

          {/* Botão de Detalhes no Canto Superior Direito */}
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <StylePresetDetailsDialog
              preset={preset}
              onSelectPreset={onSelectPreset}
            />
          </div>
        </div>

        {/* Informações Textuais Abaixo da Arte */}
        <div className="mt-2.5 flex flex-col gap-1.5 w-full">
          <div className="flex items-start gap-1.5 min-w-0">
            <span
              className="size-2.5 rounded-full shrink-0 shadow-2xs mt-1"
              style={{ backgroundColor: preset.previewBadgeColor }}
              aria-hidden="true"
            />
            <Typography
              variant="muted"
              as="h4"
              className={cn(
                "text-xs sm:text-sm font-bold leading-snug line-clamp-2 text-foreground",
                isSelected && "text-primary",
              )}
            >
              {preset.label}
            </Typography>
          </div>

          {/* Tags de Características com Contraste Nítido */}
          <div className="flex flex-wrap gap-1">
            {preset.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/80 text-foreground/80 border border-border/40 leading-none"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
