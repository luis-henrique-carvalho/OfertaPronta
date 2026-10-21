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
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, Copy, ExternalLink } from "lucide-react";
import { toAbsoluteOrderUrl } from "../lib/delivery-urls";

export interface OrderWhatsappShareCardProps {
  orderId: string;
  offerTitle: string;
  permanentOrderUrl: string;
  customerWhatsapp?: string | null;
  className?: string;
}

export function OrderWhatsappShareCard({
  orderId,
  offerTitle,
  permanentOrderUrl,
  customerWhatsapp,
  className,
}: OrderWhatsappShareCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const getCleanWhatsappDigits = (phone?: string | null): string => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  const targetPhone = getCleanWhatsappDigits(customerWhatsapp);
  const absoluteOrderUrl = toAbsoluteOrderUrl(permanentOrderUrl);

  // Monta mensagem amigável com link permanente
  const shareMessage = `🎨 *Meus Cards da Promoção no OfertaPronta!*\n\nOlá! Aqui está o link permanente para baixar as artes de *${offerTitle}* em alta resolução:\n🔗 ${absoluteOrderUrl}\n\nGuarde este link para acessar quando quiser!`;

  const encodedText = encodeURIComponent(shareMessage);
  const whatsappUrl = targetPhone
    ? `https://wa.me/${targetPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(absoluteOrderUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
    } catch {
      // Ignora falha de clipboard
    }
  };

  const handleOpenWhatsapp = () => {
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      data-order-id={orderId}
      className={`w-full border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold sm:text-lg">
            Acesso Fácil no Celular
          </CardTitle>
          <Badge
            variant="secondary"
            className="gap-1 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600"
          >
            <MessageCircle className="size-3 text-emerald-600" />
            <span>WhatsApp</span>
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Envie o link permanente das artes para seu WhatsApp para abrir ou
          baixar quando quiser.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 p-4 pt-1 sm:p-5 sm:pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 w-full justify-center gap-2 border-emerald-500/30 bg-emerald-500/5 font-bold text-foreground hover:bg-emerald-500/10 hover:text-emerald-700"
          onClick={handleOpenWhatsapp}
          aria-label="Enviar artes para meu WhatsApp"
        >
          <MessageCircle
            className="size-5 text-emerald-600"
            data-icon="inline-start"
          />
          <span>Enviar artes para meu WhatsApp</span>
          <ExternalLink
            className="size-4 text-muted-foreground"
            data-icon="inline-end"
          />
        </Button>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Typography
            variant="muted"
            className="truncate text-[11px] text-muted-foreground"
          >
            Link permanente: {absoluteOrderUrl}
          </Typography>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-xs"
            onClick={handleCopyLink}
            aria-label="Copiar link permanente"
          >
            {isCopied ? (
              <>
                <Check
                  className="size-3 text-emerald-500"
                  data-icon="inline-start"
                />
                <Typography
                  variant="muted"
                  className="text-xs font-semibold text-emerald-600"
                >
                  Copiado!
                </Typography>
              </>
            ) : (
              <>
                <Copy className="size-3" data-icon="inline-start" />
                <span>Copiar Link</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
