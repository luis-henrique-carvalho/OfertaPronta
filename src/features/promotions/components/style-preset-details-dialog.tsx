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
import { Check, Info } from "lucide-react";
import type { CuratedStylePreset } from "../data/style-presets-catalog";
import { StyleMockupThumbnail } from "./style-mockup-thumbnail";

export interface StylePresetDetailsDialogProps {
  preset: CuratedStylePreset;
  onSelectPreset: (presetId: string) => void;
}

export function StylePresetDetailsDialog({
  preset,
  onSelectPreset,
}: StylePresetDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
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
      </DialogTrigger>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader className="text-left pb-2">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="size-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: preset.previewBadgeColor }}
            />
            <Badge variant="secondary" className="text-xs font-semibold">
              {preset.tags[0] ?? "Estilo Visual"}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold">
            {preset.label}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {preset.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 aspect-[4/5] w-full max-w-[180px] mx-auto overflow-hidden rounded-xl border border-border shadow-xs">
          <StyleMockupThumbnail mockup={preset.mockup} />
        </div>

        {/* shadcn-ignore: container estrutural de especificações visuais do estilo */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs">
          <div className="flex flex-col">
            <Typography
              variant="muted"
              as="span"
              className="font-semibold text-foreground"
            >
              Paleta de Cores:
            </Typography>
            <Typography
              variant="muted"
              as="span"
              className="text-muted-foreground text-[11px]"
            >
              {preset.artDirection.palette}
            </Typography>
          </div>
          <div className="flex flex-col">
            <Typography
              variant="muted"
              as="span"
              className="font-semibold text-foreground"
            >
              Composição e Layout:
            </Typography>
            <Typography
              variant="muted"
              as="span"
              className="text-muted-foreground text-[11px]"
            >
              {preset.artDirection.composition}
            </Typography>
          </div>
          <div className="flex flex-col">
            <Typography
              variant="muted"
              as="span"
              className="font-semibold text-foreground"
            >
              Iluminação e Textura:
            </Typography>
            <Typography
              variant="muted"
              as="span"
              className="text-muted-foreground text-[11px]"
            >
              {preset.artDirection.lighting}
            </Typography>
          </div>
          <div className="flex flex-col">
            <Typography
              variant="muted"
              as="span"
              className="font-semibold text-foreground"
            >
              Atmosfera Visual:
            </Typography>
            <Typography
              variant="muted"
              as="span"
              className="text-muted-foreground text-[11px]"
            >
              {preset.artDirection.atmosphere}
            </Typography>
          </div>
        </div>

        <DialogClose asChild>
          <Button
            type="button"
            variant="default"
            onClick={() => onSelectPreset(preset.id)}
            data-testid={`dialog-choose-preset-${preset.id}`}
            className="mt-3 w-full min-h-[44px]"
          >
            <Check className="size-4 mr-2" />
            Escolher este estilo
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
