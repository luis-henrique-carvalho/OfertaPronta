import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCardRegeneration } from "../hooks/use-card-regeneration";
import type {
  DeliveryDetailsResult,
  RequestRegenerationInput,
} from "../data/delivery.schemas";
import {
  QuickPanelIntentSelector,
  type QuickIntent,
} from "./quick-panel-intent-selector";
import {
  QuickPanelActiveField,
  COLOR_PALETTE_PRESETS,
  QUICK_PROMPT_SUGGESTIONS,
} from "./quick-panel-active-field";
import { QuickPanelExpiredCard } from "./quick-panel-expired-card";
import { QuickPanelHeader } from "./quick-panel-header";

export type { QuickIntent };
export { COLOR_PALETTE_PRESETS, QUICK_PROMPT_SUGGESTIONS };

export interface AiRegenerationQuickPanelProps {
  orderId: string;
  offerTitle: string;
  canRegenerate: boolean;
  regenerationsUsed?: number;
  maxRegenerations: number;
  remainingRegenerations: number;
  regenerationWindowEndsAt: string;
  onRegenerationSuccess: (updated: DeliveryDetailsResult) => void;
  onRegenerationError?: (err: Error) => void;
  regenerationFn?: (args: {
    data: RequestRegenerationInput;
  }) => Promise<DeliveryDetailsResult>;
  onNavigateHome?: () => void;
  className?: string;
}

interface RegenerationPayloadParams {
  activeIntent: QuickIntent;
  initialOfferTitle: string;
  promoPrice: string;
  offerTitle: string;
  selectedPalette: string | null;
  customPrompt: string;
}

interface RegenerationPayloadResult {
  error?: string;
  payload?: {
    offerTitle: string;
    promoPrice?: string;
    colorPalette?: string;
    customAdjustmentPrompt?: string;
  };
}

function buildRegenerationPayload({
  activeIntent,
  initialOfferTitle,
  promoPrice,
  offerTitle,
  selectedPalette,
  customPrompt,
}: RegenerationPayloadParams): RegenerationPayloadResult {
  if (activeIntent === "price") {
    if (!promoPrice.trim()) {
      return { error: "Informe o novo preço promocional da oferta." };
    }
    return {
      payload: {
        offerTitle: initialOfferTitle,
        promoPrice: promoPrice.trim(),
      },
    };
  }

  if (activeIntent === "title") {
    if (!offerTitle.trim() || offerTitle.trim().length < 2) {
      return {
        error: "Informe o título da promoção com pelo menos 2 caracteres.",
      };
    }
    return {
      payload: {
        offerTitle: offerTitle.trim(),
      },
    };
  }

  if (activeIntent === "style") {
    if (!selectedPalette) {
      return {
        error: "Selecione uma combinação de cores/estilo para aplicar.",
      };
    }
    const paletteObj = COLOR_PALETTE_PRESETS.find(
      (p) => p.id === selectedPalette,
    );
    return {
      payload: {
        offerTitle: initialOfferTitle,
        colorPalette: paletteObj ? paletteObj.name : selectedPalette,
      },
    };
  }

  if (activeIntent === "custom") {
    if (!customPrompt.trim()) {
      return {
        error: "Descreva a alteração que deseja para a IA realizar.",
      };
    }
    return {
      payload: {
        offerTitle: initialOfferTitle,
        customAdjustmentPrompt: customPrompt.trim(),
      },
    };
  }

  return {};
}

export function AiRegenerationQuickPanel({
  orderId,
  offerTitle: initialOfferTitle,
  canRegenerate,
  regenerationsUsed: _regenerationsUsed,
  maxRegenerations = 3,
  remainingRegenerations,
  regenerationWindowEndsAt,
  onRegenerationSuccess,
  onRegenerationError,
  regenerationFn,
  onNavigateHome,
  className,
}: AiRegenerationQuickPanelProps) {
  const [isWindowExpired, setIsWindowExpired] = useState(() => {
    return new Date(regenerationWindowEndsAt).getTime() <= Date.now();
  });

  const [activeIntent, setActiveIntent] = useState<QuickIntent>("price");
  const [promoPrice, setPromoPrice] = useState("");
  const [offerTitle, setOfferTitle] = useState(initialOfferTitle);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
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

    const { error, payload } = buildRegenerationPayload({
      activeIntent,
      initialOfferTitle,
      promoPrice,
      offerTitle,
      selectedPalette,
      customPrompt,
    });

    if (error) {
      setFormError(error);
      return;
    }

    if (payload) {
      try {
        await regenerate(payload);
      } catch {
        // Erro gerenciado por onError
      }
    }
  };

  if (!isEligible) {
    return (
      <QuickPanelExpiredCard
        remainingRegenerations={remainingRegenerations}
        maxRegenerations={maxRegenerations}
        onNavigateHome={onNavigateHome}
        className={className}
      />
    );
  }

  return (
    <Card
      className={`w-full border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <QuickPanelHeader
        remainingRegenerations={remainingRegenerations}
        maxRegenerations={maxRegenerations}
        regenerationWindowEndsAt={regenerationWindowEndsAt}
        onExpire={() => setIsWindowExpired(true)}
      />

      <CardContent className="flex flex-col gap-3.5 p-4 pt-1 sm:p-5 sm:pt-2">
        <QuickPanelIntentSelector
          activeIntent={activeIntent}
          onSelect={(intent) => {
            setActiveIntent(intent);
            setFormError(null);
          }}
        />

        {successNotice && (
          <Alert className="border-emerald-500/30 bg-emerald-500/10 py-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertDescription className="text-xs font-semibold">
              {successNotice}
            </AlertDescription>
          </Alert>
        )}

        {(formError || mutationError) && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs font-medium">
              {formError ||
                (mutationError instanceof Error
                  ? mutationError.message
                  : "Erro ao processar ajuste de IA")}
            </AlertDescription>
          </Alert>
        )}

        {/* shadcn-ignore: layout do container contextual de micro-input */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
          <QuickPanelActiveField
            activeIntent={activeIntent}
            promoPrice={promoPrice}
            onPromoPriceChange={setPromoPrice}
            offerTitle={offerTitle}
            onOfferTitleChange={setOfferTitle}
            selectedPalette={selectedPalette}
            onSelectPalette={setSelectedPalette}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
            disabled={isRegenerating}
          />
        </div>

        <Button
          type="button"
          size="lg"
          className="h-11 w-full gap-2 font-bold shadow-sm"
          onClick={handleSubmit}
          disabled={isRegenerating}
          aria-label="Gerar Ajuste com IA"
        >
          {isRegenerating ? (
            <Spinner className="size-4" data-icon="inline-start" />
          ) : (
            <Sparkles className="size-4" data-icon="inline-start" />
          )}
          <span>
            {isRegenerating
              ? "Gerando Nova Arte com IA..."
              : "Gerar Ajuste com IA"}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
