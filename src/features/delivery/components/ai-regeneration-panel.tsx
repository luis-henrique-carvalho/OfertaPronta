import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Sparkles, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { RegenerationCountdownTimer } from "./regeneration-countdown-timer";
import { RegenerationDisabledNotice } from "./regeneration-disabled-notice";
import { RegenerationActiveForm } from "./regeneration-active-form";
import { useCardRegeneration } from "../hooks/use-card-regeneration";
import type {
  DeliveryDetailsResult,
  RequestRegenerationInput,
} from "../data/delivery.schemas";

export interface AiRegenerationPanelProps {
  orderId: string;
  offerTitle: string;
  canRegenerate: boolean;
  regenerationsUsed: number;
  maxRegenerations: number;
  remainingRegenerations: number;
  regenerationWindowEndsAt: string;
  onRegenerationSuccess: (updated: DeliveryDetailsResult) => void;
  onRegenerationError?: (err: Error) => void;
  regenerationFn?: (args: {
    data: RequestRegenerationInput;
  }) => Promise<DeliveryDetailsResult>;
  className?: string;
}

export function AiRegenerationPanel({
  orderId,
  offerTitle: initialOfferTitle,
  canRegenerate,
  maxRegenerations = 3,
  remainingRegenerations,
  regenerationWindowEndsAt,
  onRegenerationSuccess,
  onRegenerationError,
  regenerationFn,
  className,
}: AiRegenerationPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isWindowExpired, setIsWindowExpired] = useState(() => {
    return new Date(regenerationWindowEndsAt).getTime() <= Date.now();
  });

  // Campos do formulário
  const [title, setTitle] = useState(initialOfferTitle);
  const [promoPrice, setPromoPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const isEligible =
    canRegenerate && remainingRegenerations > 0 && !isWindowExpired;

  const {
    regenerate,
    isRegenerating,
    error: mutationError,
  } = useCardRegeneration({
    orderId,
    regenerationFn,
    onSuccess: (updated) => {
      setSuccessNotice("Seu card foi refinado com sucesso pela IA!");
      setFormError(null);
      onRegenerationSuccess(updated);
    },
    onError: (err) => {
      const msg =
        err instanceof Error
          ? err.message
          : "Não foi possível concluir o ajuste. Sua cota de ajustes NÃO foi debitada. Tente novamente.";
      setFormError(msg);
      setSuccessNotice(null);
      onRegenerationError?.(err);
    },
  });

  const handleSubmit = async () => {
    setFormError(null);
    setSuccessNotice(null);

    if (!title || title.trim().length < 2) {
      setFormError("Informe o título da promoção com pelo menos 2 caracteres.");
      return;
    }

    try {
      await regenerate({
        offerTitle: title.trim(),
        promoPrice: promoPrice.trim() || undefined,
        originalPrice: originalPrice.trim() || undefined,
        callToAction: callToAction.trim() || undefined,
        customAdjustmentPrompt: customPrompt.trim() || undefined,
      });
    } catch {
      // O onError da mutation já captura e preenche o estado
    }
  };

  return (
    <Card
      className={`w-full border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <CardTitle className="text-base font-bold sm:text-lg">
                  Refinar com Inteligência Artificial
                </CardTitle>
              </div>

              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  aria-label={
                    isOpen ? "Recolher painel de IA" : "Expandir painel de IA"
                  }
                >
                  <ChevronDown
                    className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Badge
                variant={
                  remainingRegenerations > 0 && !isWindowExpired
                    ? "secondary"
                    : "outline"
                }
                className="gap-1.5 px-2.5 py-0.5 text-xs font-semibold"
              >
                <Sparkles className="size-3 text-primary" />
                <span>
                  Ajustes restantes: {remainingRegenerations} de{" "}
                  {maxRegenerations}
                </span>
              </Badge>

              <RegenerationCountdownTimer
                windowEndsAt={regenerationWindowEndsAt}
                onExpire={() => setIsWindowExpired(true)}
              />
            </div>

            <CardDescription className="text-xs text-muted-foreground pt-1">
              Altere textos, preços ou envie instruções adicionais para a IA
              gerar uma nova versão mantendo a foto do seu produto.
            </CardDescription>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4 p-4 pt-0 sm:p-5 sm:pt-0">
            {/* Mensagem de sucesso */}
            {successNotice && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <AlertDescription className="text-xs font-semibold">
                  {successNotice}
                </AlertDescription>
              </Alert>
            )}

            {/* Mensagem de erro de mutação / validação */}
            {(formError || mutationError) && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs">
                  {formError ||
                    (mutationError instanceof Error
                      ? mutationError.message
                      : "Erro ao processar ajuste de IA")}
                </AlertDescription>
              </Alert>
            )}

            {/* Estado quando a cota esgota ou janela expira */}
            {!isEligible ? (
              <RegenerationDisabledNotice
                remainingRegenerations={remainingRegenerations}
                maxRegenerations={maxRegenerations}
              />
            ) : (
              <RegenerationActiveForm
                title={title}
                setTitle={setTitle}
                promoPrice={promoPrice}
                setPromoPrice={setPromoPrice}
                originalPrice={originalPrice}
                setOriginalPrice={setOriginalPrice}
                callToAction={callToAction}
                setCallToAction={setCallToAction}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                isRegenerating={isRegenerating}
                onSubmit={handleSubmit}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
