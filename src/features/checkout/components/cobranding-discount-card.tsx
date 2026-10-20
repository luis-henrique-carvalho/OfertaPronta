import { useId } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Label } from "@/components/ui/label";
import { Tag, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { cn, formatBRL } from "@/lib/utils";
import { calculateCobrandingPrice } from "@/lib/campaign-catalog";

export interface CobrandingDiscountCardProps {
  orderId?: string;
  isAccepted: boolean;
  discountPercent?: number;
  originalAmountCents?: number;
  discountedAmountCents?: number;
  creditText?: string;
  isUpdating?: boolean;
  disabled?: boolean;
  onToggle: (accepted: boolean) => void;
  className?: string;
}

export function CobrandingDiscountCard({
  isAccepted,
  discountPercent = 30,
  originalAmountCents = 990,
  discountedAmountCents,
  creditText = "Design por @ofertapronta",
  isUpdating = false,
  disabled = false,
  onToggle,
  className,
}: CobrandingDiscountCardProps) {
  const switchId = useId();

  const calc = calculateCobrandingPrice(originalAmountCents, discountPercent);
  const resolvedDiscountedPrice =
    discountedAmountCents != null
      ? formatBRL(discountedAmountCents)
      : calc.formattedDiscountedPrice;
  const resolvedSavings = calc.formattedSavings;
  const resolvedOriginalPrice = calc.formattedOriginalPrice;

  const isInteractiveDisabled = disabled || isUpdating;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border transition-all duration-200",
        isAccepted
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border bg-card",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        {/* Top Header: Badges & Switch */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="default"
              className="gap-1 bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:text-emerald-950"
            >
              <Tag className="size-3" />
              Economize {resolvedSavings}
            </Badge>

            <Badge
              variant="secondary"
              className="px-2 py-0.5 text-[11px] font-semibold"
            >
              {calc.discountPercent}% OFF
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {isUpdating && (
              <Loader2
                data-testid="cobranding-spinner"
                className="size-4 animate-spin text-primary"
                aria-label="Atualizando desconto..."
              />
            )}
            <Switch
              id={switchId}
              checked={isAccepted}
              onCheckedChange={(checked) => {
                if (!isInteractiveDisabled) {
                  onToggle(checked);
                }
              }}
              disabled={isInteractiveDisabled}
              aria-label="Ativar assinatura de marca no rodapé"
              aria-busy={isUpdating}
            />
          </div>
        </div>

        {/* Título & Preços */}
        <div className="flex flex-col gap-1">
          <Label
            htmlFor={switchId}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            Ativar assinatura de marca no rodapé
          </Label>

          <div className="flex items-baseline gap-2 pt-0.5">
            <Typography
              variant="h3"
              className="text-xl font-black tracking-tight text-foreground"
            >
              {resolvedDiscountedPrice}
            </Typography>

            <Typography
              variant="muted"
              className="text-xs text-muted-foreground line-through"
            >
              {resolvedOriginalPrice}
            </Typography>

            <Typography
              variant="muted"
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
            >
              (economize {resolvedSavings})
            </Typography>
          </div>
        </div>

        {/* Texto explicativo transparente */}
        <Typography
          variant="muted"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          Adicione uma assinatura discreta e elegante (&quot;{creditText}&quot;)
          no rodapé do seu card e pague apenas {resolvedDiscountedPrice}.
        </Typography>

        {/* Benefício / Garantia de elegância */}
        {/* shadcn-ignore: layout de garantia sutil */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5">
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <Typography
            variant="muted"
            className="text-[11px] text-muted-foreground"
          >
            Assinatura translúcida e minimalista em safe zone. Não interfere na
            sua oferta.
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}
