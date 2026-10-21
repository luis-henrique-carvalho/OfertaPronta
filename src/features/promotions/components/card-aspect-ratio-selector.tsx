import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Layers, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardAspectRatio } from "../data/offer-brief.schema";

export interface CardAspectRatioSelectorProps {
  targetAspectRatio: CardAspectRatio;
  onTargetAspectRatioChange: (val: CardAspectRatio) => void;
}

export function CardAspectRatioSelector({
  targetAspectRatio,
  onTargetAspectRatioChange,
}: CardAspectRatioSelectorProps) {
  const isFeed = targetAspectRatio === "feed";
  const isStory = targetAspectRatio === "story";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground">
        Onde você vai postar?
      </Label>
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <Button
          type="button"
          data-testid="aspect-ratio-feed"
          variant={isFeed ? "default" : "outline"}
          onClick={() => onTargetAspectRatioChange("feed")}
          className={cn(
            "h-auto min-h-[50px] py-2 px-3 flex items-center justify-start gap-2.5 rounded-xl border text-left transition-all min-w-0 select-none",
            isFeed
              ? "border-primary bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
              : "border-border bg-card text-foreground hover:bg-muted/50",
          )}
          aria-pressed={isFeed}
        >
          <Layers className="size-4 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold leading-tight">Feed</span>
            <span
              className={cn(
                "text-[10px] leading-tight",
                isFeed ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              Post normal
            </span>
          </div>
        </Button>

        <Button
          type="button"
          data-testid="aspect-ratio-story"
          variant={isStory ? "default" : "outline"}
          onClick={() => onTargetAspectRatioChange("story")}
          className={cn(
            "h-auto min-h-[50px] py-2 px-3 flex items-center justify-start gap-2.5 rounded-xl border text-left transition-all min-w-0 select-none",
            isStory
              ? "border-primary bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
              : "border-border bg-card text-foreground hover:bg-muted/50",
          )}
          aria-pressed={isStory}
        >
          <Smartphone className="size-4 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold leading-tight">Story</span>
            <span
              className={cn(
                "text-[10px] leading-tight",
                isStory
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              WhatsApp e Insta
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
}
