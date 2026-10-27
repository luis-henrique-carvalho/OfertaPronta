import { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreationCatalogItem } from "../../data/creation-catalog";
import { REFERENCE_STYLE_PRESET_ID } from "../../data/offer-brief.schema";
import type { ShowcaseCardItem } from "../../data/showcase-catalog";
import { StyleMiniPostCard } from "./style-mini-post-card";
import { ReferenceStyleCard } from "./reference-style-card";
import { ShowcaseGalleryDialog } from "./showcase-gallery-dialog";
import { Step4ActiveReferenceBanner } from "./step4-active-reference-banner";
import { Step4CustomPaletteCard } from "./step4-custom-palette-card";

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
  onSelectReference?: (card: ShowcaseCardItem) => void;
  onClearReference?: () => void;
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
  onSelectReference,
  onClearReference,
  onCustomStyleNoteChange,
  className,
}: Step4StyleAndPaletteProps) {
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const styles = segmentData.styles;
  const hasReference = Boolean(
    referenceImageDataUrl && referenceImageDataUrl.trim().length > 0,
  );
  const isShowcaseReference = Boolean(
    hasReference &&
    (referenceImageDataUrl?.startsWith("http://") ||
      referenceImageDataUrl?.startsWith("https://")),
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

  const handleSelectReference = (card: ShowcaseCardItem) => {
    if (onSelectReference) {
      onSelectReference(card);
    } else {
      handleSelectStyle(card.stylePresetId);
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
        activeReferenceUrl={referenceImageDataUrl}
        onSelectReference={handleSelectReference}
        onSelectStyle={handleSelectStyle}
      />

      {/* Banner / Cartão de Referência Ativa da Vitrine */}
      {hasReference && isShowcaseReference && (
        <Step4ActiveReferenceBanner
          referenceImageDataUrl={referenceImageDataUrl!}
          onOpenShowcase={() => setIsShowcaseOpen(true)}
          onClearReference={onClearReference}
        />
      )}

      {/* Card Especial de Referência quando o usuário enviou um Print no passo anterior */}
      {hasReference && !isShowcaseReference && (
        <div className="space-y-2">
          <ReferenceStyleCard
            referenceImageDataUrl={referenceImageDataUrl!}
            isRefSelected={isRefSelected}
            onSelect={() => handleSelectStyle(REFERENCE_STYLE_PRESET_ID)}
          />
          <div className="flex items-center justify-end gap-2 px-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="btn-change-showcase-reference"
              onClick={() => setIsShowcaseOpen(true)}
              className="min-h-[44px] text-xs font-semibold gap-1.5 border-primary/40 hover:bg-primary/10 select-none"
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
                className="min-h-[44px] text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 select-none"
              >
                <Trash2 className="size-3.5 shrink-0" />
                <span>Remover Referência</span>
              </Button>
            )}
          </div>
        </div>
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
      <Step4CustomPaletteCard
        customStyleNote={customStyleNote}
        onCustomStyleNoteChange={onCustomStyleNoteChange}
        onSelectStyle={onSelectStyle}
      />
    </div>
  );
}
