import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Spinner } from "@/components/ui/spinner";
import {
  Download,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { DownloadFormat } from "../data/delivery.schemas";

export interface DeliveryHeroActionsProps {
  activeTab: DownloadFormat;
  isDownloading: boolean;
  isCurrentFormatDownloading: boolean;
  isCopied: boolean;
  remainingRegenerations?: number;
  onDownload: () => void;
  onOpenWhatsapp: () => void;
  onCopyLink: () => void;
  onEditCard?: () => void;
}

export function DeliveryHeroActions({
  activeTab,
  isDownloading,
  isCurrentFormatDownloading,
  isCopied,
  remainingRegenerations,
  onDownload,
  onOpenWhatsapp,
  onCopyLink,
  onEditCard,
}: DeliveryHeroActionsProps) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <Button
        type="button"
        size="lg"
        className="h-12 w-full text-sm font-bold shadow-sm"
        onClick={onDownload}
        disabled={isDownloading}
        aria-label={
          activeTab === "feed" ? "Baixar Feed em HD" : "Baixar Story em HD"
        }
      >
        {isCurrentFormatDownloading ? (
          <Spinner className="size-4" data-icon="inline-start" />
        ) : (
          <Download className="size-4" data-icon="inline-start" />
        )}
        <span>
          {activeTab === "feed" ? "Baixar Feed em HD" : "Baixar Story em HD"}
        </span>
        <Badge
          variant="outline"
          className="ml-auto hidden border-primary-foreground/30 bg-primary-foreground/10 text-[10px] font-semibold text-primary-foreground sm:inline-flex"
        >
          {activeTab === "feed" ? "1080×1350" : "1080×1920"}
        </Badge>
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-xs font-semibold text-foreground hover:bg-emerald-500/10 hover:text-emerald-700"
          onClick={onOpenWhatsapp}
          aria-label="Salvar no WhatsApp"
        >
          <MessageCircle
            className="size-3.5 text-emerald-600"
            data-icon="inline-start"
          />
          <span className="truncate">Salvar no WhatsApp</span>
          <ExternalLink
            className="hidden size-3 text-muted-foreground/60 sm:inline"
            data-icon="inline-end"
          />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs font-semibold"
          onClick={onCopyLink}
          aria-label="Copiar link permanente"
        >
          {isCopied ? (
            <>
              <Check
                className="size-3.5 text-emerald-600"
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
              <Copy className="size-3.5" data-icon="inline-start" />
              <span className="truncate">Copiar Link</span>
            </>
          )}
        </Button>
      </div>

      {onEditCard && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full gap-1.5 border-primary/25 bg-primary/5 text-xs font-bold text-primary hover:bg-primary/10"
          onClick={onEditCard}
          aria-label="Editar ou ajustar arte com IA"
        >
          <Sparkles className="size-3.5 text-primary" data-icon="inline-start" />
          <span>
            Editar / Ajustar Arte com IA
            {remainingRegenerations !== undefined && remainingRegenerations > 0
              ? ` (${remainingRegenerations} restantes)`
              : ""}
          </span>
        </Button>
      )}
    </div>
  );
}
