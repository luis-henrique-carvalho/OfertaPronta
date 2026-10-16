import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Lightbulb, Sparkles } from "lucide-react";
import type { SegmentCatalogItem } from "../data/offer-brief.schema";

export interface SegmentSuggestionsCardProps {
  catalogItem: SegmentCatalogItem;
  onApplyExample: (example: {
    title: string;
    promoPrice: string;
    originalPrice?: string;
    stylePresetId: string;
  }) => void;
}

export function SegmentSuggestionsCard({
  catalogItem,
  onApplyExample,
}: SegmentSuggestionsCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1.5 text-primary">
          <Lightbulb className="size-4" />
          <Typography
            variant="muted"
            className="text-xs font-semibold text-primary"
          >
            Sugestões Rápidas de {catalogItem.label}
          </Typography>
        </div>
        <CardTitle className="text-base font-bold">
          Teste com 1 toque um exemplo do seu nicho:
        </CardTitle>
        <CardDescription>
          Preenche o título, os preços e o melhor estilo para você ver o Card
          pronto imediatamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {catalogItem.exampleOffers.map((example) => (
            <Button
              key={`${example.title}-${example.promoPrice}`}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onApplyExample(example)}
              className="h-auto py-2 px-3 text-xs font-medium text-left justify-start gap-1.5 rounded-lg border-border hover:border-primary/50 hover:bg-primary/5 whitespace-normal break-words max-w-full"
            >
              <Sparkles className="size-3 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                {example.title}
              </span>
              <span className="text-primary font-bold shrink-0">
                ({example.promoPrice})
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
