import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Trash2 } from "lucide-react";

interface PhotoOptionCardProps {
  icon: ReactNode;
  iconBgClass: string;
  title: string;
  description: string;
  badgeText?: string;
  image: string | null;
  imageAlt: string;
  isContainPreview?: boolean;
  buttonLabel: string;
  buttonClass: string;
  onUploadClick: () => void;
  onRemoveClick: () => void;
}

export function PhotoOptionCard({
  icon,
  iconBgClass,
  title,
  description,
  badgeText,
  image,
  imageAlt,
  isContainPreview,
  buttonLabel,
  buttonClass,
  onUploadClick,
  onRemoveClick,
}: PhotoOptionCardProps) {
  return (
    <Card className="p-3.5 rounded-2xl border-border bg-card shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}
          >
            {icon}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">{title}</span>
              {badgeText && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-muted-foreground"
                >
                  {badgeText}
                </Badge>
              )}
              {image && <CheckCircle2 className="size-4 text-emerald-600" />}
            </div>
            <Typography variant="muted" className="text-xs">
              {description}
            </Typography>
          </div>
        </div>

        {image ? (
          <div className="flex items-center gap-2 shrink-0">
            <img
              src={image}
              alt={imageAlt}
              className={`size-12 rounded-lg border border-border ${
                isContainPreview
                  ? "object-contain bg-muted p-1"
                  : "object-cover"
              }`}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={onRemoveClick}
              className="size-8 rounded-full"
              aria-label={`Remover ${imageAlt}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUploadClick}
            className={buttonClass}
          >
            {buttonLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
