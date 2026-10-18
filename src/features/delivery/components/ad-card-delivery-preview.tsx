import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Smartphone, LayoutGrid, CheckCircle } from "lucide-react";

export interface AdCardDeliveryPreviewProps {
  feedCardUrl: string;
  storyCardUrl: string;
  offerTitle: string;
  defaultTab?: "feed" | "story";
  className?: string;
}

export function AdCardDeliveryPreview({
  feedCardUrl,
  storyCardUrl,
  offerTitle,
  defaultTab = "feed",
  className,
}: AdCardDeliveryPreviewProps) {
  return (
    <Card
      className={`w-full overflow-hidden border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <CardHeader className="flex flex-col gap-2.5 p-4 pb-2 sm:p-5 sm:pb-3">
        <div className="flex items-center justify-between">
          <Typography variant="h3" className="text-sm font-bold sm:text-base">
            Suas Artes em Alta Resolução
          </Typography>
          <Badge
            variant="secondary"
            className="gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-600"
          >
            <CheckCircle className="size-3 text-emerald-600" />
            <span>Sem Marca d&apos;Água</span>
          </Badge>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="feed"
              className="gap-1.5 py-2 text-xs font-semibold"
            >
              <LayoutGrid className="size-3.5" />
              <span>Feed (1080×1350)</span>
            </TabsTrigger>
            <TabsTrigger
              value="story"
              className="gap-1.5 py-2 text-xs font-semibold"
            >
              <Smartphone className="size-3.5" />
              <span>Story (1080×1920)</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-3">
            {/* shadcn-ignore: layout de moldura estrutural do aspect-ratio */}
            <div className="mx-auto max-w-[340px] overflow-hidden rounded-xl border border-border/80 bg-muted/40 shadow-inner">
              <AspectRatio ratio={4 / 5}>
                <img
                  src={feedCardUrl}
                  alt={`Arte de Feed da promoção: ${offerTitle}`}
                  className="size-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </AspectRatio>
            </div>
            <div className="mt-2 text-center">
              <Typography
                variant="muted"
                className="text-[11px] text-muted-foreground"
              >
                Proporção 4:5 • Ideal para Feed e Carrossel do Instagram
              </Typography>
            </div>
          </TabsContent>

          <TabsContent value="story" className="mt-3">
            {/* shadcn-ignore: layout de moldura estrutural do aspect-ratio */}
            <div className="mx-auto max-w-[280px] overflow-hidden rounded-xl border border-border/80 bg-muted/40 shadow-inner">
              <AspectRatio ratio={9 / 16}>
                <img
                  src={storyCardUrl}
                  alt={`Arte de Story da promoção: ${offerTitle}`}
                  className="size-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </AspectRatio>
            </div>
            <div className="mt-2 text-center">
              <Typography
                variant="muted"
                className="text-[11px] text-muted-foreground"
              >
                Proporção 9:16 • Ideal para Stories do Instagram e Status do
                WhatsApp
              </Typography>
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0" />
    </Card>
  );
}
