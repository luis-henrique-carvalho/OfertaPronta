import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { QUICK_BRAND_PALETTES } from "../../data/creation-catalog";

export interface Step4CustomPaletteCardProps {
  customStyleNote: string;
  onCustomStyleNoteChange: (val: string) => void;
  onSelectStyle: (styleId: string) => void;
  className?: string;
}

export function Step4CustomPaletteCard({
  customStyleNote,
  onCustomStyleNoteChange,
  onSelectStyle,
  className,
}: Step4CustomPaletteCardProps) {
  return (
    <Card
      className={cn(
        "p-3.5 rounded-2xl border-border bg-card shadow-2xs mt-1 space-y-2.5",
        className,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary shrink-0" />
          <Label
            htmlFor="custom-palette-input"
            className="text-xs font-bold text-foreground"
          >
            Quer personalizar o estilo ou fazer algum ajuste? (Opcional)
          </Label>
        </div>
        <Typography variant="muted" className="text-xs">
          Escolha uma paleta rápida ou escreva suas preferências de estilo
          (fundo, clima, cores):
        </Typography>
      </div>

      {/* Chips rápidos de combinação de cores */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_BRAND_PALETTES.map((palette) => {
          const isSelectedPalette =
            customStyleNote.includes(palette.value) ||
            customStyleNote.includes(`Paleta: ${palette.label}`) ||
            customStyleNote === palette.label;

          return (
            <Button
              key={palette.label}
              type="button"
              variant="outline"
              size="sm"
              data-testid={`palette-chip-${palette.name}`}
              aria-pressed={isSelectedPalette}
              onClick={() => {
                const updated = applyPaletteToStyleNote(
                  customStyleNote,
                  palette.value,
                );
                onCustomStyleNoteChange(updated);
                if (updated.trim().length > 0) {
                  onSelectStyle("");
                }
              }}
              className={cn(
                "h-8 min-h-[36px] rounded-full px-2.5 text-[11px] font-semibold gap-1.5 select-none",
                isSelectedPalette
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {/* shadcn-ignore: decorative color swatches */}
              <span className="flex items-center -space-x-1" aria-hidden="true">
                {palette.swatches.map((hex) => (
                  <span
                    key={`${palette.label}-${hex}`}
                    className="size-3 rounded-full border border-black/20"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </span>
              <span>{palette.label}</span>
            </Button>
          );
        })}
      </div>

      <Textarea
        id="custom-palette-input"
        data-testid="input-custom-palette"
        placeholder="Ex: Paleta: Preto e Dourado. Quero um estilo rústico com madeira, fundo escuro e letras douradas..."
        value={customStyleNote}
        onChange={(e) => {
          const val = e.target.value;
          onCustomStyleNoteChange(val);
          if (val.trim().length > 0) {
            onSelectStyle("");
          }
        }}
        className="min-h-[72px] resize-none rounded-xl text-xs sm:text-sm"
        rows={2}
      />
    </Card>
  );
}

/**
 * Insere, substitui ou desmarca a paleta dentro do texto de instruções customizadas,
 * preservando as opiniões e ajustes adicionais que o usuário tiver digitado.
 */
function applyPaletteToStyleNote(
  currentNote: string,
  paletteValue: string,
): string {
  const existingPalette = QUICK_BRAND_PALETTES.find(
    (p) =>
      currentNote.includes(p.value) ||
      currentNote.includes(`Paleta: ${p.label}`) ||
      currentNote.includes(p.label),
  );

  if (existingPalette) {
    const isSamePalette =
      currentNote.includes(paletteValue) ||
      (currentNote.includes(existingPalette.value) &&
        existingPalette.value === paletteValue);

    if (isSamePalette) {
      return currentNote
        .replace(paletteValue, "")
        .replace(existingPalette.value, "")
        .replace(/^[.\s,;-]+/, "")
        .trim();
    }

    const targetToRemove = currentNote.includes(existingPalette.value)
      ? existingPalette.value
      : currentNote.includes(`Paleta: ${existingPalette.label}`)
        ? `Paleta: ${existingPalette.label}`
        : existingPalette.label;

    return currentNote.replace(targetToRemove, paletteValue).trim();
  }

  if (!currentNote.trim()) {
    return paletteValue;
  }
  return `${paletteValue}. ${currentNote.trim()}`;
}
