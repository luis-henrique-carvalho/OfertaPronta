import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Plus, X } from "lucide-react";
import {
  PROTOTYPE_CARD_INTENTS,
  type PrototypeCatalogItem,
  type CardIntent,
} from "../prototype-catalog-data";

interface Step2OfferProps {
  currentSegmentData: PrototypeCatalogItem;
  intent: CardIntent;
  customIntentText: string;
  businessName: string;
  title: string;
  price: string;
  onIntentChange: (intent: CardIntent) => void;
  onCustomIntentTextChange: (val: string) => void;
  onBusinessNameChange: (val: string) => void;
  onTitleChange: (val: string) => void;
  onPriceChange: (val: string) => void;
}

export function VariantAStep2Offer({
  currentSegmentData,
  intent,
  customIntentText,
  businessName,
  title,
  price,
  onIntentChange,
  onCustomIntentTextChange,
  onBusinessNameChange,
  onTitleChange,
  onPriceChange,
}: Step2OfferProps) {
  const [showCustomPrice, setShowCustomPrice] = useState(false);

  const currentIntentConfig = PROTOTYPE_CARD_INTENTS.find(
    (i) => i.id === intent,
  )!;

  const shouldShowPriceField =
    currentIntentConfig.hasPriceByDefault ||
    (intent === "custom" && showCustomPrice);

  const handleSelectIntent = (newIntent: CardIntent) => {
    onIntentChange(newIntent);
    const config = PROTOTYPE_CARD_INTENTS.find((i) => i.id === newIntent);
    if (!config?.hasPriceByDefault && newIntent !== "custom") {
      onPriceChange("");
      setShowCustomPrice(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <Typography
          variant="h3"
          className="text-xl font-bold tracking-tight sm:text-2xl"
        >
          O que você quer postar?
        </Typography>
        <Typography variant="muted" className="text-xs sm:text-sm">
          Escolha o objetivo e preencha os dados principais.
        </Typography>
      </div>

      {/* Grade com os 6 Objetivos (incluindo "Outro / Digitar") */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {PROTOTYPE_CARD_INTENTS.map((intentItem) => {
          const Icon = intentItem.icon;
          const isSelected = intent === intentItem.id;
          return (
            <Button
              key={intentItem.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelectIntent(intentItem.id)}
              className={`h-auto py-2.5 px-3 flex items-center justify-start gap-2 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{intentItem.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Campo Dinâmico quando o usuário escolhe "Outro (Digitar)" */}
      {intent === "custom" && (
        <div className="space-y-1 rounded-xl border border-primary/30 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="text-xs font-bold text-primary">
            Qual tipo de card você quer criar?
          </label>
          <Input
            placeholder="Ex: Vaga de emprego, Sorteio, Frase do dia, Cardápio..."
            value={customIntentText}
            onChange={(e) => onCustomIntentTextChange(e.target.value)}
            className="h-10 rounded-xl bg-background text-sm"
          />
        </div>
      )}

      {/* Campos Principais (Direto ao Ponto) */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-xs font-bold text-foreground">
            Nome da sua Loja
          </label>
          <Input
            placeholder={currentSegmentData.defaultPlaceholders.businessName}
            value={businessName}
            onChange={(e) => onBusinessNameChange(e.target.value)}
            className="h-11 rounded-xl text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-foreground">
            {intent === "promo"
              ? "Qual é o produto ou oferta?"
              : "Qual a mensagem principal do card?"}
          </label>
          <Input
            placeholder={currentIntentConfig.offerPlaceholder}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="h-11 rounded-xl text-sm"
          />
        </div>

        {/* Preço só aparece quando o objetivo é Promoção (ou se ativado manualmente em "Outro") */}
        {shouldShowPriceField && (
          <div className="space-y-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Preço da Promoção
              </label>
              {intent === "custom" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCustomPrice(false);
                    onPriceChange("");
                  }}
                  className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3 mr-0.5" />
                  Remover preço
                </Button>
              )}
            </div>
            <Input
              placeholder={currentSegmentData.defaultPlaceholders.promoPrice}
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className="h-11 rounded-xl text-sm font-semibold"
            />
          </div>
        )}

        {/* Se escolheu "Outro (Digitar)" e quiser colocar preço opcionalmente */}
        {intent === "custom" && !showCustomPrice && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomPrice(true)}
            className="self-start h-8 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg"
          >
            <Plus className="size-3.5 mr-1" />
            Adicionar preço neste card
          </Button>
        )}
      </div>
    </div>
  );
}
