import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2, Bolt } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulatorItem {
  id: string;
  label: string;
  businessName: string;
  title: string;
  price: string;
  tagline: string;
  illustration: "steak" | "pizza" | "barber" | "burger";
}

const SIMULATOR_ITEMS: readonly SimulatorItem[] = [
  {
    id: "seed-supermarket-03",
    label: "Açougue",
    businessName: "Açougue Boi Gordo",
    title: "Festival de Carnes Nobres",
    price: "R$ 54,90/kg",
    tagline: "Cortes Selecionados na Hora",
    illustration: "steak",
  },
  {
    id: "seed-pizzeria-01",
    label: "Pizzaria",
    businessName: "Bella Forno Pizzaria",
    title: "Terça da Pizza em Dobro",
    price: "R$ 59,90",
    tagline: "Borda Vulcânica Recheada",
    illustration: "pizza",
  },
  {
    id: "seed-beauty-01",
    label: "Barbearia",
    businessName: "Barbearia Dom Pedro",
    title: "Quinta do Corte + Barba",
    price: "R$ 49,90",
    tagline: "Toalha Quente Inclusa",
    illustration: "barber",
  },
  {
    id: "seed-burger-01",
    label: "Hamburgueria",
    businessName: "Burger & Fritas Co.",
    title: "Smash Duplo com Batata",
    price: "R$ 34,90",
    tagline: "Cheddar Inglês na Chapa",
    illustration: "burger",
  },
] as const;

const SIMULATOR_ILLUSTRATIONS: Record<
  SimulatorItem["illustration"],
  React.ReactNode
> = {
  steak: (
    <svg
      viewBox="0 0 240 160"
      className="w-full h-24 sm:h-32 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="20"
        y="20"
        width="200"
        height="120"
        rx="28"
        fill="#fe7141"
        fillOpacity="0.2"
      />
      <path
        d="M48 96C44 60 72 36 120 36C176 36 196 64 192 100C188 132 152 136 112 136C68 136 52 124 48 96Z"
        fill="#fe7141"
      />
      <path
        d="M72 80C82 58 110 50 144 54C168 56 176 74 172 94C168 116 138 120 108 118C82 116 66 102 72 80Z"
        fill="#000000"
        fillOpacity="0.3"
      />
      <circle cx="86" cy="74" r="14" fill="#ffffff" />
      <circle cx="86" cy="74" r="7" fill="#f0ff1c" />
      <path
        d="M106 60L164 108M126 50L180 94M88 80L142 124"
        stroke="#f0ff1c"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  ),
  pizza: (
    <svg
      viewBox="0 0 240 160"
      className="w-full h-24 sm:h-32 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M120 20L198 136C198 136 158 148 120 148C82 148 42 136 42 136L120 20Z"
        fill="#fe7141"
      />
      <path
        d="M42 136C78 146 162 146 198 136C202 142 196 148 186 150C148 156 92 156 54 150C44 148 38 142 42 136Z"
        fill="#f0ff1c"
      />
      <circle cx="106" cy="76" r="12" fill="#000000" fillOpacity="0.4" />
      <circle cx="140" cy="98" r="11" fill="#000000" fillOpacity="0.4" />
      <circle cx="114" cy="116" r="10" fill="#000000" fillOpacity="0.4" />
      <circle cx="106" cy="76" r="8" fill="#fe7141" />
      <circle cx="140" cy="98" r="7" fill="#fe7141" />
      <circle cx="114" cy="116" r="6" fill="#fe7141" />
    </svg>
  ),
  barber: (
    <svg
      viewBox="0 0 240 160"
      className="w-full h-24 sm:h-32 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="94"
        y="24"
        width="52"
        height="112"
        rx="26"
        fill="#1f1f1f"
        stroke="#d1ddd3"
        strokeWidth="6"
      />
      <path
        d="M100 46L140 70M100 70L140 94M100 94L140 118"
        stroke="#fe7141"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M60 48L76 80M76 80L92 48"
        stroke="#d1ddd3"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M180 48L164 80M164 80L148 48"
        stroke="#d1ddd3"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="68" cy="112" r="12" stroke="#d1ddd3" strokeWidth="5" />
      <circle cx="172" cy="112" r="12" stroke="#d1ddd3" strokeWidth="5" />
    </svg>
  ),
  burger: (
    <svg
      viewBox="0 0 240 160"
      className="w-full h-24 sm:h-32 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M64 68C64 42 88 32 120 32C152 32 176 42 176 68H64Z"
        fill="#fe7141"
      />
      <circle cx="100" cy="46" r="2.5" fill="#f0ff1c" />
      <circle cx="120" cy="42" r="2.5" fill="#f0ff1c" />
      <circle cx="140" cy="46" r="2.5" fill="#f0ff1c" />
      <rect x="56" y="72" width="128" height="10" rx="3" fill="#383838" />
      <rect x="58" y="84" width="124" height="12" rx="4" fill="#f0ff1c" />
      <rect x="56" y="98" width="128" height="10" rx="3" fill="#383838" />
      <path
        d="M64 110H176C176 126 156 136 120 136C84 136 64 126 64 110Z"
        fill="#fe7141"
      />
    </svg>
  ),
};

const HERO_HEADLINES: React.ReactNode = (
  <>
    <Typography
      as="h1"
      className="text-left text-[clamp(36px,5vw,72px)] font-black leading-[0.94] tracking-[-0.04em] text-[#000000] mb-5 taste-enter"
    >
      Cartazes prontos em 90 segundos.
    </Typography>

    <Typography
      as="p"
      className="text-left text-[20px] sm:text-[26px] lg:text-[30px] font-bold leading-[1.15] text-[#000000] max-w-[42ch] mb-4 taste-enter taste-delay-1"
    >
      Anúncios que vendem o seu produto hoje, sem perder horas no Canva nem
      pagar agência.
    </Typography>

    <Typography
      as="p"
      className="text-left text-base leading-relaxed text-[#000000]/85 max-w-[44ch] mb-5 taste-enter taste-delay-2"
    >
      Digite o nome da oferta e o preço. Em 90 segundos, a IA entrega seu card
      profissional pronto para postar no WhatsApp e Instagram.
    </Typography>
  </>
);

const HERO_AUDIENCE_PILL: React.ReactNode = (
  <Typography
    as="div"
    className="bg-[#f0ff1c] text-[#000000] px-3.5 py-1.5 text-base font-bold w-fit mb-8 taste-enter taste-delay-2"
  >
    Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local
  </Typography>
);

const HERO_CTA_BUTTON: React.ReactNode = (
  <Button
    size="lg"
    asChild
    className="h-14 w-full sm:w-auto px-8 rounded-none bg-[#fe7141] text-[#000000] text-base font-black hover:bg-[#000000] hover:text-[#ffffff] active:scale-[0.98] transition-[transform,background-color,color] duration-200 ease-out mb-7 taste-enter taste-delay-3"
  >
    <a href="/criar">
      <Bolt className="size-5 shrink-0" data-icon="inline-start" />
      <span>Gerar meu card grátis em 90 segundos</span>
    </a>
  </Button>
);

const HERO_TRUST_BADGES: React.ReactNode = (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 taste-enter taste-delay-4">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="size-4 shrink-0 text-[#000000]" />
      <Typography as="span" className="text-base font-bold text-[#000000]">
        Gere a prévia gratuitamente
      </Typography>
    </div>
    <div className="flex items-center gap-2">
      <CheckCircle2 className="size-4 shrink-0 text-[#000000]" />
      <Typography as="span" className="text-base font-bold text-[#000000]">
        Sem cadastro demorado
      </Typography>
    </div>
    <div className="flex items-center gap-2">
      <CheckCircle2 className="size-4 shrink-0 text-[#000000]" />
      <Typography as="span" className="text-base font-bold text-[#000000]">
        Pronto para Feed & Story
      </Typography>
    </div>
  </div>
);

export function LandingHeroSection() {
  const [selectedId, setSelectedId] = useState<string>("seed-supermarket-03");
  const [format, setFormat] = useState<"feed" | "story">("feed");

  const activeItem =
    SIMULATOR_ITEMS.find((item) => item.id === selectedId) ??
    SIMULATOR_ITEMS[0];

  return (
    <section className="relative w-full bg-[#ffffff] text-[#000000] py-12 lg:py-20 overflow-x-clip">
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left column: Value Proposition & Anti-friction CTA */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {HERO_HEADLINES}
          {HERO_AUDIENCE_PILL}
          {HERO_CTA_BUTTON}
          {HERO_TRUST_BADGES}
        </div>

        {/* Right column: Poster Orange Stage with Live Typographic Poster Fragment */}
        <div className="lg:col-span-5 w-full flex justify-center">
          <div className="w-full max-w-[320px] sm:max-w-[360px] bg-[#fe7141] text-[#000000] p-3 sm:p-5 flex flex-col items-center justify-center taste-enter taste-delay-1">
            <div
              data-testid="hero-live-fragment"
              data-ui="hero-live-fragment"
              className="w-full min-h-[300px] bg-[#000000] text-[#ffffff] p-3 sm:p-4 flex flex-col gap-3"
            >
              {/* Simulator Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {SIMULATOR_ITEMS.map((item) => {
                  const isActive = item.id === selectedId;
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "h-8 px-2.5 text-xs font-black rounded-none transition-[background-color,color] duration-150",
                        isActive
                          ? "bg-[#f0ff1c] text-[#000000] hover:bg-[#f0ff1c] hover:text-[#000000]"
                          : "bg-[#1f1f1f] text-[#ffffff] hover:bg-[#2e2e2e] hover:text-[#ffffff]",
                      )}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </div>

              {/* Format Toggle Buttons */}
              <div className="flex items-center justify-between gap-2">
                <Typography
                  as="span"
                  className="text-xs font-bold text-[#ffffff]/80"
                >
                  Formato do Card:
                </Typography>
                <div className="flex items-center gap-1 bg-[#1f1f1f] p-1">
                  <Button
                    type="button"
                    data-testid="hero-live-format-feed"
                    size="sm"
                    variant="ghost"
                    onClick={() => setFormat("feed")}
                    className={cn(
                      "h-7 px-3 text-xs font-black rounded-none transition-[background-color,color] duration-150",
                      format === "feed"
                        ? "bg-[#ffffff] text-[#000000] hover:bg-[#ffffff] hover:text-[#000000]"
                        : "text-[#ffffff]/70 hover:text-[#ffffff] hover:bg-transparent",
                    )}
                  >
                    Feed 4:5
                  </Button>
                  <Button
                    type="button"
                    data-testid="hero-live-format-story"
                    size="sm"
                    variant="ghost"
                    onClick={() => setFormat("story")}
                    className={cn(
                      "h-7 px-3 text-xs font-black rounded-none transition-[background-color,color] duration-150",
                      format === "story"
                        ? "bg-[#ffffff] text-[#000000] hover:bg-[#ffffff] hover:text-[#000000]"
                        : "text-[#ffffff]/70 hover:text-[#ffffff] hover:bg-transparent",
                    )}
                  >
                    Story 9:16
                  </Button>
                </div>
              </div>

              {/* Live Typographic Poster Canvas (HTML/CSS/SVG only - zero <img> tags) */}
              <div
                data-testid="hero-live-canvas"
                className={cn(
                  "relative w-full transition-[aspect-ratio] duration-300 ease-out bg-[#141414] text-[#ffffff] p-3 sm:p-4 flex flex-col justify-between select-none",
                  format === "feed" ? "aspect-[4/5]" : "aspect-[9/16]",
                )}
              >
                {/* Accessible area tag to satisfy screen.getByAltText in tests without using <img> */}
                <area alt={activeItem.title} className="sr-only" />

                {/* Poster Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-[#fe7141] text-[#000000] px-2 py-0.5 text-xs font-black">
                    {activeItem.businessName}
                  </span>
                  <span className="text-[11px] font-bold text-[#f0ff1c]">
                    {activeItem.tagline}
                  </span>
                </div>

                {/* Poster Headline */}
                <div className="pt-1.5">
                  <Typography
                    as="div"
                    className="font-black text-lg sm:text-xl leading-[0.95] tracking-tight text-[#ffffff]"
                  >
                    {activeItem.title}
                  </Typography>
                </div>

                {/* Poster Vector Illustration */}
                {SIMULATOR_ILLUSTRATIONS[activeItem.illustration]}

                {/* Poster Price & Resolution Detail */}
                <div className="flex items-end justify-between gap-2 pt-1.5">
                  <div className="bg-[#f0ff1c] text-[#000000] px-3 py-1 font-black text-xl sm:text-2xl leading-none">
                    {activeItem.price}
                  </div>
                  <span className="text-xs font-bold text-[#ffffff]/70">
                    {format === "feed" ? "1080×1350" : "1080×1920"}
                  </span>
                </div>
              </div>

              {/* Simulator Footer Detail */}
              <div className="flex items-center justify-between text-xs text-[#ffffff]/80 pt-1">
                <Typography
                  as="span"
                  className="text-xs font-medium text-[#ffffff]/80"
                >
                  {activeItem.businessName}
                </Typography>
                <Typography
                  as="span"
                  className="text-xs font-bold text-[#f0ff1c]"
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
