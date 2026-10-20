import * as React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CreationCatalogItem,
  StyleVisualOption,
} from "../../data/creation-catalog";

export interface StyleMiniPostCardProps {
  style: StyleVisualOption;
  segmentData: CreationCatalogItem;
  isSelected: boolean;
  businessName?: string;
  offerTitle?: string;
  title?: string;
  promoPrice?: string;
  price?: string;
  productImageDataUrl?: string | null;
  productImage?: string | null;
  onSelect: () => void;
  className?: string;
}

export function StyleMiniPostCard({
  style,
  segmentData,
  isSelected,
  businessName,
  offerTitle,
  title,
  promoPrice,
  price,
  productImageDataUrl,
  productImage,
  onSelect,
  className,
}: StyleMiniPostCardProps) {
  const SegmentIcon = segmentData.icon;

  // Interpolação de valores reais do comerciante com fallback para os placeholders do segmento
  const displayStore =
    businessName?.trim() ||
    segmentData.placeholders?.businessName ||
    segmentData.defaultPlaceholders?.businessName ||
    "Nome da Loja";

  const rawTitle = offerTitle ?? title;
  const displayTitle =
    rawTitle?.trim() ||
    segmentData.placeholders?.offerTitle ||
    segmentData.defaultPlaceholders?.offerTitle ||
    "Oferta Especial";

  const rawPrice = promoPrice ?? price;
  const displayPrice = rawPrice?.trim() || "";

  const displayProductImage = productImageDataUrl ?? productImage;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Estilo ${style.name}: ${style.tag}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all p-2 flex flex-col gap-2.5 min-h-[44px] select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
          : "border-border bg-card hover:border-primary/40",
        className,
      )}
    >
      {/* Miniatura simulando um Post de Instagram 4:5 Real */}
      <div
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden rounded-xl p-3 flex flex-col justify-between shadow-inner border border-black/10",
          style.bgPreview,
          style.textColor,
        )}
      >
        {/* Imagem de Fundo com Overlay Estético quando houver produto enviado */}
        {displayProductImage && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src={displayProductImage}
              alt=""
              aria-hidden="true"
              className="size-full object-cover opacity-20 filter saturate-150 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>
        )}

        {/* Topo do Mini-Post: Nome da Loja + Selo de Destaque */}
        <div className="flex items-center justify-between gap-1 z-10">
          <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-85 truncate max-w-[85px]">
            {displayStore}
          </span>
          <span
            className={cn(
              "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-2xs shrink-0",
              style.badgeBg,
            )}
          >
            {style.badgeText}
          </span>
        </div>

        {/* Centro do Mini-Post: Foto do Produto do Usuário ou Ícone do Ramo */}
        <div className="my-auto flex flex-col items-center justify-center py-1 z-10">
          {displayProductImage ? (
            <div className="size-16 sm:size-20 rounded-xl overflow-hidden border-2 border-white/80 shadow-md rotate-[-2deg]">
              <img
                src={displayProductImage}
                alt="Preview do produto"
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div
              className={cn(
                "size-14 sm:size-16 rounded-2xl flex items-center justify-center shadow-xs",
                style.layoutType === "clean-frame"
                  ? "bg-white text-stone-800 border border-stone-200"
                  : "bg-white/15 backdrop-blur-xs border border-white/20",
              )}
            >
              <SegmentIcon className="size-7 opacity-90" />
            </div>
          )}
        </div>

        {/* Rodapé do Mini-Post: Título + Preço Condicional */}
        <div className="flex flex-col gap-1 z-10 text-center">
          <span className="text-[11px] font-extrabold leading-tight line-clamp-2 drop-shadow-2xs">
            {displayTitle}
          </span>

          {displayPrice ? (
            <div
              className={cn(
                "mx-auto mt-0.5 inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black shadow-xs",
                style.badgeBg,
              )}
            >
              {displayPrice}
            </div>
          ) : (
            <div className="mx-auto mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-bold opacity-80">
              <Sparkles className="size-2.5" />
              <span>Confira na loja</span>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé informativo do card: Nome do Estilo + Paleta de Cores (Swatches) */}
      <div className="px-1 pb-0.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-foreground truncate">
            {style.name}
          </span>
          {isSelected && (
            <CheckCircle2
              data-testid="selected-check-icon"
              className="size-4 text-primary shrink-0"
            />
          )}
        </div>

        {/* Amostras da Paleta de Cores (Swatches) */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center -space-x-1 shrink-0"
            aria-label={`Paleta de cores ${style.tag}`}
          >
            {style.paletteSwatches.map((hex, idx) => {
              const position =
                idx === 0 ? "primary" : idx === 1 ? "secondary" : "accent";
              return (
                <span
                  key={`${style.id}-${position}-${hex}`}
                  className="size-4 rounded-full border border-black/20 dark:border-white/25 shadow-2xs"
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold truncate">
            {style.tag}
          </span>
        </div>
      </div>
    </Card>
  );
}
