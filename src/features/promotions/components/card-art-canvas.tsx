// shadcn-ignore: Canvas customizado de renderização visual e proporção nativa da arte do card
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { SimulatedCardArt } from "./simulated-card-art";

export interface CardArtCanvasProps {
  currentRatio: "feed" | "story";
  targetAspectRatio?: "feed" | "story";
  activePreset: {
    previewBadgeColor: string;
    label: string;
  };
  previewCardImageUrl?: string | null;
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
  targetAspectRatio,
  activePreset,
  previewCardImageUrl,
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
  const [detectedRatio, setDetectedRatio] = useState<"feed" | "story" | null>(
    null,
  );

  const effectiveImageRatio = targetAspectRatio ?? detectedRatio;
  const isRatioMismatched = Boolean(
    effectiveImageRatio && effectiveImageRatio !== currentRatio,
  );

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      setDetectedRatio(ratio < 0.68 ? "story" : "feed");
    }
  };

  return (
    <div
      className={`relative w-full max-w-[280px] xs:max-w-xs sm:max-w-[340px] overflow-hidden rounded-2xl shadow-xl transition-all duration-300 border border-border/80 ${
        currentRatio === "feed" ? "aspect-[4/5]" : "aspect-[9/16]"
      }`}
      style={{
        background: `linear-gradient(145deg, #0f172a 0%, #1e293b 60%, ${activePreset.previewBadgeColor}33 100%)`,
      }}
    >
      {previewCardImageUrl ? (
        <div className="relative size-full overflow-hidden flex items-center justify-center">
          {isRatioMismatched ? (
            <>
              {/* Fundo harmônico desfocado para adaptação sem cortes de texto */}
              <img
                src={previewCardImageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full object-cover scale-125 blur-md opacity-60 pointer-events-none"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

              {/* Imagem nativa contida perfeitamente sem nenhum corte */}
              <img
                src={previewCardImageUrl}
                alt={offerTitle || placeholderOfferTitle || "Card Publicitário"}
                className="relative z-10 max-h-full max-w-full object-contain shadow-2xl transition-all duration-300"
                onLoad={handleImageLoad}
              />
            </>
          ) : (
            <img
              src={previewCardImageUrl}
              alt={offerTitle || placeholderOfferTitle || "Card Publicitário"}
              className="size-full object-cover transition-all duration-300"
              onLoad={handleImageLoad}
            />
          )}
        </div>
      ) : (
        <SimulatedCardArt
          activePreset={activePreset}
          productImageDataUrl={productImageDataUrl}
          referenceImageDataUrl={referenceImageDataUrl}
          showWatermark={showWatermark}
          businessName={businessName}
          placeholderBusinessName={placeholderBusinessName}
          offerTitle={offerTitle}
          placeholderOfferTitle={placeholderOfferTitle}
          promoPrice={promoPrice}
          placeholderPromoPrice={placeholderPromoPrice}
          originalPrice={originalPrice}
          callToAction={callToAction}
          placeholderCallToAction={placeholderCallToAction}
          whatsapp={whatsapp}
          SegmentIcon={SegmentIcon}
        />
      )}
    </div>
  );
}
