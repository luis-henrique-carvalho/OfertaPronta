import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Smartphone, QrCode, Clock, RotateCw } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";
import { PixExpiredAlert } from "./pix-expired-alert";
import { PixCopiaColaTab } from "./pix-copia-cola-tab";
import { PixQrCodeTab } from "./pix-qr-code-tab";
import { PixWhatsappAccordion } from "./pix-whatsapp-accordion";

export interface UnifiedPixPaymentCardProps {
  copiaECola?: string | null;
  qrCodeBase64?: string | null;
  amountCents?: number;
  status: string;
  expiresAt?: string | null;
  isCopied: boolean;
  onCopyPix: (code: string) => void;
  isChecking?: boolean;
  onCheckNow?: () => void;
  onRegenerateCharge?: () => void;
  isRegenerating?: boolean;
  initialWhatsapp?: string | null;
  onSaveWhatsapp: (whatsapp: string) => Promise<unknown> | void;
  isSavingWhatsapp?: boolean;
  defaultTab?: "copia-cola" | "qr-code";
  className?: string;
}

export function UnifiedPixPaymentCard({
  copiaECola,
  qrCodeBase64,
  amountCents,
  status,
  expiresAt,
  isCopied,
  onCopyPix,
  isChecking = false,
  onCheckNow,
  onRegenerateCharge,
  isRegenerating = false,
  initialWhatsapp,
  onSaveWhatsapp,
  isSavingWhatsapp = false,
  defaultTab = "copia-cola",
  className,
}: UnifiedPixPaymentCardProps) {
  const [timeLeftSec, setTimeLeftSec] = useState<number>(() => {
    if (!expiresAt) return 1800;
    const diff = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / 1000,
    );
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000,
      );
      setTimeLeftSec(Math.max(0, diff));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = status === "EXPIRED" || timeLeftSec <= 0;
  const formattedPrice = formatBRL(
    amountCents ?? getDefaultCampaignPlan().amountCents,
  );

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;
  const formattedCountdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const formattedQrCodeSrc = qrCodeBase64
    ? qrCodeBase64.startsWith("data:")
      ? qrCodeBase64
      : `data:image/png;base64,${qrCodeBase64}`
    : null;

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  if (isExpired) {
    return (
      <PixExpiredAlert
        onRegenerateCharge={onRegenerateCharge}
        isRegenerating={isRegenerating}
        className={className}
      />
    );
  }

  return (
    <Card
      className={`w-full border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            {/* shadcn-ignore: live status indicator dot */}
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <Typography
              variant="muted"
              className="text-xs font-bold text-foreground"
            >
              Aguardando pagamento Pix
            </Typography>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Clock className="size-3.5 text-muted-foreground" />
            <Typography
              variant="muted"
              className="font-mono text-xs"
              suppressHydrationWarning
            >
              Expira em {formattedCountdown}
            </Typography>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="copia-cola"
              onClick={() => setActiveTab("copia-cola")}
              className="gap-1.5 py-2 text-xs font-bold"
            >
              <Smartphone className="size-3.5" />
              <span>Pix Copia e Cola</span>
            </TabsTrigger>
            <TabsTrigger
              value="qr-code"
              onClick={() => setActiveTab("qr-code")}
              className="gap-1.5 py-2 text-xs font-bold"
            >
              <QrCode className="size-3.5" />
              <span>QR Code</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="copia-cola">
            <PixCopiaColaTab
              copiaECola={copiaECola}
              isCopied={isCopied}
              onCopy={() => copiaECola && onCopyPix(copiaECola)}
              formattedPrice={formattedPrice}
            />
          </TabsContent>

          <TabsContent value="qr-code">
            <PixQrCodeTab
              formattedQrCodeSrc={formattedQrCodeSrc}
              formattedPrice={formattedPrice}
            />
          </TabsContent>
        </Tabs>

        {onCheckNow && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCheckNow}
            disabled={isChecking}
            className="h-9 w-full rounded-lg border-border text-xs font-semibold text-foreground/80 hover:bg-muted"
          >
            <RotateCw
              className={`size-3.5 ${isChecking ? "animate-spin" : ""}`}
              data-icon="inline-start"
            />
            <span>
              {isChecking ? "Checando status..." : "Já paguei? Verificar agora"}
            </span>
          </Button>
        )}

        <PixWhatsappAccordion
          initialWhatsapp={initialWhatsapp}
          onSaveWhatsapp={onSaveWhatsapp}
          isSavingWhatsapp={isSavingWhatsapp}
        />
      </CardContent>
    </Card>
  );
}
