import { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUICK_BRAND_PALETTES,
  type CreationCatalogItem,
} from "../../data/creation-catalog";
import { REFERENCE_STYLE_PRESET_ID } from "../../data/offer-brief.schema";
import { StyleMiniPostCard } from "./style-mini-post-card";
import { ReferenceStyleCard } from "./reference-style-card";
import { ShowcaseGalleryDialog } from "./showcase-gallery-dialog";

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
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const styles = segmentData.styles;
  const hasReference = Boolean(
    referenceImageDataUrl && referenceImageDataUrl.trim().length > 0,
  );
  const hasCustomNote = Boolean(
    customStyleNote && customStyleNote.trim().length > 0,
  );

  // Se o usuário personalizou estilo ou paleta, remove a seleção dos cards predefinidos
  const isRefSelected =
    !hasCustomNote &&
    hasReference &&
    (selectedStyleId === REFERENCE_STYLE_PRESET_ID || !selectedStyleId);

  const activeCatalogStyleId =
    !hasCustomNote && !hasReference && !selectedStyleId
      ? styles[0]?.id
      : !hasCustomNote && selectedStyleId !== REFERENCE_STYLE_PRESET_ID
        ? selectedStyleId
        : null;

  const handleSelectStyle = (styleId: string) => {
    onSelectStyle(styleId);
    if (customStyleNote && customStyleNote.trim().length > 0) {
      onCustomStyleNoteChange("");
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

      {/* Botão de Destaque: Ver Exemplos Reais Criados por IA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl border border-primary/25 bg-primary/5 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Badge
            variant="secondary"
            className="gap-1 px-2 py-0.5 text-[11px] font-semibold shrink-0"
          >
            <Sparkles className="size-3 text-primary shrink-0" />
            <span>Inspiração</span>
          </Badge>
          <Typography
            variant="muted"
            className="text-xs text-foreground/85 font-medium truncate"
          >
            Quer ver cards prontos da IA para {segmentData.label}?
          </Typography>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="btn-open-showcase-gallery"
          onClick={() => setIsShowcaseOpen(true)}
          className="min-h-[44px] h-10 px-3.5 text-xs font-bold gap-1.5 shrink-0 border-primary/40 bg-background text-primary hover:bg-primary hover:text-primary-foreground shadow-2xs transition-colors select-none"
        >
          <Sparkles className="size-3.5 shrink-0" />
          <span>Ver Exemplos Reais Criados por IA</span>
        </Button>
      </div>

      <ShowcaseGalleryDialog
        open={isShowcaseOpen}
        onOpenChange={setIsShowcaseOpen}
        segment={segmentData.id}
        segmentLabel={segmentData.label}
        activeStyleId={activeCatalogStyleId}
        onSelectStyle={handleSelectStyle}
      />

      {/* Card Especial de Referência quando o usuário enviou um Print no passo anterior */}
      {hasReference && (
        <ReferenceStyleCard
          referenceImageDataUrl={referenceImageDataUrl!}
          isRefSelected={isRefSelected}
          onSelect={() => handleSelectStyle(REFERENCE_STYLE_PRESET_ID)}
        />
      )}

      {/* Grade 2x3 de Mini-Posts com os dados reais do usuário */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {styles.map((style) => (
          <StyleMiniPostCard
            key={style.id}
            style={style}
            segmentData={segmentData}
            isSelected={activeCatalogStyleId === style.id}
            businessName={businessName}
            offerTitle={offerTitle}
            promoPrice={promoPrice}
            productImageDataUrl={productImageDataUrl}
            onSelect={() => handleSelectStyle(style.id)}
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
