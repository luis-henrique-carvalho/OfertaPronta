import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Copy, Check, Smartphone } from "lucide-react";

export interface PixCopiaEColaCardProps {
  copiaECola: string;
  isCopied: boolean;
  onCopy: (code: string) => void;
}

export function PixCopiaEColaCard({
  copiaECola,
  isCopied,
  onCopy,
}: PixCopiaEColaCardProps) {
  const handleCopy = () => {
    onCopy(copiaECola);
  };

  return (
    <Card className="w-full border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <Smartphone className="size-4" />
          <Typography
            variant="muted"
            className="text-xs font-bold text-primary"
          >
            Forma Recomendada no Celular
          </Typography>
        </div>
        <CardTitle className="text-xl font-bold tracking-tight pt-1">
          Pix Copia e Cola
        </CardTitle>
        <CardDescription className="text-xs">
          Copie o código abaixo e cole na opção &ldquo;Pix Copia e Cola&rdquo;
          do aplicativo do seu banco.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Container protegido com código EMV */}
        {/* shadcn-ignore: layout */}
        <div className="rounded-xl border border-border bg-muted/50 p-3">
          <Typography
            variant="muted"
            className="font-mono text-xs text-foreground/80 break-all select-all leading-relaxed line-clamp-3"
          >
            {copiaECola || "Carregando código Pix..."}
          </Typography>
        </div>

        {/* Botão de Cópia Proeminente */}
        <Button
          type="button"
          size="lg"
          onClick={handleCopy}
          disabled={!copiaECola}
          className="h-12 w-full rounded-xl bg-primary text-sm font-bold shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
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

        {/* Instruções passo a passo */}
        <div className="rounded-xl bg-muted/30 p-3">
          <Typography
            variant="muted"
            className="text-[11px] font-semibold text-foreground/90 pb-1"
          >
            Como pagar no seu banco:
          </Typography>
          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            <Typography variant="muted" className="text-[11px]">
              1. Abra o app do seu banco ou instituição financeira.
            </Typography>
            <Typography variant="muted" className="text-[11px]">
              2. Escolha a área <strong>Pix</strong> e selecione{" "}
              <strong>Pix Copia e Cola</strong>.
            </Typography>
            <Typography variant="muted" className="text-[11px]">
              3. Cole o código copiado e confirme o valor de{" "}
              <strong>R$ 9,90</strong>.
            </Typography>
            <Typography variant="muted" className="text-[11px]">
              4. A liberação do card ocorre automaticamente em segundos nesta
              tela.
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
