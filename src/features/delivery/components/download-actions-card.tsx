import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Download, LayoutGrid, Smartphone, ShieldCheck } from "lucide-react";
import type { DownloadFormat } from "../data/delivery.schemas";

export interface DownloadActionsCardProps {
  orderId: string;
  downloadCount?: number;
  onDownload: (format: DownloadFormat) => Promise<void> | void;
  isDownloading?: boolean;
  activeFormat?: DownloadFormat | null;
  className?: string;
}

export function DownloadActionsCard({
  orderId,
  downloadCount = 0,
  onDownload,
  isDownloading = false,
  activeFormat = null,
  className,
}: DownloadActionsCardProps) {
  const handleDownload = (format: DownloadFormat) => {
    onDownload(format);
  };

  const isFeedDownloading = isDownloading && activeFormat === "feed";
  const isStoryDownloading = isDownloading && activeFormat === "story";

  return (
    <Card
      data-order-id={orderId}
      className={`w-full border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold sm:text-lg">
            Download dos Arquivos HD
          </CardTitle>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 text-[11px] font-semibold text-primary"
          >
            <span>PNG Sem Perdas</span>
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Baixe os arquivos originais nos 2 formatos oficiais do Instagram e
          WhatsApp.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4 pt-1 sm:p-5 sm:pt-2">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Botão Baixar Feed */}
          <Button
            type="button"
            size="lg"
            className="h-12 w-full font-bold shadow-sm"
            onClick={() => handleDownload("feed")}
            disabled={isDownloading}
            aria-label="Baixar Feed (1080×1350)"
          >
            {isFeedDownloading ? (
              <Spinner className="size-4" data-icon="inline-start" />
            ) : (
              <LayoutGrid className="size-4" data-icon="inline-start" />
            )}
            <span className="flex-1 text-left sm:text-center">
              Baixar Feed (1080×1350)
            </span>
            <Download className="size-4 opacity-70" data-icon="inline-end" />
          </Button>

          {/* Botão Baixar Story */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="h-12 w-full font-bold shadow-sm"
            onClick={() => handleDownload("story")}
            disabled={isDownloading}
            aria-label="Baixar Story (1080×1920)"
          >
            {isStoryDownloading ? (
              <Spinner className="size-4" data-icon="inline-start" />
            ) : (
              <Smartphone className="size-4" data-icon="inline-start" />
            )}
            <span className="flex-1 text-left sm:text-center">
              Baixar Story (1080×1920)
            </span>
            <Download className="size-4 opacity-70" data-icon="inline-end" />
          </Button>
        </div>

        <div className="flex items-center justify-between pt-1 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <Typography variant="muted" className="text-[11px]">
              Downloads permanentes e ilimitados
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
