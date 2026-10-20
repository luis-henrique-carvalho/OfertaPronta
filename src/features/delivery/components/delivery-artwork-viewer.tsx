import { TabsContent } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Typography } from "@/components/ui/typography";

export interface DeliveryArtworkViewerProps {
  feedCardUrl: string;
  storyCardUrl: string;
  offerTitle: string;
}

export function DeliveryArtworkViewer({
  feedCardUrl,
  storyCardUrl,
  offerTitle,
}: DeliveryArtworkViewerProps) {
  return (
    <>
      <TabsContent value="feed" className="mt-0 focus-visible:outline-none">
        {/* shadcn-ignore: moldura estrutural do aspect-ratio */}
        <div className="mx-auto max-w-[280px] overflow-hidden rounded-xl border border-border/80 bg-muted/30 shadow-xs sm:max-w-[320px]">
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
        <div className="mt-1.5 text-center">
          <Typography
            variant="muted"
            className="text-[11px] text-muted-foreground"
          >
            Feed do Instagram • 1080×1350 px
          </Typography>
        </div>
      </TabsContent>

      <TabsContent value="story" className="mt-0 focus-visible:outline-none">
        {/* shadcn-ignore: moldura estrutural do aspect-ratio */}
        <div className="mx-auto max-w-[210px] overflow-hidden rounded-xl border border-border/80 bg-muted/30 shadow-xs sm:max-w-[245px]">
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
        <div className="mt-1.5 text-center">
          <Typography
            variant="muted"
            className="text-[11px] text-muted-foreground"
          >
            Story do Instagram e Status do WhatsApp • 1080×1920 px
          </Typography>
        </div>
      </TabsContent>
    </>
  );
}
