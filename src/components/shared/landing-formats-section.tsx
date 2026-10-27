import { Typography } from "@/components/ui/typography";
import { Smartphone, Zap } from "lucide-react";
import { SHOWCASE_SEED_CATALOG } from "@/features/promotions/data/showcase-catalog";

export function LandingFormatsSection() {
  const feedItem =
    SHOWCASE_SEED_CATALOG.find((item) => item.id === "seed-pizzeria-02") ??
    SHOWCASE_SEED_CATALOG[0];
  const storyItem =
    SHOWCASE_SEED_CATALOG.find((item) => item.id === "seed-burger-02") ??
    SHOWCASE_SEED_CATALOG[1];

  return (
    <section
      className="bg-background py-20 lg:py-36 px-4 sm:px-8"
      id="formatos"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-left">
          <Typography
            variant="h2"
            className="text-left text-[clamp(28px,3.2vw,44px)] font-bold tracking-tight mb-3"
          >
            Uma única criação entrega o post do Feed e a tela cheia do Story
          </Typography>
          <Typography
            variant="muted"
            className="text-left max-w-xl text-base mb-2"
          >
            Nada de post cortado pela metade ou letra miúda que ninguém lê no
            celular. Você recebe os dois tamanhos certos para divulgar em todas
            as redes.
          </Typography>
          <Typography
            variant="muted"
            className="text-left text-sm font-semibold text-secondary"
          >
            2 Formatos Prontos de Uma Vez
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bloco Feed */}
          <div className="bg-card-subtle [clip-path:polygon(0_0,calc(100%-32px)_0,100%_32px,100%_100%,0_100%)] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary [clip-path:polygon(6px_0,100%_0,100%_100%,0_100%,0_6px)]">
                  <Smartphone className="size-3.5" />
                  <Typography
                    as="span"
                    variant="muted"
                    className="text-xs font-bold text-primary"
                  >
                    Feed Retrato
                  </Typography>
                </div>
                <Typography variant="muted" className="text-xs font-semibold">
                  1080 × 1350 px (4:5)
                </Typography>
              </div>

              <Typography variant="h3" className="pt-2 text-xl font-bold">
                Post para Feed e Grupos
              </Typography>
              <Typography
                variant="muted"
                className="mt-2 text-sm leading-relaxed"
              >
                Formato retrato que ocupa mais espaço na tela do celular e faz o
                cliente parar de rolar o Instagram.
              </Typography>

              <div className="relative aspect-[4/5] max-h-80 w-full overflow-hidden bg-background [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,0_100%)] my-6 flex items-center justify-center">
                <img
                  src={feedItem.imageUrl}
                  alt="Arte para Feed"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-background/95 p-3 text-left">
                  <Typography variant="h4" className="text-sm font-bold">
                    Arte para Feed
                  </Typography>
                  <Typography variant="muted" className="text-xs">
                    Tipografia comercial de alto impacto e selo de preço em
                    destaque
                  </Typography>
                </div>
              </div>
            </div>

            <Typography variant="muted" className="text-xs pt-2">
              Ideal para fixar no perfil da loja e disparar nas listas de
              transmissão do WhatsApp.
            </Typography>
          </div>

          {/* Bloco Story */}
          <div className="bg-card-subtle [clip-path:polygon(0_0,calc(100%-32px)_0,100%_32px,100%_100%,0_100%)] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/15 text-secondary [clip-path:polygon(6px_0,100%_0,100%_100%,0_100%,0_6px)]">
                  <Zap className="size-3.5 text-secondary" />
                  <Typography
                    as="span"
                    variant="muted"
                    className="text-xs font-bold text-secondary"
                  >
                    Story & Status
                  </Typography>
                </div>
                <Typography variant="muted" className="text-xs font-semibold">
                  1080 × 1920 px (9:16)
                </Typography>
              </div>

              <Typography variant="h3" className="pt-2 text-xl font-bold">
                Story e Status com Espaço para Link
              </Typography>
              <Typography
                variant="muted"
                className="mt-2 text-sm leading-relaxed"
              >
                Tela cheia vertical com espaço livre na parte de baixo para você
                colar a figurinha do link do seu WhatsApp.
              </Typography>

              <div className="relative aspect-[9/16] max-h-80 w-full overflow-hidden bg-background [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,0_100%)] my-6 flex items-center justify-center">
                <img
                  src={storyItem.imageUrl}
                  alt="Arte para Story"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-secondary text-secondary-foreground p-3 text-left">
                  <Typography
                    as="div"
                    variant="h4"
                    className="text-sm font-bold text-secondary-foreground"
                  >
                    Arte para Story
                  </Typography>
                  <Typography
                    as="div"
                    variant="muted"
                    className="text-xs text-secondary-foreground/90"
                  >
                    Zona segura calibrada para sticker de pedido e mensagens
                  </Typography>
                </div>
              </div>
            </div>

            <Typography variant="muted" className="text-xs pt-2">
              Perfeito para postar todo dia no Status do WhatsApp e nos Stories
              sem tampar o preço.
            </Typography>
          </div>
        </div>
      </div>
    </section>
  );
}
