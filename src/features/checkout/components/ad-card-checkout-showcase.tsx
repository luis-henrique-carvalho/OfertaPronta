import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Image as ImageIcon, Maximize2 } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";

export interface AdCardCheckoutShowcaseProps {
  previewCardImageUrl?: string | null;
  offerTitle: string;
  businessName?: string | null;
  targetAspectRatio?: string | null;
  amountCents?: number;
  planName?: string | null;
  maxRegenerations?: number | null;
  cobrandingAccepted?: boolean;
  cobrandingCreditText?: string;
  className?: string;
}

export function AdCardCheckoutShowcase({
  previewCardImageUrl,
  offerTitle,
  businessName,
  targetAspectRatio = "feed",
  amountCents,
  planName,
  maxRegenerations,
  cobrandingAccepted = false,
  cobrandingCreditText,
  className,
}: AdCardCheckoutShowcaseProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const defaultPlan = getDefaultCampaignPlan();
  const resolvedAmountCents = amountCents ?? defaultPlan.amountCents;
  const resolvedMaxRegenerations =
    maxRegenerations ?? defaultPlan.maxPostPaymentRegenerations;
  const formattedPrice = formatBRL(resolvedAmountCents);

  const isStory = targetAspectRatio === "story";

  return (
    <Card
      className={`w-full overflow-hidden border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="gap-1 px-2.5 py-0.5 text-xs font-semibold"
          >
            <Sparkles className="size-3 text-primary" />
            {planName || "Campanha Completa"}
          </Badge>
          <Badge
            variant="outline"
            className="border-primary/30 text-xs font-bold text-primary"
          >
            Feed + Story
          </Badge>
        </div>

        <CardTitle className="pt-1 text-xl font-black tracking-tight">
          {offerTitle || "Card Publicitário"}
        </CardTitle>

        {businessName && (
          <CardDescription className="text-xs font-medium">
            {businessName}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4 pt-0 sm:p-5 sm:pt-0">
        {/* Container visual da prévia com aspecto correto */}
        {/* shadcn-ignore: layout do showcase */}
        <div
          className={`relative mx-auto w-full overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-sm ${
            isStory ? "max-w-[260px]" : "max-w-[320px]"
          }`}
        >
          {previewCardImageUrl ? (
            <>
              {/* shadcn-ignore: layout de moldura estrutural do aspect-ratio */}
              <AspectRatio ratio={isStory ? 9 / 16 : 4 / 5}>
                {/* shadcn-ignore: img element for preview rendering */}
                <img
                  src={previewCardImageUrl}
                  alt={`Prévia do Card Publicitário: ${offerTitle}`}
                  className="size-full object-cover"
                  loading="eager"
                />
              </AspectRatio>

              {/* Botão de Zoom para Tela Cheia */}
              <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 z-10 size-8 rounded-full bg-background/85 shadow-md backdrop-blur-sm hover:bg-background"
                    aria-label="Ver arte em tamanho ampliado"
                  >
                    <Maximize2 className="size-4 text-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-4 sm:max-w-lg">
                  <DialogTitle className="text-sm font-bold">
                    {offerTitle}
                  </DialogTitle>
                  {/* shadcn-ignore: layout do modal de zoom */}
                  <div className="relative mx-auto w-full overflow-hidden rounded-xl border border-border bg-black/90">
                    {/* shadcn-ignore: layout de moldura estrutural do aspect-ratio */}
                    <AspectRatio ratio={isStory ? 9 / 16 : 4 / 5}>
                      {/* shadcn-ignore: img element in zoom dialog */}
                      <img
                        src={previewCardImageUrl}
                        alt={`Ampliação da arte: ${offerTitle}`}
                        className="size-full object-contain"
                      />
                    </AspectRatio>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            // shadcn-ignore: layout
            <div className="flex h-64 w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <ImageIcon className="size-10 text-muted-foreground/60" />
              <Typography variant="muted" className="text-xs font-medium">
                Prévia do Card Publicitário
              </Typography>
            </div>
          )}

          {/* Mockup sutil da assinatura de co-branding no rodapé da arte */}
          {cobrandingAccepted && (
            <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex max-w-[90%] items-center justify-center">
              <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-2.5 py-0.5 shadow-sm backdrop-blur-sm">
                <Sparkles className="size-2.5 shrink-0 text-primary" />
                <Typography
                  variant="muted"
                  as="span"
                  className="truncate text-[10px] font-semibold text-white/95"
                >
                  {cobrandingCreditText || "Design por @ofertapronta"}
                </Typography>
              </div>
            </div>
          )}
        </div>

        {/* Aviso de liberação de alta resolução - posicionado limpo fora da imagem do card */}
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-center">
          <Sparkles className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <Typography
            variant="muted"
            className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
          >
            Alta Resolução (1080p) sem Marca d&apos;Água após Pix
          </Typography>
        </div>

        {/* shadcn-ignore: layout da faixa de resumo de valor */}
        <div className="mt-1 flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-3">
          <div className="flex flex-col">
            <Typography
              variant="muted"
              className="text-xs font-semibold text-foreground"
            >
              {isStory
                ? "Formato Principal: Story (9:16) + Feed"
                : "Formato Principal: Feed (4:5) + Story"}
            </Typography>
            <Typography
              variant="muted"
              className="text-[11px] text-muted-foreground"
            >
              Direito a até {resolvedMaxRegenerations} ajustes ou regenerações
              com IA pós-compra
            </Typography>
          </div>
          <div className="flex flex-col items-end">
            <Typography
              variant="h3"
              className="text-lg font-black tracking-tight text-foreground sm:text-xl"
            >
              {formattedPrice}
            </Typography>
            <Typography
              variant="muted"
              className="text-[10px] font-medium text-muted-foreground"
            >
              pagamento único
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
