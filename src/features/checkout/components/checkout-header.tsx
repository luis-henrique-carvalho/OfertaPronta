import { ArrowLeft, Store, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

export interface CheckoutHeaderProps {
  onNavigateBack?: () => void;
}

export function CheckoutHeader({ onNavigateBack }: CheckoutHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onNavigateBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNavigateBack}
            className="size-9 rounded-lg"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="size-3.5" />
          </div>
          <Typography variant="h4" className="text-sm font-bold">
            Oferta<span className="text-primary">Pronta</span>
          </Typography>
        </div>
      </div>

      <Badge
        variant="secondary"
        className="gap-1 px-2.5 py-0.5 text-[11px] font-semibold"
      >
        <ShieldCheck className="size-3 text-emerald-500" />
        Checkout Seguro Pix
      </Badge>
    </div>
  );
}
