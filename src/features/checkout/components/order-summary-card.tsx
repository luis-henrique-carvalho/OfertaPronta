import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Check, Sparkles, Image as ImageIcon } from "lucide-react";

export interface OrderSummaryCardProps {
  amountCents?: number;
  offerTitle: string;
  businessName?: string | null;
  previewCardImageUrl?: string | null;
  targetAspectRatio?: string | null;
}

export function OrderSummaryCard({
  amountCents = 990,
  offerTitle,
  businessName,
  previewCardImageUrl,
  targetAspectRatio = "feed",
}: OrderSummaryCardProps) {
  const formattedPrice = (amountCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Card className="w-full border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="gap-1 text-xs font-semibold px-2.5 py-0.5"
          >
            <Sparkles className="size-3 text-primary" />
            Campanha Completa
          </Badge>
          <Badge
            variant="outline"
            className="text-xs font-bold text-primary border-primary/30"
          >
            Feed + Story
          </Badge>
        </div>

        <CardTitle className="text-xl font-black tracking-tight pt-1">
          {offerTitle || "Card Publicitário"}
        </CardTitle>

        {businessName && (
          <CardDescription className="text-xs font-medium">
            {businessName}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
          {previewCardImageUrl ? (
            // shadcn-ignore: layout
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {/* shadcn-ignore: img element for preview rendering */}
              <img
                src={previewCardImageUrl}
                alt="Miniatura da prévia do Card Publicitário"
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            // shadcn-ignore: layout
            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/70 text-muted-foreground">
              <ImageIcon className="size-6" />
            </div>
          )}

          <div className="flex flex-1 flex-col justify-center min-w-0">
            <Typography variant="muted" className="text-xs truncate">
              {targetAspectRatio === "story"
                ? "Formato Principal: Story (9:16)"
                : "Formato Principal: Feed (4:5)"}
            </Typography>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <Typography
                variant="h4"
                className="text-lg font-black text-foreground"
              >
                {formattedPrice}
              </Typography>
              <Typography variant="muted" className="text-[11px]">
                pagamento único
              </Typography>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <Check className="size-3.5 text-primary shrink-0" />
            <Typography variant="muted" className="text-xs">
              Liberação instantânea dos PNGs em alta definição (1080p)
            </Typography>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="size-3.5 text-primary shrink-0" />
            <Typography variant="muted" className="text-xs">
              Arquivos limpos sem marca d&apos;água prontos para postar
            </Typography>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="size-3.5 text-primary shrink-0" />
            <Typography variant="muted" className="text-xs">
              Direito a até 3 ajustes ou regenerações com IA pós-compra
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
