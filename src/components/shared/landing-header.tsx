import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ArrowRight } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="w-full bg-[#ffffff] text-[#000000] overflow-x-clip">
      <div className="mx-auto flex h-20 w-full max-w-[1360px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <a href="/" className="flex items-center gap-2 sm:gap-3 taste-enter">
          <div className="flex size-7 sm:size-8 items-center justify-center bg-[#fe7141] text-[#000000] font-black text-sm sm:text-base">
            OP
          </div>
          <Typography
            as="span"
            className="font-black text-lg sm:text-2xl tracking-[-0.04em] text-[#000000]"
          >
            OfertaPronta
          </Typography>
        </a>

        <nav className="hidden md:flex items-center gap-7 taste-enter taste-delay-1">
          <a
            href="#segmentos"
            className="text-[15px] font-bold text-[#000000]/75 hover:text-[#000000] transition-[color] duration-200"
          >
            Segmentos
          </a>
          <a
            href="#formatos"
            className="text-[15px] font-bold text-[#000000]/75 hover:text-[#000000] transition-[color] duration-200"
          >
            Formatos
          </a>
          <a
            href="#passos"
            className="text-[15px] font-bold text-[#000000]/75 hover:text-[#000000] transition-[color] duration-200"
          >
            Como funciona
          </a>
          <a
            href="#criar"
            className="text-[15px] font-bold text-[#000000]/75 hover:text-[#000000] transition-[color] duration-200"
          >
            Preço
          </a>
        </nav>

        <div className="flex items-center gap-3 taste-enter taste-delay-2">
          <Button
            asChild
            className="rounded-none bg-[#fe7141] text-[#000000] hover:bg-[#000000] hover:text-[#ffffff] font-black h-9 px-3 text-[13px] sm:h-11 sm:px-5 sm:text-sm transition-[background-color,color] duration-200"
          >
            <a href="/criar">
              Gerar prévia grátis
              <ArrowRight
                className="size-4 hidden sm:inline"
                data-icon="inline-end"
              />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
