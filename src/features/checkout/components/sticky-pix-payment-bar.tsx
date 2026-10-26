import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Copy, Check, QrCode } from "lucide-react";
import { formatBRL } from "@/lib/utils";

export interface StickyPixPaymentBarProps {
  amountCents?: number;
  copiaECola?: string | null;
  isCopied: boolean;
  onCopyPix: (code: string) => void;
  onScrollToPayment?: () => void;
}

export function StickyPixPaymentBar({
  amountCents,
  copiaECola,
  isCopied,
  onCopyPix,
  onScrollToPayment,
}: StickyPixPaymentBarProps) {
  const currentPriceFormatted = formatBRL(amountCents ?? 990);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-border bg-background/95 px-4 py-2.5 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.12)] lg:hidden">
      <div className="flex flex-col">
        <Typography
          variant="h4"
          className="text-base font-black tracking-tight text-foreground"
        >
          {currentPriceFormatted}
        </Typography>
        <Typography
          variant="muted"
          className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
        >
          Pix • Liberação instantânea
        </Typography>
      </div>

      <div className="flex items-center gap-2">
        {copiaECola && (
          <Button
            type="button"
            onClick={() => onCopyPix(copiaECola)}
            className="h-9 gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-sm active:scale-95 transition-all"
          >
            {isCopied ? (
              <>
                <Check className="size-3.5" data-icon="inline-start" />
                <span>Código Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" data-icon="inline-start" />
                <span>Copiar Código Pix</span>
              </>
            )}
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            if (onScrollToPayment) {
              onScrollToPayment();
            } else {
              const el = document.getElementById("pix-payment-section");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              }
            }
          }}
          className="size-9 rounded-xl border-border"
          aria-label="Ver QR Code do Pix"
        >
          <QrCode className="size-4 text-foreground" />
        </Button>
      </div>
    </div>
  );
}
