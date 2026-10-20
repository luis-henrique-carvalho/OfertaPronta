import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Copy, Check } from "lucide-react";

export interface PixCopiaColaTabProps {
  copiaECola?: string | null;
  isCopied: boolean;
  onCopy: () => void;
  formattedPrice: string;
}

export function PixCopiaColaTab({
  copiaECola,
  isCopied,
  onCopy,
  formattedPrice,
}: PixCopiaColaTabProps) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {/* shadcn-ignore: layout container do código copia e cola */}
      <div className="rounded-xl border border-border bg-muted/50 p-3">
        <Typography
          variant="muted"
          className="line-clamp-2 break-all font-mono text-xs leading-relaxed text-foreground/80 select-all"
        >
          {copiaECola || "Carregando código Pix..."}
        </Typography>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={onCopy}
        disabled={!copiaECola}
        className="h-12 w-full rounded-xl bg-primary text-sm font-bold shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        {isCopied ? (
          <>
            <Check className="size-4" data-icon="inline-start" />
            <span>Código Pix Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="size-4" data-icon="inline-start" />
            <span>Copiar Código Pix</span>
          </>
        )}
      </Button>

      {/* shadcn-ignore: layout das micro-instruções */}
      <div className="rounded-xl bg-muted/30 p-3">
        <Typography
          variant="muted"
          className="pb-1 text-[11px] font-semibold text-foreground/90"
        >
          Como pagar no seu banco:
        </Typography>
        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          <Typography variant="muted" className="text-[11px]">
            1. Copie o código Pix acima com 1 toque.
          </Typography>
          <Typography variant="muted" className="text-[11px]">
            2. Abra o app do seu banco e acesse a área{" "}
            <strong>Pix Copia e Cola</strong>.
          </Typography>
          <Typography variant="muted" className="text-[11px]">
            3. Cole o código, confirme o valor de{" "}
            <strong>{formattedPrice}</strong> e conclua o pagamento.
          </Typography>
        </div>
      </div>
    </div>
  );
}
