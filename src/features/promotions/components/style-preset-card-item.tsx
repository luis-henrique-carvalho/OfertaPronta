import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
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
          "relative flex h-full min-h-[220px] w-full flex-col justify-between p-3 sm:p-4 text-left rounded-2xl border transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isSelected
            ? "border-primary bg-primary/[0.03] ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
            : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/20 hover:shadow-sm",
        )}
      >
        {/* Contêiner da Arte Visual do Mockup (100% Desobstruída) */}
        <div className="relative w-full overflow-hidden rounded-xl bg-muted/40 aspect-[4/5] border border-border/50 shadow-2xs">
          <StyleMockupThumbnail
            mockup={preset.mockup}
            className={cn(
              "w-full h-full rounded-none border-none shadow-none transition-transform duration-300 group-hover:scale-[1.02]",
              isSelected && "scale-[1.01]",
            )}
          />

          {/* Badge de Seleção Ativa no Canto Superior Esquerdo */}
          {isSelected && (
            <div
              data-testid={`preset-selected-badge-${preset.id}`}
              className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold shadow-md animate-in fade-in zoom-in-90 duration-150"
            >
              <Check className="size-3.5 stroke-[3]" />
              <span>Estilo Selecionado</span>
            </div>
          )}
        </div>

        {/* Informações Textuais Abaixo da Arte */}
        <div className="mt-3 flex flex-col gap-2 w-full flex-1">
          {/* Título do Estilo com Swatch de Identificação */}
          <div className="flex items-start gap-2 min-w-0">
            <span
              className="size-3 rounded-full shrink-0 shadow-2xs mt-1 border border-black/10"
              style={{ backgroundColor: preset.previewBadgeColor }}
              aria-hidden="true"
            />
            <Typography
              variant="muted"
              as="h4"
              className={cn(
                "text-sm sm:text-base font-bold leading-snug text-foreground",
                isSelected && "text-primary",
              )}
            >
              {preset.label}
            </Typography>
          </div>

          {/* Descrição Concisa de Valor */}
          <Typography
            variant="muted"
            as="p"
            className="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
          >
            {preset.description}
          </Typography>

          {/* Tags de Características e Paleta */}
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1 items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {preset.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-muted/80 text-foreground/85 border border-border/50 leading-tight"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Ação de Ver Detalhes (fora da imagem) */}
            <div onClick={(e) => e.stopPropagation()}>
              <StylePresetDetailsDialog
                preset={preset}
                onSelectPreset={onSelectPreset}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`preset-info-button-${preset.id}`}
                    className="min-h-[44px] min-w-[44px] h-9 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                    aria-label={`Ver detalhes do estilo ${preset.label}`}
                    title={`Detalhes do estilo ${preset.label}`}
                  >
                    <Info className="size-3.5 stroke-[2.2]" />
                    <span className="text-[11px]">Detalhes</span>
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
