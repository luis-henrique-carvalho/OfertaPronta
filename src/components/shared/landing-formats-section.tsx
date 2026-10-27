import { Typography } from "@/components/ui/typography";
import { Smartphone, Zap } from "lucide-react";

const FORMATS_HEADER: React.ReactNode = (
  <div className="mb-10 text-left">
    <Typography
      as="h2"
      variant="h2"
      className="text-[clamp(28px,3.2vw,44px)] font-black tracking-[-0.04em] leading-[0.95] text-[#000000] mb-3 taste-enter"
    >
      Dois formatos prontos juntos.
    </Typography>
    <Typography
      as="p"
      variant="p"
      className="text-[18px] sm:text-[22px] lg:text-[26px] font-bold leading-[1.15] text-[#000000] max-w-2xl mb-3 taste-enter taste-delay-1"
    >
      Uma única criação entrega o post do Feed e a tela cheia do Story
    </Typography>
    <Typography
      as="p"
      variant="p"
      className="text-base sm:text-lg text-[#000000] max-w-2xl mb-4 leading-relaxed taste-enter taste-delay-2"
    >
      Nada de post cortado pela metade ou letra miúda que ninguém lê no celular.
      Você recebe os dois tamanhos certos para divulgar em todas as redes.
    </Typography>
    <div>
      <Typography
        as="span"
        className="inline-block bg-[#000000] text-[#f0ff1c] px-3.5 py-1.5 text-base font-bold taste-enter taste-delay-2"
      >
        2 Formatos Prontos de Uma Vez
      </Typography>
    </div>
  </div>
);

const FEED_BLUEPRINT: React.ReactNode = (
  <div
    data-ui="format-feed-blueprint"
    className="relative w-full min-h-[320px] bg-[#000000] text-[#ffffff] p-5 sm:p-6 flex flex-col justify-between overflow-hidden my-4"
  >
    <div
      className="absolute inset-0 opacity-15 pointer-events-none"
      aria-hidden="true"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="feed-blueprint-grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="2,4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#feed-blueprint-grid)" />
      </svg>
    </div>

    <div className="relative z-10 flex items-center justify-between text-[13px] bg-[#141414] px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="size-2 bg-[#f0ff1c]" />
        <Typography
          as="span"
          className="font-bold text-[#ffffff] tracking-wide"
        >
          PROPORÇÃO 4:5 RETRATO
        </Typography>
      </div>
      <Typography as="span" className="text-[#f0ff1c] text-xs font-bold">
        1080 × 1350 PX
      </Typography>
    </div>

    <div className="relative z-10 my-4 flex flex-col items-center justify-center text-center p-4 bg-[#141414]">
      <div className="inline-block bg-[#f0ff1c] text-[#000000] px-2.5 py-0.5 text-xs font-black mb-2">
        Oferta do Dia
      </div>
      <Typography
        as="div"
        className="text-xl sm:text-2xl font-black text-[#ffffff] leading-tight mb-2"
      >
        ALCATRA BOVINA
      </Typography>
      <div className="my-2 flex items-center justify-center">
        <svg
          className="size-16 text-[#fe7141]"
          viewBox="0 0 64 64"
          fill="currentColor"
        >
          <path
            d="M12 28 C12 18, 24 12, 38 14 C52 16, 56 26, 54 38 C52 48, 40 54, 26 52 C14 50, 12 40, 12 28 Z"
            opacity="0.8"
          />
          <path
            d="M22 24 C28 22, 36 24, 42 28 C46 31, 44 38, 38 40 C30 42, 22 38, 20 32 C19 28, 20 25, 22 24 Z"
            fill="#ffffff"
            opacity="0.3"
          />
          <circle cx="28" cy="30" r="4" fill="#f0ff1c" />
        </svg>
      </div>
      <div className="mt-1 bg-[#fe7141] text-[#000000] font-black px-4 py-1 text-lg sm:text-xl">
        R$ 49,90/kg
      </div>
    </div>

    <div className="relative z-10 flex items-center justify-between text-xs text-[#ffffff]/70 bg-[#141414] px-3 py-2">
      <Typography as="span" className="text-xs text-[#ffffff]/80">
        Área total: 100% visível no feed
      </Typography>
      <Typography as="span" className="text-xs font-semibold text-[#f0ff1c]">
        Enquadramento perfeito
      </Typography>
    </div>
  </div>
);

const STORY_BLUEPRINT: React.ReactNode = (
  <div
    data-ui="format-story-blueprint"
    className="relative w-full min-h-[320px] bg-[#141414] text-[#ffffff] p-5 sm:p-6 flex flex-col justify-between overflow-hidden my-4"
  >
    <div
      className="absolute inset-0 opacity-15 pointer-events-none"
      aria-hidden="true"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="story-blueprint-grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke="#f0ff1c"
              strokeWidth="1"
              strokeDasharray="2,4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#story-blueprint-grid)" />
      </svg>
    </div>

    <div className="relative z-10 flex items-center justify-between text-[13px] bg-[#000000] px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="size-2 bg-[#fe7141]" />
        <Typography
          as="span"
          className="font-bold text-[#ffffff] tracking-wide"
        >
          TELA CHEIA 9:16 VERTICAL
        </Typography>
      </div>
      <Typography as="span" className="text-[#f0ff1c] text-xs font-bold">
        1080 × 1920 PX
      </Typography>
    </div>

    <div className="relative z-10 my-3 flex flex-col items-center justify-center text-center p-3 bg-[#000000]">
      <div className="inline-block bg-[#fe7141] text-[#000000] px-2.5 py-0.5 text-xs font-black mb-1">
        Só Hoje
      </div>
      <Typography
        as="div"
        className="text-lg sm:text-xl font-black text-[#ffffff] leading-tight mb-1"
      >
        PIZZA GRANDE + REFRI
      </Typography>
      <div className="bg-[#f0ff1c] text-[#000000] font-black px-3 py-0.5 text-base sm:text-lg mb-2">
        R$ 59,90
      </div>
    </div>

    <div className="relative z-10 p-3 bg-[#fe7141] text-[#000000] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Smartphone className="size-4 text-[#000000] shrink-0" />
        <Typography as="span" className="text-xs sm:text-[13px] font-black">
          Espaço Livre para Figurinha de Link
        </Typography>
      </div>
      <div className="bg-[#000000] text-[#f0ff1c] px-2 py-0.5 text-xs font-bold shrink-0">
        Peça no Zap
      </div>
    </div>

    <div className="relative z-10 flex items-center justify-between text-xs text-[#ffffff]/70 bg-[#000000] px-3 py-2">
      <Typography as="span" className="text-xs text-[#ffffff]/80">
        Zona inferior 100% desobstruída
      </Typography>
      <Typography as="span" className="text-xs font-semibold text-[#fe7141]">
        Preço e produto livres
      </Typography>
    </div>
  </div>
);

export function LandingFormatsSection() {
  return (
    <section
      className="w-full bg-[#f0ff1c] text-[#000000] py-16 lg:py-24 overflow-x-clip"
      id="formatos"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        {FORMATS_HEADER}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          {/* Coluna 1: Feed 4:5 */}
          <div className="bg-[#ffffff] text-[#000000] p-6 sm:p-8 lg:p-10 flex flex-col justify-between taste-enter taste-delay-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#000000] text-[#ffffff]">
                  <Smartphone className="size-4" />
                  <Typography
                    as="span"
                    className="text-sm font-bold text-[#ffffff]"
                  >
                    Feed Retrato
                  </Typography>
                </div>
                <Typography
                  as="span"
                  className="text-sm font-bold text-[#000000]"
                >
                  1080 × 1350 px (4:5)
                </Typography>
              </div>

              <Typography
                as="h3"
                variant="h3"
                className="text-[22px] sm:text-[26px] font-black leading-[1.08] text-[#000000] mb-2"
              >
                Post para Feed e Grupos
              </Typography>
              <Typography
                as="p"
                className="text-base text-[#000000] leading-relaxed mb-6"
              >
                Formato retrato que ocupa mais espaço na tela do celular e faz o
                cliente parar de rolar o Instagram.
              </Typography>

              {FEED_BLUEPRINT}
            </div>

            <Typography
              as="p"
              className="text-base font-medium text-[#000000] pt-4"
            >
              Ideal para fixar no perfil da loja e disparar nas listas de
              transmissão do WhatsApp.
            </Typography>
          </div>

          {/* Coluna 2: Story 9:16 */}
          <div className="bg-[#000000] text-[#ffffff] p-6 sm:p-8 lg:p-10 flex flex-col justify-between taste-enter taste-delay-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0ff1c] text-[#000000]">
                  <Zap className="size-4 text-[#000000]" />
                  <Typography
                    as="span"
                    className="text-sm font-bold text-[#000000]"
                  >
                    Story & Status
                  </Typography>
                </div>
                <Typography
                  as="span"
                  className="text-sm font-bold text-[#f0ff1c]"
                >
                  1080 × 1920 px (9:16)
                </Typography>
              </div>

              <Typography
                as="h3"
                variant="h3"
                className="text-[22px] sm:text-[26px] font-black leading-[1.08] text-[#ffffff] mb-2"
              >
                Story e Status com Espaço para Link
              </Typography>
              <Typography
                as="p"
                className="text-base text-[#ffffff]/90 leading-relaxed mb-6"
              >
                Tela cheia vertical com espaço livre na parte de baixo para você
                colar a figurinha do link do seu WhatsApp.
              </Typography>

              {STORY_BLUEPRINT}
            </div>

            <Typography
              as="p"
              className="text-base font-medium text-[#f0ff1c] pt-4"
            >
              Perfeito para postar todo dia no Status do WhatsApp e nos Stories
              sem tampar o preço.
            </Typography>
          </div>
        </div>
      </div>
    </section>
  );
}
