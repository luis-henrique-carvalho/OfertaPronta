import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  SHOWCASE_SEED_CATALOG,
  type ShowcaseCardItem,
} from "@/features/promotions/data/showcase-catalog";
import { cn } from "@/lib/utils";

interface SegmentDefinition {
  id: string;
  title: string;
  description: string;
  seedId: string;
}

const SEGMENTS: readonly SegmentDefinition[] = [
  {
    id: "supermercados",
    title: "Supermercados",
    description:
      "Dia do hortifrúti, ofertas do açougue e encartes de fim de semana com preço bem visível.",
    seedId: "seed-supermarket-01",
  },
  {
    id: "saloes-barbearias",
    title: "Salões & Barbearias",
    description:
      "Combos de corte e barba, progressiva, manicure e promoções para encher a agenda da semana.",
    seedId: "seed-beauty-01",
  },
  {
    id: "pizzarias",
    title: "Pizzarias",
    description:
      "Foto de queijo derretendo, borda recheada e combo família com refrigerante para bombar o delivery.",
    seedId: "seed-pizzeria-01",
  },
  {
    id: "hamburguerias",
    title: "Hamburguerias",
    description:
      "Smash burger na chapa, cheddar cremoso e combos com batata que dão fome só de olhar no celular.",
    seedId: "seed-burger-01",
  },
  {
    id: "restaurantes",
    title: "Restaurantes",
    description:
      "Prato feito do dia, marmitex, executivo e cardápio de almoço pronto antes de abrir as portas.",
    seedId: "seed-restaurant-01",
  },
  {
    id: "comercio-local",
    title: "Comércio Local",
    description:
      "Queima de estoque em lojas de roupa, banho e tosa em pet shop, óticas, farmácias e oficinas.",
    seedId: "seed-retail-01",
  },
] as const;

export function LandingSegmentsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSegment = SEGMENTS[activeIndex] ?? SEGMENTS[0];
  const activeCardItem: ShowcaseCardItem =
    SHOWCASE_SEED_CATALOG.find((item) => item.id === activeSegment.seedId) ??
    SHOWCASE_SEED_CATALOG[0];

  return (
    <section
      className="w-full bg-card-subtle py-20 lg:py-36 px-4 sm:px-8"
      id="segmentos"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 lg:mb-16 text-left">
          <Typography
            variant="h2"
            className="text-left text-[clamp(28px,3.2vw,44px)] font-bold tracking-tight mb-3"
          >
            Pronto para o ritmo do seu balcão
          </Typography>

          <Typography
            variant="muted"
            className="text-left max-w-xl text-base sm:text-[17px] leading-relaxed mb-3"
          >
            Não importa se você vende quilo de alcatra, pizza grande ou corte de
            cabelo: a IA já conhece o visual que dá água na boca e atrai
            clientes no seu ramo.
          </Typography>

          <Typography
            variant="muted"
            className="text-left text-sm font-semibold text-primary"
          >
            Feito para a Rotina do Comércio
          </Typography>
        </div>

        {/* 12-Column Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Columns 1-6: Segment Interactive Index */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {SEGMENTS.map((segment, index) => {
              const isActive = activeIndex === index;
              return (
                <div
                  key={segment.id}
                  className={cn(
                    "flex flex-col gap-1.5 transition-opacity duration-200 ease-out motion-reduce:transition-none text-left",
                    isActive ? "opacity-100" : "opacity-25 hover:opacity-60",
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className="w-full h-auto p-0 justify-start text-left hover:bg-transparent rounded-none"
                  >
                    <Typography
                      variant="h3"
                      className="text-[clamp(22px,2.6vw,36px)] font-extrabold leading-[1.15] tracking-tight text-foreground"
                    >
                      {segment.title}
                    </Typography>
                  </Button>

                  <Typography
                    variant="muted"
                    className={cn(
                      "text-sm sm:text-base leading-relaxed text-muted-foreground",
                      isActive ? "font-medium text-foreground/85" : "",
                    )}
                  >
                    {segment.description}
                  </Typography>
                </div>
              );
            })}
          </div>

          {/* Columns 7-12: Chamfered Stage with Real Seed Card */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full max-w-[440px] [clip-path:polygon(56px_0,100%_0,100%_100%,0_100%,0_56px)] bg-primary/10 p-6 sm:p-10 flex flex-col items-center justify-center">
              <div className="relative w-full aspect-[4/5] max-w-[340px] [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,0_100%)] overflow-hidden bg-background">
                <img
                  key={activeCardItem.id}
                  src={activeCardItem.imageUrl}
                  alt={activeCardItem.title}
                  className="w-full h-full object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none"
                />

                {/* Chamfered Price Tag */}
                {activeCardItem.metadata?.promoPrice ? (
                  <div className="absolute bottom-3 left-3 [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))] bg-primary text-primary-foreground font-black px-3.5 py-1 text-sm sm:text-base">
                    {activeCardItem.metadata.promoPrice}
                  </div>
                ) : null}

                {/* Business Name Badge */}
                {activeCardItem.metadata?.businessName ? (
                  <div className="absolute top-3 left-3 [clip-path:polygon(6px_0,100%_0,100%_100%,0_100%,0_6px)] bg-foreground/90 text-background font-bold px-2.5 py-0.5 text-xs">
                    {activeCardItem.metadata.businessName}
                  </div>
                ) : null}
              </div>

              {/* Card Title & Segment Caption */}
              <div className="w-full max-w-[340px] pt-3 flex items-center justify-between text-xs text-muted-foreground">
                <Typography
                  variant="muted"
                  className="text-xs font-semibold text-foreground"
                >
                  {activeSegment.title}
                </Typography>
                <Typography variant="muted" className="text-xs font-medium">
                  {activeCardItem.title}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
