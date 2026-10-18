import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        variant="outline"
        onClick={() => onSelectPreset(preset.id)}
        aria-pressed={isSelected}
        aria-label={`Selecionar estilo ${preset.label}`}
        data-testid={`preset-card-${preset.id}`}
        className={cn(
          "relative flex h-full min-h-[220px] w-full flex-col items-stretch justify-start p-2.5 text-left whitespace-normal rounded-2xl border transition-all duration-200 select-none",
          isSelected
            ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5 shadow-md"
            : "border-border bg-card hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        {isSelected && (
          <div
            data-testid={`preset-selected-badge-${preset.id}`}
            className="absolute top-2 left-2 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm animate-in fade-in zoom-in-75 duration-150"
          >
            <Check className="size-3.5 stroke-[3]" />
          </div>
        )}

        <div className="w-full">
          <StyleMockupThumbnail
            mockup={preset.mockup}
            className={cn(
              "w-full transition-transform duration-200",
              isSelected && "scale-[1.02]",
            )}
          />
        </div>

        <div className="mt-2.5 flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="size-2.5 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: preset.previewBadgeColor }}
              aria-hidden="true"
            />
            <Typography
              variant="muted"
              as="span"
              className={cn(
                "text-xs font-bold leading-tight line-clamp-1 break-words",
                isSelected ? "text-primary" : "text-foreground",
              )}
            >
              {preset.label}
            </Typography>
          </div>

          <div className="flex flex-wrap gap-1">
            {preset.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[9px] px-1.5 py-0 leading-tight font-normal text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Button>

      <div className="absolute top-2 right-2 z-10">
        <StylePresetDetailsDialog
          preset={preset}
          onSelectPreset={onSelectPreset}
        />
      </div>
    </div>
  );
}
