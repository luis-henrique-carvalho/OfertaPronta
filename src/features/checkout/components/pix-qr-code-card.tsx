import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { QrCode, ChevronDown, ChevronUp } from "lucide-react";

export interface PixQrCodeCardProps {
  qrCodeBase64?: string | null;
  defaultOpen?: boolean;
}

export function PixQrCodeCard({
  qrCodeBase64,
  defaultOpen = false,
}: PixQrCodeCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const formattedQrCodeSrc = qrCodeBase64
    ? qrCodeBase64.startsWith("data:")
      ? qrCodeBase64
      : `data:image/png;base64,${qrCodeBase64}`
    : null;

  return (
    <Card className="w-full border-border bg-card shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="size-4 text-primary" />
              <CardTitle className="text-base font-bold">
                Pagar com QR Code
              </CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs font-semibold text-muted-foreground"
              >
                <span>{isOpen ? "Ocultar" : "Mostrar QR Code"}</span>
                {isOpen ? (
                  <ChevronUp className="size-4" data-icon="inline-end" />
                ) : (
                  <ChevronDown className="size-4" data-icon="inline-end" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CardDescription className="text-xs">
            Ideal para escanear com outro celular ou caso esteja no computador.
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="flex flex-col items-center gap-3 pt-0 pb-4">
            {formattedQrCodeSrc ? (
              // shadcn-ignore: layout
              <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-4 shadow-sm">
                {/* shadcn-ignore: QR code image tag */}
                <img
                  src={formattedQrCodeSrc}
                  alt="QR Code Pix Dinâmico para Pagamento de R$ 9,90"
                  className="size-48 max-w-full object-contain"
                />
              </div>
            ) : (
              // shadcn-ignore: layout
              <div className="flex size-48 items-center justify-center rounded-2xl border border-border bg-muted/50 p-4 text-center">
                <Typography variant="muted" className="text-xs">
                  QR Code indisponível
                </Typography>
              </div>
            )}

            <Typography
              variant="muted"
              className="text-center text-xs text-muted-foreground"
            >
              Abra o app do seu banco, escolha{" "}
              <strong>Pagar com QR Code</strong> e aponte a câmera.
            </Typography>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
