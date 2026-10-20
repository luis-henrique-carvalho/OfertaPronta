import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import type { BusinessSegment } from "../data/offer-brief.schema";
import { SEGMENT_CATALOG } from "../data/offer-brief.schema";
import {
  Smartphone,
  Layers,
  Sparkles,
  ShoppingBag,
  Flame,
  UtensilsCrossed,
  Pizza,
  Store,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import { CardArtCanvas } from "./card-art-canvas";

export type PreviewAspectRatio = "feed" | "story";

export interface LiveCardPreviewProps {
  businessSegment: BusinessSegment;
  businessName: string;
  offerTitle: string;
  promoPrice: string;
  originalPrice?: string | null;
  callToAction?: string | null;
  whatsapp?: string | null;
  previewCardImageUrl?: string | null;
  productImageDataUrl?: string | null;
  referenceImageDataUrl?: string | null;
  stylePresetId?: string | null;
  targetAspectRatio?: PreviewAspectRatio;
  aspectRatio?: PreviewAspectRatio;
  onAspectRatioChange?: (ratio: PreviewAspectRatio) => void;
  showWatermark?: boolean;
}

const SEGMENT_ICONS: Record<BusinessSegment, LucideIcon> = {
  fashion: Shirt,
  supermarket: ShoppingBag,
  "beauty-salon": Sparkles,
  pizzeria: Pizza,
  "burger-shop": Flame,
  restaurant: UtensilsCrossed,
  "local-retail": Store,
};

export function LiveCardPreview({
  businessSegment,
  businessName,
  offerTitle,
  promoPrice,
  originalPrice,
  callToAction = "Peça agora!",
  whatsapp,
  previewCardImageUrl,
  productImageDataUrl,
  referenceImageDataUrl,
  stylePresetId,
  targetAspectRatio,
  aspectRatio: externalAspectRatio,
  onAspectRatioChange,
  showWatermark = true,
}: LiveCardPreviewProps) {
  const [internalAspectRatio, setInternalAspectRatio] =
    useState<PreviewAspectRatio>(
      () => targetAspectRatio ?? externalAspectRatio ?? "feed",
    );

  useEffect(() => {
    if (targetAspectRatio && !externalAspectRatio) {
      setInternalAspectRatio(targetAspectRatio);
    }
  }, [targetAspectRatio, externalAspectRatio]);

  const currentRatio = externalAspectRatio ?? internalAspectRatio;

  const handleRatioChange = (ratio: PreviewAspectRatio) => {
    if (onAspectRatioChange) {
      onAspectRatioChange(ratio);
    } else {
      setInternalAspectRatio(ratio);
    }
  };

  const catalog = SEGMENT_CATALOG[businessSegment];
  const SegmentIcon = SEGMENT_ICONS[businessSegment];

  // Encontra o estilo selecionado
  const activePreset =
    catalog.stylePresets.find((p) => p.id === stylePresetId) ||
    catalog.stylePresets[0];

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <Badge
            variant="secondary"
            className="gap-1.5 text-xs w-fit py-1 px-2.5 shrink-0"
          >
            <Sparkles className="size-3 text-primary shrink-0" />
            <span>Prévia do Card IA</span>
          </Badge>

          {/* Toggle Feed (4:5) vs Story (9:16) */}
          {/* shadcn-ignore: layout */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-full sm:w-auto justify-center">
            <Button
              type="button"
              variant={currentRatio === "feed" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleRatioChange("feed")}
              className="h-8 px-3 text-xs font-semibold flex-1 sm:flex-none"
              aria-pressed={currentRatio === "feed"}
            >
              <Layers className="size-3.5 mr-1.5 shrink-0" />
              Feed (4:5)
            </Button>
            <Button
              type="button"
              variant={currentRatio === "story" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleRatioChange("story")}
              className="h-8 px-3 text-xs font-semibold flex-1 sm:flex-none"
              aria-pressed={currentRatio === "story"}
            >
              <Smartphone className="size-3.5 mr-1.5 shrink-0" />
              Story (9:16)
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <CardTitle className="text-base sm:text-lg font-bold leading-tight">
            {`Card Publicitário (${currentRatio === "feed" ? "1080×1350" : "1080×1920"})`}
          </CardTitle>
          <Badge
            variant="outline"
            className="text-[11px] font-medium capitalize shrink-0 max-w-full truncate"
          >
            {catalog.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex justify-center p-2 sm:p-6 bg-muted/10 overflow-hidden">
        <CardArtCanvas
          currentRatio={currentRatio}
          targetAspectRatio={targetAspectRatio}
          activePreset={activePreset}
          previewCardImageUrl={previewCardImageUrl}
          productImageDataUrl={productImageDataUrl}
          referenceImageDataUrl={referenceImageDataUrl}
          showWatermark={showWatermark}
          businessName={businessName}
          placeholderBusinessName={catalog.placeholders.businessName}
          offerTitle={offerTitle}
          placeholderOfferTitle={catalog.placeholders.offerTitle}
          promoPrice={promoPrice}
          placeholderPromoPrice={catalog.placeholders.promoPrice}
          originalPrice={originalPrice}
          callToAction={callToAction}
          placeholderCallToAction={catalog.placeholders.callToAction}
          whatsapp={whatsapp}
          SegmentIcon={SegmentIcon}
        />
      </CardContent>

      <CardFooter className="flex flex-col gap-1 border-t border-border bg-card p-3 text-center sm:text-left">
        <Typography variant="muted" className="text-xs text-muted-foreground">
          ✨ Card gerado por IA com fusão harmoniosa de cores, iluminação e
          tipografia comercial.
        </Typography>
      </CardFooter>
    </Card>
  );
}
