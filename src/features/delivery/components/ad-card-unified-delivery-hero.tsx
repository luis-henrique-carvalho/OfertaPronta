import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { LayoutGrid, Smartphone, ShieldCheck, Sparkles } from "lucide-react";
import type { DownloadFormat } from "../data/delivery.schemas";
import { DeliveryArtworkViewer } from "./delivery-artwork-viewer";
import { DeliveryHeroActions } from "./delivery-hero-actions";

export interface AdCardUnifiedDeliveryHeroProps {
  orderId: string;
  feedCardUrl: string;
  storyCardUrl: string;
  offerTitle: string;
  businessName?: string | null;
  businessSegment?: string | null;
  permanentOrderUrl: string;
  customerWhatsapp?: string | null;
  downloadCount?: number;
  onDownload: (format: DownloadFormat) => Promise<void> | void;
  isDownloading?: boolean;
  activeFormat?: DownloadFormat | null;
  defaultTab?: DownloadFormat;
  className?: string;
}

export function AdCardUnifiedDeliveryHero({
  orderId,
  feedCardUrl,
  storyCardUrl,
  offerTitle,
  businessName: _businessName,
  businessSegment: _businessSegment,
  permanentOrderUrl,
  customerWhatsapp,
  downloadCount = 0,
  onDownload,
  isDownloading = false,
  activeFormat = null,
  defaultTab = "feed",
  className,
}: AdCardUnifiedDeliveryHeroProps) {
  const [activeTab, setActiveTab] = useState<DownloadFormat>(defaultTab);
  const [isCopied, setIsCopied] = useState(false);

  const isCurrentFormatDownloading =
    isDownloading && activeFormat === activeTab;

  const handleDownload = () => {
    onDownload(activeTab);
  };

  const getCleanWhatsappDigits = (phone?: string | null): string => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  const targetPhone = getCleanWhatsappDigits(customerWhatsapp);
  const shareMessage = `🎨 *Meus Cards da Promoção no OfertaPronta!*\n\nOlá! Aqui está o link permanente para acessar e baixar as artes de *${offerTitle}* em alta resolução:\n🔗 ${permanentOrderUrl}\n\nGuarde este link para acessar quando quiser!`;
  const whatsappUrl = targetPhone
    ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(shareMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  const handleOpenWhatsapp = () => {
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(permanentOrderUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
    } catch {
      // Ignora falha de clipboard
    }
  };

  return (
    <Card
      data-order-id={orderId}
      className={`w-full overflow-hidden border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <CardContent className="flex flex-col gap-3.5 p-4 sm:p-5">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as DownloadFormat)}
          className="w-full"
        >
          <div className="flex items-center justify-between gap-2 pb-2">
            <TabsList className="grid h-9 grid-cols-2 p-0.5">
              <TabsTrigger
                value="feed"
                onClick={() => setActiveTab("feed")}
                className="gap-1.5 px-3 py-1.5 text-xs font-semibold data-[state=active]:shadow-xs"
              >
                <LayoutGrid className="size-3.5" data-icon="inline-start" />
                <span>Feed (1080×1350)</span>
              </TabsTrigger>
              <TabsTrigger
                value="story"
                onClick={() => setActiveTab("story")}
                className="gap-1.5 px-3 py-1.5 text-xs font-semibold data-[state=active]:shadow-xs"
              >
                <Smartphone className="size-3.5" data-icon="inline-start" />
                <span>Story (1080×1920)</span>
              </TabsTrigger>
            </TabsList>

            <Badge
              variant="secondary"
              className="hidden gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 sm:inline-flex"
            >
              <Sparkles className="size-3 text-emerald-600" />
              <span>Sem Marca d&apos;Água</span>
            </Badge>
          </div>

          <DeliveryArtworkViewer
            feedCardUrl={feedCardUrl}
            storyCardUrl={storyCardUrl}
            offerTitle={offerTitle}
          />
        </Tabs>

        <DeliveryHeroActions
          activeTab={activeTab}
          isDownloading={isDownloading}
          isCurrentFormatDownloading={isCurrentFormatDownloading}
          isCopied={isCopied}
          onDownload={handleDownload}
          onOpenWhatsapp={handleOpenWhatsapp}
          onCopyLink={handleCopyLink}
        />

        <div className="flex items-center justify-between border-t border-border/50 pt-1 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <Typography variant="muted" className="text-[11px]">
              Downloads permanentes em alta resolução
            </Typography>
          </div>

          {downloadCount > 0 && (
            <Typography variant="muted" className="text-[11px] font-medium">
              {downloadCount}{" "}
              {downloadCount === 1
                ? "download realizado"
                : "downloads realizados"}
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
