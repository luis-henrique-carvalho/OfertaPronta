import * as React from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PhotoOptionCardProps {
  icon: React.ReactNode;
  iconBgClass?: string;
  title: string;
  description: string;
  badgeText?: string;
  image?: string | null;
  imageDataUrl?: string | null;
  imageAlt?: string;
  fit?: "cover" | "contain";
  isContainPreview?: boolean;
  buttonLabel?: string;
  buttonClass?: string;
  accept?: string;
  successBadgeText?: string;
  onUploadClick?: () => void;
  onFileSelect?: (file: File) => void;
  onImageChange?: (dataUrl: string | null) => void;
  onRemoveClick: () => void;
  className?: string;
  testId?: string;
}

export function PhotoOptionCard({
  icon,
  iconBgClass,
  title,
  description,
  badgeText,
  image,
  imageDataUrl,
  imageAlt,
  fit,
  isContainPreview,
  buttonLabel,
  buttonClass,
  accept = "image/jpeg,image/png,image/webp",
  successBadgeText,
  onUploadClick,
  onFileSelect,
  onImageChange,
  onRemoveClick,
  className,
  testId,
}: PhotoOptionCardProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentImage = imageDataUrl ?? image;
  const hasImage = Boolean(currentImage);

  const resolvedFit: "cover" | "contain" =
    fit ?? (isContainPreview ? "contain" : "cover");

  const handleUploadTrigger = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileSelect?.(file);

    if (onImageChange) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onImageChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  return (
    <Card
      data-testid={testId || "photo-option-card"}
      className={cn(
        "p-3.5 rounded-2xl border-border bg-card shadow-2xs transition-all",
        className,
      )}
    >
      {/* shadcn-ignore: hidden native file input triggered via accessible Shadcn Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="photo-option-file-input"
        onChange={handleFileInputChange}
      />

      <div className="flex items-start justify-between gap-3">
        {/* Lado Esquerdo: Ícone + Título + Descrição */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              iconBgClass || "bg-primary/10 text-primary",
            )}
          >
            {icon}
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">{title}</span>
              {badgeText && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-muted-foreground"
                >
                  {badgeText}
                </Badge>
              )}
              {hasImage && (
                <Badge
                  variant="outline"
                  data-testid="photo-option-success-badge"
                  className="text-[10px] px-1.5 py-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{successBadgeText || "Enviado"}</span>
                </Badge>
              )}
            </div>
            <Typography variant="muted" className="text-xs">
              {description}
            </Typography>
          </div>
        </div>

        {/* Lado Direito: Preview com Botão de Remoção OU Botão Tátil de Upload */}
        {hasImage && currentImage ? (
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border">
              <img
                src={currentImage}
                alt={imageAlt || `Preview de ${title}`}
                data-testid="photo-option-image-preview"
                className={cn(
                  "size-full",
                  resolvedFit === "contain"
                    ? "object-contain bg-muted p-1"
                    : "object-cover",
                )}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={onRemoveClick}
              className="size-8 rounded-full shrink-0"
              aria-label={`Remover ${imageAlt || title}`}
              data-testid="photo-option-remove-button"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadTrigger}
            data-testid="photo-option-upload-button"
            className={cn(
              "shrink-0 rounded-xl border-primary/40 text-xs font-bold text-primary hover:bg-primary/5 min-h-[44px] sm:min-h-0",
              buttonClass,
            )}
          >
            {buttonLabel || "Enviar Foto"}
          </Button>
        )}
      </div>
    </Card>
  );
}
