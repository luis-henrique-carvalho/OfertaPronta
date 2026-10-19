import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Palette } from "lucide-react";
import {
  QUICK_BRAND_PALETTES,
  type PrototypeCatalogItem,
} from "../prototype-catalog-data";
import { StyleMiniPostCard } from "./style-mini-post-card";

interface Step4StyleProps {
  currentSegmentData: PrototypeCatalogItem;
  selectedStyle: string;
  businessName: string;
  title: string;
  price: string;
  productImage: string | null;
  referenceImage: string | null;
  customStyleNote: string;
  onSelectStyle: (styleId: string) => void;
  onCustomStyleNoteChange: (val: string) => void;
}

export function VariantAStep4Style({
  currentSegmentData,
  selectedStyle,
  businessName,
  title,
  price,
  productImage,
  referenceImage,
  customStyleNote,
  onSelectStyle,
  onCustomStyleNoteChange,
}: Step4StyleProps) {
  return (
    <div className="flex flex-col gap-4">
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

      {/* Aviso se o usuário já subiu um Print de Referência no passo anterior */}
      {referenceImage && (
        <Card className="flex items-center gap-3 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-3">
          <img
            src={referenceImage}
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

      {/* Grade 2x3 de Mini-Posts com os dados reais do usuário e paleta de cores */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {currentSegmentData.styles.map((style) => (
          <StyleMiniPostCard
            key={style.id}
            style={style}
            segmentData={currentSegmentData}
            isSelected={selectedStyle === style.id}
            businessName={businessName}
            title={title}
            price={price}
            productImage={productImage}
            onSelect={() => onSelectStyle(style.id)}
          />
        ))}
      </div>

      {/* Seção opcional de Paleta Personalizada da Loja */}
      <Card className="p-3.5 rounded-2xl border-border bg-card shadow-2xs mt-1 space-y-2.5">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <label className="text-xs font-bold text-foreground">
            Quer forçar outra paleta de cores da sua loja? (Opcional)
          </label>
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
                onClick={() =>
                  onCustomStyleNoteChange(
                    isSelectedPalette ? "" : palette.value,
                  )
                }
                className={`h-8 rounded-full px-2.5 text-[11px] font-semibold gap-1.5 ${
                  isSelectedPalette
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center -space-x-1">
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
          placeholder="Ou digite a cor da sua loja (ex: Azul royal e amarelo)..."
          value={customStyleNote}
          onChange={(e) => onCustomStyleNoteChange(e.target.value)}
          className="h-10 rounded-xl text-xs"
        />
      </Card>
    </div>
  );
}
