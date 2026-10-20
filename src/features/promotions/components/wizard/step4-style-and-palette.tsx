import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUICK_BRAND_PALETTES,
  type CreationCatalogItem,
} from "../../data/creation-catalog";
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
  const currentSelectedStyleId = selectedStyleId || styles[0]?.id;

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

      {/* Alerta se o usuário já enviou um Print de Referência no passo anterior */}
      {referenceImageDataUrl && (
        <Card
          data-testid="reference-image-active-banner"
          className="flex items-center gap-3 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-3"
        >
          <img
            src={referenceImageDataUrl}
            alt="Print de referência"
            className="size-12 rounded-lg object-cover border border-amber-500/40 shrink-0"
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Print de Referência Ativo!</span>
            </div>
            <Typography variant="muted" className="text-[11px] leading-snug">
              A IA vai seguir o formato do print que você enviou.
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
            isSelected={currentSelectedStyleId === style.id}
            businessName={businessName}
            offerTitle={offerTitle}
            promoPrice={promoPrice}
            productImageDataUrl={productImageDataUrl}
            onSelect={() => onSelectStyle(style.id)}
          />
        ))}
      </div>

      {/* Seção opcional de Paleta Personalizada da Loja */}
      <Card className="p-3.5 rounded-2xl border-border bg-card shadow-2xs mt-1 space-y-2.5">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary shrink-0" />
          <Label
            htmlFor="custom-palette-input"
            className="text-xs font-bold text-foreground"
          >
            Quer forçar outra paleta de cores da sua loja? (Opcional)
          </Label>
        </div>

        {/* Chips rápidos de combinação de cores */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_BRAND_PALETTES.map((palette) => {
            const isSelectedPalette = customStyleNote === palette.value;
            return (
              <Button
                key={palette.label}
                type="button"
                variant="outline"
                size="sm"
                data-testid={`palette-chip-${palette.name}`}
                aria-pressed={isSelectedPalette}
                onClick={() =>
                  onCustomStyleNoteChange(
                    isSelectedPalette ? "" : palette.value,
                  )
                }
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

        <Input
          id="custom-palette-input"
          data-testid="input-custom-palette"
          placeholder="Ou digite a cor da sua loja (ex: Azul royal e amarelo)..."
          value={customStyleNote}
          onChange={(e) => onCustomStyleNoteChange(e.target.value)}
          className="h-10 rounded-xl text-xs"
        />
      </Card>
    </div>
  );
}
