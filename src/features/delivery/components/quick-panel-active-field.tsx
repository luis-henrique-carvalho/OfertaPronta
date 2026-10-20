import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { Check } from "lucide-react";
import type { QuickIntent } from "./quick-panel-intent-selector";

export const COLOR_PALETTE_PRESETS = [
  {
    id: "dark-premium",
    name: "Preto & Dourado Premium",
    description: "Visual noturno elegante com iluminação sofisticada",
    colors: ["#121212", "#EAB308", "#F59E0B"],
  },
  {
    id: "vibrant-food",
    name: "Vermelho & Amarelo Apetite",
    description: "Cores energéticas que despertam vontade e urgência",
    colors: ["#DC2626", "#F59E0B", "#FEF08A"],
  },
  {
    id: "fresh-natural",
    name: "Verde Orgânico & Frescor",
    description: "Paleta limpa ideal para produtos frescos, hortifruti e saúde",
    colors: ["#16A34A", "#4ADE80", "#F0FDF4"],
  },
  {
    id: "modern-minimal",
    name: "Minimalista Branco & Grafite",
    description: "Estética contemporânea, fundo limpo e tipografia arrojada",
    colors: ["#FFFFFF", "#334155", "#0F172A"],
  },
] as const;

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
        <Input
          id="input-quick-price"
          type="text"
          value={promoPrice}
          onChange={(e) => onPromoPriceChange(e.target.value)}
          placeholder="Ex: R$ 34,90 ou 2 por R$ 50"
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
        <Label className="text-xs font-semibold">
          Escolha uma Paleta Visual para a Nova Arte
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {COLOR_PALETTE_PRESETS.map((palette) => {
            const isSelected = selectedPalette === palette.id;
            return (
              <Button
                key={palette.id}
                type="button"
                variant="outline"
                className={`h-auto justify-between p-2.5 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "bg-background hover:bg-muted/50"
                }`}
                onClick={() => onSelectPalette(palette.id)}
                disabled={disabled}
              >
                <div className="flex flex-col gap-0.5">
                  <Typography
                    variant="muted"
                    className="text-xs font-bold text-foreground"
                  >
                    {palette.name}
                  </Typography>
                  <Typography
                    variant="muted"
                    className="text-[10px] text-muted-foreground"
                  >
                    {palette.description}
                  </Typography>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {palette.colors.map((color) => (
                      <span
                        key={`${palette.id}-${color}`}
                        className="size-3.5 rounded-full border border-background shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {isSelected && <Check className="size-3.5 text-primary" />}
                </div>
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
