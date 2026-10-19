import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Check, Info, Sparkles, Palette, TrendingUp, Tag } from "lucide-react";
import {
  type CuratedStylePreset,
  getCommercialGuide,
} from "../data/style-presets-catalog";
import { StyleMockupThumbnail } from "./style-mockup-thumbnail";

export interface StylePresetDetailsDialogProps {
  preset: CuratedStylePreset;
  onSelectPreset: (presetId: string) => void;
  trigger?: React.ReactNode;
}

export function StylePresetDetailsDialog({
  preset,
  onSelectPreset,
  trigger,
}: StylePresetDetailsDialogProps) {
  const guide = getCommercialGuide(preset);
  const swatches =
    preset.paletteSwatches && preset.paletteSwatches.length > 0
      ? preset.paletteSwatches
      : [preset.previewBadgeColor, preset.accentColor, "#FFFFFF"];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            data-testid={`preset-info-button-${preset.id}`}
            className="size-11 min-w-[44px] min-h-[44px] rounded-full bg-black/45 hover:bg-black/70 text-white hover:text-white shadow-xs backdrop-blur-xs flex items-center justify-center transition-colors border border-white/20"
            aria-label={`Ver detalhes do estilo ${preset.label}`}
            title={`Detalhes do estilo ${preset.label}`}
          >
            <Info className="size-4 stroke-[2.2]" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7 flex flex-col gap-5 border border-border bg-card shadow-2xl text-left">
        {/* Cabeçalho do Modal */}
        <DialogHeader className="text-left space-y-2 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {swatches.map((color) => (
                <span
                  key={color}
                  className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-hidden="true"
                />
              ))}
              <Badge
                variant="secondary"
                className="ml-1 text-xs font-semibold px-2 py-0.5"
              >
                {preset.tags[0] ?? "Estilo Visual"}
              </Badge>
            </div>
            {preset.tags[1] && (
              <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {preset.tags[1]}
              </span>
            )}
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
            {preset.label}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {preset.description}
          </DialogDescription>
        </DialogHeader>

        {/* Miniatura do Mockup com Dimensões Rígidas Anti-Colapso */}
        {/* shadcn-ignore: layout container do mockup com dimensao rigida */}
        <div className="w-[180px] h-[225px] shrink-0 mx-auto rounded-2xl overflow-hidden shadow-lg border border-border/70 bg-muted/30">
          <StyleMockupThumbnail
            mockup={preset.mockup}
            className="w-full h-full rounded-none border-none shadow-none"
          />
        </div>

        {/* Guia Comercial & Benefícios para o Negócio do Cliente */}
        {/* shadcn-ignore: container estrutural de especificações comerciais do estilo */}
        <div className="flex flex-col gap-3.5 rounded-2xl border border-border/70 bg-muted/25 p-4 text-xs">
          {/* Aparência */}
          <div className="flex flex-col gap-1.5 pb-2.5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary shrink-0" />
              <Typography
                variant="muted"
                as="span"
                className="font-bold text-foreground text-xs"
              >
                Aparência:
              </Typography>
            </div>
            <Typography
              variant="muted"
              as="p"
              className="text-muted-foreground text-[11.5px] leading-relaxed pl-5.5"
            >
              {guide.appearance}
            </Typography>
          </div>

          {/* Cores */}
          <div className="flex flex-col gap-1.5 pb-2.5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Palette className="size-3.5 text-primary shrink-0" />
              <Typography
                variant="muted"
                as="span"
                className="font-bold text-foreground text-xs"
              >
                Cores:
              </Typography>
            </div>
            <div className="flex items-center gap-2 pl-5.5 flex-wrap">
              <div
                className="flex items-center gap-1 shrink-0"
                aria-hidden="true"
              >
                {swatches.map((color) => (
                  <span
                    key={color}
                    className="size-3 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <Typography
                variant="muted"
                as="span"
                className="text-muted-foreground text-[11.5px] leading-relaxed"
              >
                {guide.colorsSummary}
              </Typography>
            </div>
          </div>

          {/* Sensação pro seu cliente */}
          <div className="flex flex-col gap-1.5 pb-2.5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-3.5 text-primary shrink-0" />
              <Typography
                variant="muted"
                as="span"
                className="font-bold text-foreground text-xs"
              >
                Sensação pro seu cliente:
              </Typography>
            </div>
            <Typography
              variant="muted"
              as="p"
              className="text-muted-foreground text-[11.5px] leading-relaxed pl-5.5"
            >
              {guide.customerVibe}
            </Typography>
          </div>

          {/* Ideal para */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Tag className="size-3.5 text-primary shrink-0" />
              <Typography
                variant="muted"
                as="span"
                className="font-bold text-foreground text-xs"
              >
                Ideal para:
              </Typography>
            </div>
            <Typography
              variant="muted"
              as="p"
              className="text-muted-foreground text-[11.5px] leading-relaxed pl-5.5"
            >
              {guide.idealFor}
            </Typography>
          </div>
        </div>

        {/* Ação de Seleção com Destaque Máximo */}
        <DialogClose asChild>
          <Button
            type="button"
            variant="default"
            onClick={() => onSelectPreset(preset.id)}
            data-testid={`dialog-choose-preset-${preset.id}`}
            className="w-full min-h-[48px] h-12 text-sm sm:text-base font-bold shadow-md rounded-xl transition-all hover:shadow-lg"
          >
            <Check className="size-4.5 mr-2 stroke-[2.5]" />
            Escolher este estilo
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
