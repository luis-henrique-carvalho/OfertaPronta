import { Card } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";
import type {
  PrototypeCatalogItem,
  StyleVisualOption,
} from "../prototype-catalog-data";

interface StyleMiniPostCardProps {
  style: StyleVisualOption;
  segmentData: PrototypeCatalogItem;
  isSelected: boolean;
  businessName: string;
  title: string;
  price: string;
  productImage: string | null;
  onSelect: () => void;
}

export function StyleMiniPostCard({
  style,
  segmentData,
  isSelected,
  businessName,
  title,
  price,
  productImage,
  onSelect,
}: StyleMiniPostCardProps) {
  const SegmentIcon = segmentData.icon;
  const displayStore =
    businessName.trim() || segmentData.defaultPlaceholders.businessName;
  const displayTitle =
    title.trim() || segmentData.defaultPlaceholders.offerTitle;

  return (
    <Card
      onClick={onSelect}
      className={`group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all p-2 flex flex-col gap-2.5 ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {/* Miniatura simulando um Post de Instagram 4:5 Real */}
      <div
        className={`relative aspect-[4/5] w-full overflow-hidden rounded-xl ${style.bgPreview} ${style.textColor} p-3 flex flex-col justify-between shadow-inner border border-black/10`}
      >
        {/* Topo do Mini-Post: Nome da Loja + Selo */}
        <div className="flex items-center justify-between gap-1 z-10">
          <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-85 truncate max-w-[85px]">
            {displayStore}
          </span>
          <span
            className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-2xs shrink-0 ${style.badgeBg}`}
          >
            {style.badgeText}
          </span>
        </div>

        {/* Centro do Mini-Post: Foto do Produto do Usuário ou Ícone Estilizado */}
        <div className="my-auto flex flex-col items-center justify-center py-1 z-10">
          {productImage ? (
            <div className="size-16 sm:size-20 rounded-xl overflow-hidden border-2 border-white/80 shadow-md rotate-[-2deg]">
              <img
                src={productImage}
                alt="Preview"
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`size-14 sm:size-16 rounded-2xl flex items-center justify-center shadow-sm ${
                style.layoutType === "clean-frame"
                  ? "bg-white text-stone-800 border border-stone-200"
                  : "bg-white/15 backdrop-blur-xs border border-white/20"
              }`}
            >
              <SegmentIcon className="size-7 opacity-90" />
            </div>
          )}
        </div>

        {/* Rodapé do Mini-Post: Título + Etiqueta de Preço (se houver) */}
        <div className="flex flex-col gap-1 z-10 text-center">
          <span className="text-[11px] font-extrabold leading-tight line-clamp-2 drop-shadow-2xs">
            {displayTitle}
          </span>

          {price.trim() ? (
            <div
              className={`mx-auto mt-0.5 inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black shadow-sm ${style.badgeBg}`}
            >
              {price}
            </div>
          ) : (
            <div className="mx-auto mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-bold opacity-80">
              <Sparkles className="size-2.5" />
              <span>Confira na loja</span>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé informativo: Nome do Estilo + Paleta de Cores (Swatches) */}
      <div className="px-1 pb-0.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold text-foreground truncate">
            {style.name}
          </span>
          {isSelected && (
            <CheckCircle2 className="size-4 text-primary shrink-0" />
          )}
        </div>

        {/* Amostras da Paleta de Cores (Bolinhas) + Descrição da Paleta */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center -space-x-1 shrink-0"
            aria-label={`Paleta de cores ${style.tag}`}
          >
            {style.paletteSwatches.map((hex) => (
              <span
                key={`${style.id}-${hex}`}
                className="size-4 rounded-full border border-black/20 dark:border-white/25 shadow-2xs"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold truncate">
            {style.tag}
          </span>
        </div>
      </div>
    </Card>
  );
}
