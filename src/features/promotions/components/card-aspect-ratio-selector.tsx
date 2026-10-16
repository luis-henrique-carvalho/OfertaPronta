import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Layers, Smartphone, CheckCircle2 } from "lucide-react";
import type { CardAspectRatio } from "../data/offer-brief.schema";

export interface CardAspectRatioSelectorProps {
  targetAspectRatio: CardAspectRatio;
  onTargetAspectRatioChange: (val: CardAspectRatio) => void;
}

export function CardAspectRatioSelector({
  targetAspectRatio,
  onTargetAspectRatioChange,
}: CardAspectRatioSelectorProps) {
  return (
    <Field>
      <FieldLabel>Formato do Card Publicitário</FieldLabel>
      <FieldDescription>
        Escolha onde você vai postar para a IA compor o card no enquadramento
        nativo.
      </FieldDescription>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1">
        <Button
          type="button"
          variant={targetAspectRatio === "feed" ? "default" : "outline"}
          onClick={() => onTargetAspectRatioChange("feed")}
          className={`relative flex h-auto min-h-[72px] w-full flex-row items-center justify-start gap-3 rounded-xl p-3 text-left whitespace-normal break-words transition-all ${
            targetAspectRatio === "feed"
              ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-sm"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
          }`}
          aria-pressed={targetAspectRatio === "feed"}
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
              targetAspectRatio === "feed"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Layers className="size-5 shrink-0" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <Typography
              as="span"
              className={`text-sm font-bold leading-tight ${
                targetAspectRatio === "feed"
                  ? "text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              Feed Instagram (4:5)
            </Typography>
            <Typography
              as="span"
              variant="muted"
              className={`text-xs mt-0.5 leading-snug ${
                targetAspectRatio === "feed"
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              1080×1350 • Ideal para post no feed
            </Typography>
          </div>
          {targetAspectRatio === "feed" && (
            <CheckCircle2 className="size-4 shrink-0 text-primary-foreground" />
          )}
        </Button>

        <Button
          type="button"
          variant={targetAspectRatio === "story" ? "default" : "outline"}
          onClick={() => onTargetAspectRatioChange("story")}
          className={`relative flex h-auto min-h-[72px] w-full flex-row items-center justify-start gap-3 rounded-xl p-3 text-left whitespace-normal break-words transition-all ${
            targetAspectRatio === "story"
              ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-sm"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
          }`}
          aria-pressed={targetAspectRatio === "story"}
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
              targetAspectRatio === "story"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary/10 text-primary"
            }`}
          >
            <Smartphone className="size-5 shrink-0" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <Typography
              as="span"
              className={`text-sm font-bold leading-tight ${
                targetAspectRatio === "story"
                  ? "text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              Story & WhatsApp (9:16)
            </Typography>
            <Typography
              as="span"
              variant="muted"
              className={`text-xs mt-0.5 leading-snug ${
                targetAspectRatio === "story"
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              1080×1920 • Ideal para Stories e Status
            </Typography>
          </div>
          {targetAspectRatio === "story" && (
            <CheckCircle2 className="size-4 shrink-0 text-primary-foreground" />
          )}
        </Button>
      </div>
    </Field>
  );
}
