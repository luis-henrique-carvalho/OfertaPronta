import type { BusinessSegment } from "../data/offer-brief.schema";
import { BUSINESS_SEGMENTS, SEGMENT_CATALOG } from "../data/offer-brief.schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import {
  ShoppingCart,
  Sparkles,
  Pizza,
  Flame,
  UtensilsCrossed,
  Store,
  Shirt,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

interface SegmentSelectorProps {
  value: BusinessSegment;
  onChange: (segment: BusinessSegment) => void;
}

const SEGMENT_ICONS: Record<BusinessSegment, LucideIcon> = {
  fashion: Shirt,
  supermarket: ShoppingCart,
  "beauty-salon": Sparkles,
  pizzeria: Pizza,
  "burger-shop": Flame,
  restaurant: UtensilsCrossed,
  "local-retail": Store,
};

export function SegmentSelector({ value, onChange }: SegmentSelectorProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="gap-1.5 bg-muted/50 text-xs font-semibold"
          >
            <Sparkles className="size-3 text-primary" />
            Passo 1 de 3
          </Badge>
          <Typography variant="muted" className="text-xs font-medium">
            Selecione seu ramo
          </Typography>
        </div>
        <CardTitle className="pt-2 text-xl font-bold">
          Qual é o tipo do seu negócio?
        </CardTitle>
        <CardDescription>
          A IA adapta automaticamente os estilos, paletas e textos promocionais
          para o seu segmento.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {BUSINESS_SEGMENTS.map((segmentKey) => {
            const item = SEGMENT_CATALOG[segmentKey];
            const Icon = SEGMENT_ICONS[segmentKey];
            const isSelected = value === segmentKey;

            return (
              <Button
                key={segmentKey}
                type="button"
                variant={isSelected ? "default" : "outline"}
                onClick={() => onChange(segmentKey)}
                className={`relative flex h-auto min-h-[102px] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-xl p-3 text-center whitespace-normal break-words transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                }`}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 text-primary-foreground">
                    <CheckCircle2 className="size-4 shrink-0" />
                  </span>
                )}
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="size-5 shrink-0" />
                </div>
                <Typography
                  as="span"
                  variant="muted"
                  className={`text-xs font-bold leading-snug break-words line-clamp-2 max-w-full ${
                    isSelected ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {item.label}
                </Typography>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
