import { Typography } from "@/components/ui/typography";
import type { LucideIcon } from "lucide-react";

export interface CardArtCanvasProps {
  currentRatio: "feed" | "story";
  activePreset: {
    previewBadgeColor: string;
    label: string;
  };
  productImageDataUrl?: string | null;
  referenceImageDataUrl?: string | null;
  showWatermark?: boolean;
  businessName?: string;
  placeholderBusinessName: string;
  offerTitle?: string;
  placeholderOfferTitle: string;
  promoPrice?: string;
  placeholderPromoPrice: string;
  originalPrice?: string | null;
  callToAction?: string | null;
  placeholderCallToAction: string;
  whatsapp?: string | null;
  SegmentIcon: LucideIcon;
}

export function CardArtCanvas({
  currentRatio,
  activePreset,
  productImageDataUrl,
  referenceImageDataUrl,
  showWatermark = true,
  businessName,
  placeholderBusinessName,
  offerTitle,
  placeholderOfferTitle,
  promoPrice,
  placeholderPromoPrice,
  originalPrice,
  callToAction,
  placeholderCallToAction,
  whatsapp,
  SegmentIcon,
}: CardArtCanvasProps) {
  return (
    <div
      className={`relative w-full max-w-[280px] xs:max-w-xs sm:max-w-[340px] overflow-hidden rounded-2xl shadow-xl transition-all duration-300 border border-border/80 ${
        currentRatio === "feed" ? "aspect-[4/5]" : "aspect-[9/16]"
      }`}
      style={{
        background: `linear-gradient(145deg, #0f172a 0%, #1e293b 60%, ${activePreset.previewBadgeColor}33 100%)`,
      }}
    >
      {/* Fundo de Imagem (Produto ou Referência) quando fornecida */}
      {productImageDataUrl ? (
        <div className="absolute inset-0">
          <img
            src={productImageDataUrl}
            alt="Produto de fundo"
            className="size-full object-cover opacity-60 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/70" />
        </div>
      ) : referenceImageDataUrl ? (
        <div className="absolute inset-0">
          <img
            src={referenceImageDataUrl}
            alt="Referência de fundo"
            className="size-full object-cover opacity-40 blur-xs scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/80" />
        </div>
      ) : (
        <div className="absolute inset-0 opacity-20">
          <div
            className="size-full"
            style={{
              backgroundImage: `radial-gradient(${activePreset.previewBadgeColor} 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          />
        </div>
      )}

      {/* Marca d'Água Diagonal Protetora em Prévia Gratuita */}
      {showWatermark && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
          <div className="rotate-[-32deg] select-none text-center">
            <span className="block text-2xl sm:text-3xl font-black uppercase tracking-widest text-white/20 drop-shadow-md">
              PRÉVIA OFERTAPRONTA
            </span>
            <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/20">
              ARTE PROTEGIDA • LIBERAÇÃO PÓS-PIX
            </span>
          </div>
        </div>
      )}

      {/* Conteúdo Gráfico do Card Publicitário */}
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-white">
        {/* Topo: Nome do Estabelecimento e Badge de Segmento */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 border border-white/10">
            <SegmentIcon className="size-3.5 text-primary" />
            <span className="text-xs font-bold truncate max-w-[150px]">
              {businessName || placeholderBusinessName}
            </span>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md border border-white/20 text-white"
            style={{
              backgroundColor: `${activePreset.previewBadgeColor}88`,
            }}
          >
            {activePreset.label.split(" ")[0]}
          </span>
        </div>

        {/* Centro: Foto em Destaque (se houver) ou Ícone de Clima */}
        <div className="my-auto flex flex-col items-center justify-center text-center">
          {productImageDataUrl ? (
            <div className="relative size-32 sm:size-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
              <img
                src={productImageDataUrl}
                alt="Produto em destaque"
                className="size-full object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                Foto Real
              </div>
            </div>
          ) : (
            <div
              className="flex size-20 items-center justify-center rounded-3xl backdrop-blur-md border border-white/15 shadow-xl"
              style={{
                backgroundColor: `${activePreset.previewBadgeColor}44`,
              }}
            >
              <SegmentIcon className="size-10 text-white" />
            </div>
          )}
        </div>

        {/* Rodapé: Headline da Oferta + Selo de Preço + CTA */}
        <div className="flex flex-col gap-2.5">
          <div>
            <Typography
              as="h3"
              className="text-lg sm:text-xl font-extrabold text-white leading-tight drop-shadow-md line-clamp-2"
            >
              {offerTitle || placeholderOfferTitle}
            </Typography>
          </div>

          {/* Bloco de Preços */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-md">
              {promoPrice || placeholderPromoPrice}
            </span>
            {originalPrice && (
              <span className="text-xs sm:text-sm text-white/60 line-through">
                {originalPrice}
              </span>
            )}
          </div>

          {/* Rodapé com CTA e WhatsApp */}
          <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[11px] font-semibold">
            <span className="text-white/90">
              {callToAction || placeholderCallToAction}
            </span>
            {whatsapp && (
              // shadcn-ignore: decorativo
              <span className="text-emerald-400 font-bold truncate max-w-[110px]">
                {whatsapp}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
