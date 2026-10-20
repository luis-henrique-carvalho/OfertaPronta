import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles } from "lucide-react";

export interface RegenerationActiveFormProps {
  title: string;
  setTitle: (val: string) => void;
  promoPrice: string;
  setPromoPrice: (val: string) => void;
  originalPrice: string;
  setOriginalPrice: (val: string) => void;
  callToAction: string;
  setCallToAction: (val: string) => void;
  customPrompt: string;
  setCustomPrompt: (val: string) => void;
  isRegenerating: boolean;
  onSubmit: () => void;
}

export function RegenerationActiveForm({
  title,
  setTitle,
  promoPrice,
  setPromoPrice,
  originalPrice,
  setOriginalPrice,
  callToAction,
  setCallToAction,
  customPrompt,
  setCustomPrompt,
  isRegenerating,
  onSubmit,
}: RegenerationActiveFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="regen-title" className="text-xs font-semibold">
            Título da Promoção
          </FieldLabel>
          <Input
            id="regen-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Terça da Pizza"
            disabled={isRegenerating}
            className="h-10 text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field>
            <FieldLabel
              htmlFor="regen-promo-price"
              className="text-xs font-semibold"
            >
              Preço Promocional (Opcional)
            </FieldLabel>
            <CurrencyInput
              id="regen-promo-price"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              placeholder="Ex: R$ 39,90"
              disabled={isRegenerating}
              className="h-10 text-sm"
            />
          </Field>

          <Field>
            <FieldLabel
              htmlFor="regen-original-price"
              className="text-xs font-semibold"
            >
              Preço Original (De... Opcional)
            </FieldLabel>
            <CurrencyInput
              id="regen-original-price"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="Ex: R$ 59,90"
              disabled={isRegenerating}
              className="h-10 text-sm"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="regen-cta" className="text-xs font-semibold">
            Chamada para Ação (Opcional)
          </FieldLabel>
          <Input
            id="regen-cta"
            value={callToAction}
            onChange={(e) => setCallToAction(e.target.value)}
            placeholder="Ex: Peça pelo WhatsApp"
            disabled={isRegenerating}
            className="h-10 text-sm"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="regen-prompt" className="text-xs font-semibold">
            Instrução Adicional para a IA (Opcional)
          </FieldLabel>
          <Textarea
            id="regen-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ex: Destaque mais o valor da promoção com cores quentes e deixe o cenário mais vibrante."
            rows={2}
            maxLength={500}
            disabled={isRegenerating}
            className="resize-none text-sm"
          />
        </Field>
      </FieldGroup>

      <Button
        type="button"
        size="lg"
        className="h-12 w-full font-bold shadow-sm"
        onClick={onSubmit}
        disabled={isRegenerating || !title.trim()}
        aria-label="Aplicar Ajuste com IA"
      >
        {isRegenerating ? (
          <>
            <Spinner className="size-4" data-icon="inline-start" />
            <span>A IA está refinando seu card...</span>
          </>
        ) : (
          <>
            <Sparkles className="size-4" data-icon="inline-start" />
            <span>Aplicar Ajuste com IA</span>
          </>
        )}
      </Button>

      {isRegenerating && (
        <div className="flex items-center justify-center gap-1.5 text-center">
          <Typography
            variant="muted"
            className="text-xs text-muted-foreground animate-pulse"
          >
            Aguarde alguns segundos enquanto o Gemini gera a nova versão da sua
            arte...
          </Typography>
        </div>
      )}
    </div>
  );
}
