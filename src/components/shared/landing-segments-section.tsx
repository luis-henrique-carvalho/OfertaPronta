import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface SegmentDefinition {
  id: string;
  title: string;
  description: string;
  headline: string;
  subheadline: string;
  price: string;
  illustration:
    "market" | "beauty" | "pizza" | "burger" | "restaurant" | "retail";
}

const SEGMENTS: readonly SegmentDefinition[] = [
  {
    id: "supermercados",
    title: "Supermercados",
    description:
      "Dia do hortifrúti, ofertas do açougue e encartes de fim de semana com preço bem visível.",
    headline: "QUARTA DO HORTIFRÚTI & AÇOUGUE",
    subheadline: "Preço baixo direto do produtor no encarte",
    price: "R$ 8,99/kg",
    illustration: "market",
  },
  {
    id: "saloes-barbearias",
    title: "Salões & Barbearias",
    description:
      "Combos de corte e barba, progressiva, manicure e promoções para encher a agenda da semana.",
    headline: "COMBO CORTE + BARBOTERAPIA",
    subheadline: "Agende pelo WhatsApp sem fila na recepção",
    price: "R$ 55,00",
    illustration: "beauty",
  },
  {
    id: "pizzarias",
    title: "Pizzarias",
    description:
      "Foto de queijo derretendo, borda recheada e combo família com refrigerante para bombar o delivery.",
    headline: "PIZZA GRANDE + REFRI 2L GRÁTIS",
    subheadline: "Massa artesanal de fermentação lenta no forno",
    price: "R$ 64,90",
    illustration: "pizza",
  },
  {
    id: "hamburguerias",
    title: "Hamburguerias",
    description:
      "Smash burger na chapa, cheddar cremoso e combos com batata que dão fome só de olhar no celular.",
    headline: "COMBO CHEDDAR BACON EM DOBRO",
    subheadline: "Pão brioche selado com batata rústica",
    price: "R$ 38,90",
    illustration: "burger",
  },
  {
    id: "restaurantes",
    title: "Restaurantes",
    description:
      "Prato feito do dia, marmitex, executivo e cardápio de almoço pronto antes de abrir as portas.",
    headline: "PRATO FEITO & MARMITEX DO DIA",
    subheadline: "Comida caseira quentinha pronta às 11 horas",
    price: "R$ 24,90",
    illustration: "restaurant",
  },
  {
    id: "comercio-local",
    title: "Comércio Local",
    description:
      "Queima de estoque em lojas de roupa, banho e tosa em pet shop, óticas, farmácias e oficinas.",
    headline: "SUPER QUEIMA TOTAL DE ESTOQUE",
    subheadline: "Descontos de até 50% em toda a loja hoje",
    price: "A partir de R$ 19,90",
    illustration: "retail",
  },
] as const;

const SEGMENT_ILLUSTRATIONS: Record<
  SegmentDefinition["illustration"],
  React.ReactNode
> = {
  market: (
    <svg
      viewBox="0 0 240 140"
      className="w-full h-28 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M40 50H200L186 116H54L40 50Z" fill="#222222" />
      <path
        d="M70 50C70 28 92 18 120 18C148 18 170 28 170 50"
        stroke="#f0ff1c"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="86" cy="74" r="14" fill="#fe7141" />
      <circle cx="120" cy="70" r="16" fill="#f0ff1c" />
      <circle cx="154" cy="76" r="14" fill="#d1ddd3" />
    </svg>
  ),
  beauty: (
    <svg
      viewBox="0 0 240 140"
      className="w-full h-28 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="100"
        y="20"
        width="40"
        height="100"
        rx="20"
        fill="#1f1f1f"
        stroke="#d1ddd3"
        strokeWidth="5"
      />
      <path
        d="M104 42L136 64M104 64L136 86M104 86L136 108"
        stroke="#fe7141"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M60 40L80 74M80 74L100 40"
        stroke="#d1ddd3"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M180 40L160 74M160 74L140 40"
        stroke="#d1ddd3"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  ),
  pizza: (
    <svg
      viewBox="0 0 240 140"
      className="w-full h-28 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M120 16L188 116C188 116 154 126 120 126C86 126 52 116 52 116L120 16Z"
        fill="#fe7141"
      />
      <path
        d="M52 116C82 124 158 124 188 116C192 122 184 128 174 130C140 134 100 134 66 130C56 128 48 122 52 116Z"
        fill="#f0ff1c"
      />
      <circle cx="106" cy="64" r="8" fill="#1f1f1f" />
      <circle cx="134" cy="84" r="7" fill="#1f1f1f" />
      <circle cx="112" cy="100" r="7" fill="#1f1f1f" />
    </svg>
  ),
  burger: (
    <svg
      viewBox="0 0 240 140"
      className="w-full h-28 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M70 54C70 32 92 22 120 22C148 22 170 32 170 54H70Z"
        fill="#fe7141"
      />
      <circle cx="100" cy="36" r="2" fill="#f0ff1c" />
      <circle cx="120" cy="32" r="2" fill="#f0ff1c" />
      <circle cx="140" cy="36" r="2" fill="#f0ff1c" />
      <rect x="62" y="58" width="116" height="8" rx="2" fill="#383838" />
      <rect x="64" y="68" width="112" height="10" rx="3" fill="#f0ff1c" />
      <rect x="62" y="80" width="116" height="8" rx="2" fill="#383838" />
      <path
        d="M70 90H170C170 106 150 114 120 114C90 114 70 106 70 90Z"
        fill="#fe7141"
      />
    </svg>
  ),
  restaurant: (
    <svg
      viewBox="0 0 240 140"
      className="w-full h-28 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M60 90C60 52 86 38 120 38C154 38 180 52 180 90H60Z"
        fill="#fe7141"
      />
      <circle cx="120" cy="30" r="6" fill="#f0ff1c" />
      <rect x="48" y="94" width="144" height="10" rx="3" fill="#d1ddd3" />
      <path
        d="M36 40V100M44 40V100"
        stroke="#f0ff1c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M196 40V100M204 40V100"
        stroke="#f0ff1c"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  retail: (
    <svg
      viewBox="0 0 240 140"
      className="w-full h-28 my-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="68" y="44" width="104" height="74" rx="8" fill="#fe7141" />
      <path
        d="M96 44C96 28 106 20 120 20C134 20 144 28 144 44"
        stroke="#f0ff1c"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="94" y="66" width="52" height="26" rx="4" fill="#000000" />
      <path
        d="M106 78H134"
        stroke="#f0ff1c"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export function LandingSegmentsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSegment = SEGMENTS[activeIndex] ?? SEGMENTS[0];

  return (
    <section
      className="w-full bg-[#d1ddd3] text-[#000000] py-10 sm:py-16 lg:py-24 overflow-x-clip"
      id="segmentos"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="mb-12 text-left">
          <Typography
            as="h2"
            className="text-left text-[clamp(28px,3.8vw,52px)] font-black leading-[0.95] tracking-[-0.04em] text-[#000000] mb-4 taste-enter"
          >
            Pronto para o ritmo do seu balcão
          </Typography>

          <Typography
            as="p"
            className="text-left max-w-2xl text-base sm:text-lg leading-relaxed text-[#000000]/85 mb-4 taste-enter taste-delay-1"
          >
            Não importa se você vende quilo de alcatra, pizza grande ou corte de
            cabelo: a IA já conhece o visual que dá água na boca e atrai
            clientes no seu ramo.
          </Typography>

          <Typography
            as="div"
            className="bg-[#000000] text-[#ffffff] px-3.5 py-1.5 text-base font-bold w-fit mb-8 taste-enter taste-delay-2"
          >
            Feito para a Rotina do Comércio
          </Typography>
        </div>

        {/* 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Columns 1-7: Segment List with Complete Counter Narratives */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {SEGMENTS.map((segment, index) => {
              const isActive = activeIndex === index;
              return (
                <div
                  key={segment.id}
                  className={cn(
                    "p-4 sm:p-5 transition-[background-color,color] duration-150 text-left cursor-pointer taste-enter",
                    isActive
                      ? "bg-[#000000] text-[#ffffff]"
                      : "bg-[#ffffff]/60 text-[#000000] hover:bg-[#ffffff]/90",
                  )}
                  onClick={() => setActiveIndex(index)}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveIndex(index)}
                    className="w-full h-auto p-0 justify-start text-left hover:bg-transparent rounded-none"
                  >
                    <Typography
                      as="h3"
                      className={cn(
                        "text-[clamp(20px,2.4vw,28px)] font-black leading-[1.1] tracking-tight",
                        isActive ? "text-[#f0ff1c]" : "text-[#000000]",
                      )}
                    >
                      {segment.title}
                    </Typography>
                  </Button>

                  <Typography
                    as="p"
                    className={cn(
                      "text-base leading-relaxed pt-2",
                      isActive
                        ? "font-medium text-[#f4f4f4]"
                        : "text-[#000000]/80",
                    )}
                  >
                    {segment.description}
                  </Typography>
                </div>
              );
            })}
          </div>

          {/* Columns 8-12: Live HTML/SVG Poster Specimen (zero <img> tags, zero sticky) */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div
              data-ui="segment-specimen"
              className="w-full min-h-[460px] bg-[#000000] text-[#ffffff] p-6 sm:p-7 flex flex-col justify-between taste-enter taste-delay-2"
            >
              {/* Specimen Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="bg-[#f0ff1c] text-[#000000] text-xs font-black px-2.5 py-1">
                  {activeSegment.title}
                </span>
                <span className="text-xs font-bold text-[#d1ddd3]">
                  Feed 1080×1350 • 4:5
                </span>
              </div>

              {/* Specimen Headline & Sub */}
              <div className="pt-3">
                <Typography
                  as="div"
                  className="font-black text-2xl sm:text-3xl leading-[0.95] tracking-tight text-[#ffffff]"
                >
                  {activeSegment.headline}
                </Typography>
                <Typography
                  as="p"
                  className="text-xs sm:text-sm font-medium text-[#d1ddd3] pt-1.5"
                >
                  {activeSegment.subheadline}
                </Typography>
              </div>

              {/* Vector Artwork */}
              {SEGMENT_ILLUSTRATIONS[activeSegment.illustration]}

              {/* Price Tag & Anatomy Details */}
              <div className="flex items-end justify-between gap-2 pt-3">
                <div className="bg-[#fe7141] text-[#000000] px-3.5 py-1.5 font-black text-2xl sm:text-3xl leading-none">
                  {activeSegment.price}
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-[#f0ff1c]">
                    Pronto para WhatsApp & Instagram
                  </div>
                  <div className="text-[11px] font-medium text-[#ffffff]/70">
                    Resolução 1080×1350 px
                  </div>
                </div>
              </div>

              {/* Anatomy Annotations Footer */}
              <div className="pt-3 flex items-center justify-between text-xs text-[#ffffff]/60">
                <span>Contraste comercial balcão</span>
                <span className="text-[#f0ff1c] font-bold">
                  100% IA Integrada
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
