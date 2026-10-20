import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { QUICK_BRAND_PALETTES } from "@/features/promotions/data/creation-catalog";
import type { QuickIntent } from "./quick-panel-intent-selector";

export { QUICK_BRAND_PALETTES };

export const QUICK_PROMPT_SUGGESTIONS = [
  "Deixar o fundo mais escuro com iluminação acolhedora",
  "Destacar que a entrega é grátis para o bairro",
  "Adicionar selo 'Oferta Válida Apenas Hoje'",
  "Dar mais destaque para a foto do produto no centro",
] as const;

export interface QuickPanelActiveFieldProps {
  activeIntent: QuickIntent;
  promoPrice: string;
  onPromoPriceChange: (val: string) => void;
  offerTitle: string;
  onOfferTitleChange: (val: string) => void;
  selectedPalette: string | null;
  onSelectPalette: (paletteId: string) => void;
  customPrompt: string;
  onCustomPromptChange: (val: string) => void;
  disabled: boolean;
}

export function QuickPanelActiveField({
  activeIntent,
  promoPrice,
  onPromoPriceChange,
  offerTitle,
  onOfferTitleChange,
  selectedPalette,
  onSelectPalette,
  customPrompt,
  onCustomPromptChange,
  disabled,
}: QuickPanelActiveFieldProps) {
  if (activeIntent === "price") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-quick-price" className="text-xs font-semibold">
          Novo Preço Promocional
        </Label>
        <CurrencyInput
          id="input-quick-price"
          value={promoPrice}
          onChange={(e) => onPromoPriceChange(e.target.value)}
          placeholder="Ex: R$ 34,90"
          className="h-10 bg-background text-sm"
          disabled={disabled}
          autoFocus
        />
        <Typography
          variant="muted"
          className="text-[11px] text-muted-foreground"
        >
          Informe o valor exato ou formato que deseja ver estampado na arte.
        </Typography>
      </div>
    );
  }

  if (activeIntent === "title") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-quick-title" className="text-xs font-semibold">
          Novo Título da Oferta
        </Label>
        <Input
          id="input-quick-title"
          type="text"
          value={offerTitle}
          onChange={(e) => onOfferTitleChange(e.target.value)}
          placeholder="Ex: Super Quarta da Pizza Especial"
          className="h-10 bg-background text-sm"
          disabled={disabled}
          autoFocus
        />
        <Typography
          variant="muted"
          className="text-[11px] text-muted-foreground"
        >
          O título principal que será integrado pela IA com destaque visual.
        </Typography>
      </div>
    );
  }

  if (activeIntent === "style") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <Label className="text-xs font-semibold text-foreground">
            Escolha uma Paleta Visual para a Nova Arte
          </Label>
          <Typography
            variant="muted"
            className="text-[11px] text-muted-foreground"
          >
            Selecione a combinação de cores da sua marca para renovar o design.
          </Typography>
        </div>

        <div className="flex flex-wrap gap-2 pt-0.5">
          {QUICK_BRAND_PALETTES.map((palette) => {
            const isSelected = selectedPalette === palette.name;
            return (
              <Button
                key={palette.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSelectPalette(palette.name)}
                disabled={disabled}
                className={cn(
                  "h-9 rounded-full px-3 text-xs font-semibold gap-2 border transition-all select-none shrink-0",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary font-bold shadow-xs"
                    : "border-border/80 bg-background text-foreground hover:bg-muted/60",
                )}
              >
                <span
                  className="flex items-center -space-x-1 shrink-0"
                  aria-hidden="true"
                >
                  {palette.swatches.map((hex) => (
                    <span
                      key={`${palette.name}-${hex}`}
                      className="size-3.5 rounded-full border border-background shadow-xs shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <span>{palette.label}</span>
                {isSelected && (
                  <Check className="size-3.5 text-primary shrink-0" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Label htmlFor="input-quick-custom" className="text-xs font-semibold">
        Instrução Livre para a IA
      </Label>
      <Textarea
        id="input-quick-custom"
        value={customPrompt}
        onChange={(e) => onCustomPromptChange(e.target.value)}
        placeholder="Ex: Deixe o fundo mais escuro com luzes quentes e destaque que aceitamos encomenda..."
        rows={3}
        className="resize-none bg-background text-xs"
        disabled={disabled}
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <Typography
          variant="muted"
          className="text-[10px] font-semibold text-muted-foreground"
        >
          Sugestões rápidas (clique para aplicar):
        </Typography>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPT_SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="secondary"
              size="sm"
              className="h-6 rounded-md px-2 text-[10px] font-medium"
              onClick={() => onCustomPromptChange(suggestion)}
              disabled={disabled}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
