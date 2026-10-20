import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardIntent } from "../../data/offer-brief.schema";
import {
  CREATION_CARD_INTENTS,
  type CreationCatalogItem,
} from "../../data/creation-catalog";

function renderIntentButtons(
  intent: CardIntent,
  onSelectIntent: (newIntent: CardIntent) => void,
) {
  return (
    <div className="grid grid-cols-2 gap-2 pt-1">
      {CREATION_CARD_INTENTS.map((intentItem) => {
        const Icon = intentItem.icon;
        const isSelected = intent === intentItem.id;

        return (
          <Button
            key={intentItem.id}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            data-testid={`intent-option-${intentItem.id}`}
            aria-pressed={isSelected}
            onClick={() => onSelectIntent(intentItem.id)}
            className={cn(
              "h-auto min-h-[44px] py-2.5 px-3 flex items-center justify-start gap-2 rounded-xl border text-xs font-semibold transition-all min-w-0 select-none",
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                : "border-border bg-card text-foreground hover:bg-muted/50",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{intentItem.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

function renderCustomIntentInput(
  customIntentText: string,
  errorMessage: string | undefined,
  onChange: (val: string) => void,
) {
  return (
    <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <Label
        htmlFor="custom-intent-input"
        className="text-xs font-bold text-primary"
      >
        Qual tipo de card você quer criar?
      </Label>
      <Input
        id="custom-intent-input"
        data-testid="input-custom-intent"
        placeholder="Ex: Vaga de emprego, Sorteio, Frase do dia, Cardápio..."
        value={customIntentText}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl bg-background text-sm"
      />
      {errorMessage && (
        <Typography variant="muted" className="text-xs text-destructive">
          {errorMessage}
        </Typography>
      )}
    </div>
  );
}

function renderPriceField(params: {
  intent: CardIntent;
  promoPrice: string;
  placeholderPrice: string;
  errorMessage?: string;
  showCustomPrice: boolean;
  onPromoPriceChange: (val: string) => void;
  onToggleCustomPrice: (show: boolean) => void;
}) {
  const {
    intent,
    promoPrice,
    placeholderPrice,
    errorMessage,
    showCustomPrice,
    onPromoPriceChange,
    onToggleCustomPrice,
  } = params;

  const currentIntentConfig =
    CREATION_CARD_INTENTS.find((i) => i.id === intent) ||
    CREATION_CARD_INTENTS[0];

  const shouldShowPriceField =
    currentIntentConfig.hasPriceByDefault ||
    (intent === "custom" && showCustomPrice);

  if (!shouldShowPriceField) {
    if (intent === "custom" && !showCustomPrice) {
      return (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="btn-add-custom-price"
          onClick={() => onToggleCustomPrice(true)}
          className="self-start h-9 min-h-[44px] px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg"
        >
          <Plus className="size-3.5 mr-1" />+ Adicionar preço neste card
        </Button>
      );
    }
    return null;
  }

  return (
    <div className="space-y-1.5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Label
          htmlFor="promo-price-input"
          className="text-xs font-bold text-foreground"
        >
          Preço da Promoção
        </Label>
        {intent === "custom" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onToggleCustomPrice(false);
              onPromoPriceChange("");
            }}
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
          >
            <X className="size-3 mr-0.5" />
            Remover preço
          </Button>
        )}
      </div>
      <Input
        id="promo-price-input"
        data-testid="input-promo-price"
        placeholder={placeholderPrice}
        value={promoPrice}
        onChange={(e) => onPromoPriceChange(e.target.value)}
        className="h-11 rounded-xl text-sm font-semibold"
      />
      {errorMessage && (
        <Typography variant="muted" className="text-xs text-destructive">
          {errorMessage}
        </Typography>
      )}
    </div>
  );
}

export interface Step2OfferDetailsProps {
  segmentData: CreationCatalogItem;
  intent: CardIntent;
  customIntentText?: string;
  businessName: string;
  offerTitle: string;
  promoPrice?: string;
  validationErrors?: Record<string, string>;
  onIntentChange: (intent: CardIntent) => void;
  onCustomIntentTextChange: (val: string) => void;
  onBusinessNameChange: (val: string) => void;
  onOfferTitleChange: (val: string) => void;
  onPromoPriceChange: (val: string) => void;
  className?: string;
}

export function Step2OfferDetails({
  segmentData,
  intent,
  customIntentText = "",
  businessName,
  offerTitle,
  promoPrice = "",
  validationErrors = {},
  onIntentChange,
  onCustomIntentTextChange,
  onBusinessNameChange,
  onOfferTitleChange,
  onPromoPriceChange,
  className,
}: Step2OfferDetailsProps) {
  const [showCustomPrice, setShowCustomPrice] = React.useState<boolean>(() =>
    Boolean(promoPrice && promoPrice.trim().length > 0),
  );

  const currentIntentConfig =
    CREATION_CARD_INTENTS.find((i) => i.id === intent) ||
    CREATION_CARD_INTENTS[0];

  const handleSelectIntent = (newIntent: CardIntent) => {
    onIntentChange(newIntent);
    const config = CREATION_CARD_INTENTS.find((i) => i.id === newIntent);
    if (!config?.hasPriceByDefault && newIntent !== "custom") {
      onPromoPriceChange("");
      setShowCustomPrice(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
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

      {renderIntentButtons(intent, handleSelectIntent)}

      {intent === "custom" &&
        renderCustomIntentInput(
          customIntentText,
          validationErrors.customIntentText,
          onCustomIntentTextChange,
        )}

      <div className="flex flex-col gap-3 pt-1">
        <div className="space-y-1.5">
          <Label
            htmlFor="business-name-input"
            className="text-xs font-bold text-foreground"
          >
            Nome da sua Loja
          </Label>
          <Input
            id="business-name-input"
            data-testid="input-business-name"
            placeholder={
              segmentData.placeholders?.businessName ||
              segmentData.defaultPlaceholders?.businessName ||
              "Nome da Loja"
            }
            value={businessName}
            onChange={(e) => onBusinessNameChange(e.target.value)}
            className="h-11 rounded-xl text-sm"
          />
          {validationErrors.businessName && (
            <Typography variant="muted" className="text-xs text-destructive">
              {validationErrors.businessName}
            </Typography>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="offer-title-input"
            className="text-xs font-bold text-foreground"
          >
            {intent === "promo"
              ? "Qual é o produto ou oferta?"
              : "Qual a mensagem principal do card?"}
          </Label>
          <Input
            id="offer-title-input"
            data-testid="input-offer-title"
            placeholder={currentIntentConfig.offerPlaceholder}
            value={offerTitle}
            onChange={(e) => onOfferTitleChange(e.target.value)}
            className="h-11 rounded-xl text-sm"
          />
          {validationErrors.offerTitle && (
            <Typography variant="muted" className="text-xs text-destructive">
              {validationErrors.offerTitle}
            </Typography>
          )}
        </div>

        {renderPriceField({
          intent,
          promoPrice,
          placeholderPrice:
            segmentData.placeholders?.promoPrice ||
            segmentData.defaultPlaceholders?.promoPrice ||
            "R$ 0,00",
          errorMessage: validationErrors.promoPrice,
          showCustomPrice,
          onPromoPriceChange,
          onToggleCustomPrice: setShowCustomPrice,
        })}
      </div>
    </div>
  );
}
