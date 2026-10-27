import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2, Bolt } from "lucide-react";
import {
  SHOWCASE_SEED_CATALOG,
  type ShowcaseCardItem,
} from "@/features/promotions/data/showcase-catalog";
import { cn } from "@/lib/utils";

const HERO_SIMULATOR_ITEM_IDS = [
  "seed-supermarket-03",
  "seed-pizzeria-01",
  "seed-beauty-01",
  "seed-burger-01",
] as const;

export function LandingHeroSection() {
  const simulatorItems = HERO_SIMULATOR_ITEM_IDS.map((id) =>
    SHOWCASE_SEED_CATALOG.find((item) => item.id === id)!,
  ).filter(Boolean);

  const [selectedId, setSelectedId] = useState<string>("seed-supermarket-03");
  const [format, setFormat] = useState<"feed" | "story">("feed");

  const activeItem: ShowcaseCardItem =
    simulatorItems.find((item) => item.id === selectedId) ?? simulatorItems[0];

  return (
    <section className="relative w-full bg-background py-12 lg:py-24 px-4 sm:px-8 overflow-hidden">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left column: Value Proposition & Anti-friction CTA */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <Typography
            variant="h1"
            className="text-left text-[clamp(34px,4.5vw,64px)] font-extrabold leading-[1.04] tracking-[-0.03em] text-foreground mb-6"
          >
            Anúncios que vendem o seu produto hoje, sem perder horas no Canva
            nem pagar agência.
          </Typography>

          <Typography
            variant="lead"
            className="text-left text-base sm:text-[18px] leading-relaxed text-muted-foreground max-w-[42ch] mb-8"
          >
            Digite o nome da oferta e o preço. Em 90 segundos, a IA entrega seu
            card profissional pronto para postar no WhatsApp e Instagram.
          </Typography>

          <Button
            size="lg"
            asChild
            className="h-14 w-full sm:w-auto px-4 sm:px-8 rounded-none [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))] bg-primary text-primary-foreground text-sm sm:text-base font-bold hover:bg-primary-hover active:scale-[0.98] transition-[transform,background-color] duration-200 ease-out"
          >
            <a href="/criar">
              <Bolt className="size-5 shrink-0" data-icon="inline-start" />
              <span>Gerar meu card grátis em 90 segundos</span>
            </a>
          </Button>

          <div className="flex flex-col gap-3 pt-6 w-full">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-secondary shrink-0" />
                <Typography variant="muted" className="text-sm font-medium">
                  Gere a prévia gratuitamente
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-secondary shrink-0" />
                <Typography variant="muted" className="text-sm font-medium">
                  Sem cadastro demorado
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-secondary shrink-0" />
                <Typography variant="muted" className="text-sm font-medium">
                  Pronto para Feed & Story
                </Typography>
              </div>
            </div>

            <Typography
              variant="muted"
              className="pt-2 text-left text-sm font-medium text-muted-foreground"
            >
              Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local
            </Typography>
          </div>
        </div>

        {/* Right column: Chamfered Stage with Live Interactive Simulator */}
        <div className="lg:col-span-6 w-full flex justify-center">
          <div className="w-full max-w-[460px] [clip-path:polygon(72px_0,100%_0,100%_100%,0_100%,0_72px)] bg-primary text-primary-foreground p-5 pt-14 sm:p-8 sm:pt-16 flex flex-col items-center justify-center">
            <div
              data-testid="hero-live-fragment"
              data-ui="hero-live-fragment"
              className="w-full bg-background text-foreground [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,0_100%)] p-4 sm:p-5 flex flex-col gap-4"
            >
              {/* Simulator Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {simulatorItems.map((item) => {
                  const isActive = item.id === selectedId;
                  const label =
                    item.id === "seed-supermarket-03"
                      ? "Açougue"
                      : item.id === "seed-pizzeria-01"
                        ? "Pizzaria"
                        : item.id === "seed-beauty-01"
                          ? "Barbearia"
                          : "Hamburgueria";
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "h-8 px-2.5 text-xs font-semibold rounded-none [clip-path:polygon(4px_0,100%_0,100%_100%,0_100%,0_4px)] transition-[background-color,color] duration-200 ease-out",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>

              {/* Format Toggle Buttons */}
              <div className="flex items-center justify-between gap-2">
                <Typography
                  variant="muted"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Formato do Card:
                </Typography>
                <div className="flex items-center gap-1 bg-muted p-1 [clip-path:polygon(6px_0,100%_0,100%_100%,0_100%,0_6px)]">
                  <Button
                    type="button"
                    data-testid="hero-live-format-feed"
                    size="sm"
                    variant={format === "feed" ? "default" : "ghost"}
                    onClick={() => setFormat("feed")}
                    className={cn(
                      "h-7 px-3 text-xs font-bold rounded-none transition-[background-color,color] duration-200 ease-out",
                      format === "feed"
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-transparent",
                    )}
                  >
                    Feed 4:5
                  </Button>
                  <Button
                    type="button"
                    data-testid="hero-live-format-story"
                    size="sm"
                    variant={format === "story" ? "default" : "ghost"}
                    onClick={() => setFormat("story")}
                    className={cn(
                      "h-7 px-3 text-xs font-bold rounded-none transition-[background-color,color] duration-200 ease-out",
                      format === "story"
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-transparent",
                    )}
                  >
                    Story 9:16
                  </Button>
                </div>
              </div>

              {/* Card Preview Frame */}
              <div className="relative w-full overflow-hidden bg-foreground/5 [clip-path:polygon(0_0,calc(100%-20px)_0,100%_20px,100%_100%,0_100%)] flex items-center justify-center">
                <div
                  className={cn(
                    "relative w-full transition-[max-height,aspect-ratio] duration-300 ease-out motion-reduce:transition-none flex items-center justify-center",
                    format === "feed"
                      ? "aspect-[4/5] max-h-[340px]"
                      : "aspect-[9/16] max-h-[400px]",
                  )}
                >
                  <img
                    key={`${activeItem.id}-${format}`}
                    src={activeItem.imageUrl}
                    alt={activeItem.title}
                    className="w-full h-full object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none"
                  />

                  {/* Chamfered Price Tag */}
                  {activeItem.metadata?.promoPrice ? (
                    <div className="absolute bottom-3 left-3 [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))] bg-primary text-primary-foreground font-black px-3.5 py-1 text-sm sm:text-base">
                      {activeItem.metadata.promoPrice}
                    </div>
                  ) : null}

                  {/* Business name badge */}
                  {activeItem.metadata?.businessName ? (
                    <div className="absolute top-3 left-3 [clip-path:polygon(6px_0,100%_0,100%_100%,0_100%,0_6px)] bg-foreground/90 text-background font-bold px-2.5 py-0.5 text-xs">
                      {activeItem.metadata.businessName}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Card Footer Detail */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <Typography variant="muted" className="text-xs font-medium">
                  {activeItem.title}
                </Typography>
                <Typography
                  variant="muted"
                  className="text-xs font-semibold text-secondary"
                >
                  Pronto para postar
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
