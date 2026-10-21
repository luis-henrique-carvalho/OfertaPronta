import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUICK_BRAND_PALETTES,
  type CreationCatalogItem,
} from "../../data/creation-catalog";
import { REFERENCE_STYLE_PRESET_ID } from "../../data/offer-brief.schema";
import { StyleMiniPostCard } from "./style-mini-post-card";

export interface Step4StyleAndPaletteProps {
  segmentData: CreationCatalogItem;
  selectedStyleId?: string | null;
  businessName: string;
  offerTitle: string;
  promoPrice?: string;
  productImageDataUrl?: string | null;
  referenceImageDataUrl?: string | null;
  customStyleNote?: string;
  onSelectStyle: (styleId: string) => void;
  onCustomStyleNoteChange: (val: string) => void;
  className?: string;
}

export function Step4StyleAndPalette({
  segmentData,
  selectedStyleId,
  businessName,
  offerTitle,
  promoPrice,
  productImageDataUrl,
  referenceImageDataUrl,
  customStyleNote = "",
  onSelectStyle,
  onCustomStyleNoteChange,
  className,
}: Step4StyleAndPaletteProps) {
  const styles = segmentData.styles;
  const hasReference = Boolean(
    referenceImageDataUrl && referenceImageDataUrl.trim().length > 0,
  );

  const isRefSelected =
    hasReference &&
    (selectedStyleId === REFERENCE_STYLE_PRESET_ID || !selectedStyleId);

  const activeCatalogStyleId =
    !hasReference &&
    (!selectedStyleId || selectedStyleId === REFERENCE_STYLE_PRESET_ID)
      ? styles[0]?.id
      : selectedStyleId;

  const handleRefKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectStyle(REFERENCE_STYLE_PRESET_ID);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="space-y-1">
        <Typography
          variant="h3"
          className="text-xl font-bold tracking-tight sm:text-2xl"
        >
          Escolha o visual e paleta do seu card
        </Typography>
        <Typography variant="muted" className="text-xs sm:text-sm">
          Toque na opção que mais combina com a sua loja:
        </Typography>
      </div>

      {/* Card Especial de Referência quando o usuário enviou um Print no passo anterior */}
      {hasReference && (
        <Card
          data-testid="reference-style-card"
          role="button"
          tabIndex={0}
          aria-pressed={isRefSelected}
          aria-label="Estilo do seu Print de Referência: A IA vai copiar a estética, paleta de cores e tipografia do print que você enviou"
          onClick={() => onSelectStyle(REFERENCE_STYLE_PRESET_ID)}
          onKeyDown={handleRefKeyDown}
          className={cn(
            "group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all p-3.5 flex items-center gap-3.5 select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isRefSelected
              ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
              : "border-border bg-card hover:border-primary/40 opacity-80 hover:opacity-100",
          )}
        >
          {/* Miniatura do Print de Referência */}
          <div className="relative size-16 sm:size-20 shrink-0 aspect-square overflow-hidden rounded-xl border border-black/15 shadow-xs">
            <img
              src={referenceImageDataUrl!}
              alt="Print de referência"
              className="size-full object-cover"
            />
          </div>

          {/* Textos e Badges */}
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
              A IA vai copiar a estética, paleta de cores e tipografia do print
              que você enviou.
            </Typography>
          </div>
        </Card>
      )}

      {/* Grade 2x3 de Mini-Posts com os dados reais do usuário */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {styles.map((style) => (
          <StyleMiniPostCard
            key={style.id}
            style={style}
            segmentData={segmentData}
            isSelected={
              hasReference
                ? !isRefSelected && selectedStyleId === style.id
                : activeCatalogStyleId === style.id
            }
            businessName={businessName}
            offerTitle={offerTitle}
            promoPrice={promoPrice}
            productImageDataUrl={productImageDataUrl}
            onSelect={() => onSelectStyle(style.id)}
          />
        ))}
      </div>

      {/* Seção opcional de Personalização de Estilo e Paleta */}
      <Card className="p-3.5 rounded-2xl border-border bg-card shadow-2xs mt-1 space-y-2.5">
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
            Escolha uma paleta rápida ou escreva suas preferências de estilo (fundo, clima, cores):
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
                }}
                className={cn(
                  "h-8 min-h-[36px] rounded-full px-2.5 text-[11px] font-semibold gap-1.5 select-none",
                  isSelectedPalette
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {/* shadcn-ignore: decorative color swatches */}
                <span
                  className="flex items-center -space-x-1"
                  aria-hidden="true"
                >
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
          onChange={(e) => onCustomStyleNoteChange(e.target.value)}
          className="min-h-[72px] resize-none rounded-xl text-xs sm:text-sm"
          rows={2}
        />
      </Card>
    </div>
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
  // Encontra se já existe alguma paleta conhecida no texto
  const existingPalette = QUICK_BRAND_PALETTES.find(
    (p) =>
      currentNote.includes(p.value) ||
      currentNote.includes(`Paleta: ${p.label}`) ||
      currentNote.includes(p.label),
  );

  if (existingPalette) {
    // Se o usuário clicou na mesma paleta que já estava ativa, remove-a (toggle off)
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

    // Se é uma paleta diferente, substitui no texto
    const targetToRemove = currentNote.includes(existingPalette.value)
      ? existingPalette.value
      : currentNote.includes(`Paleta: ${existingPalette.label}`)
        ? `Paleta: ${existingPalette.label}`
        : existingPalette.label;

    return currentNote.replace(targetToRemove, paletteValue).trim();
  }

  // Se não tinha paleta prévia, insere no início preservando o restante do texto
  if (!currentNote.trim()) {
    return paletteValue;
  }
  return `${paletteValue}. ${currentNote.trim()}`;
}
