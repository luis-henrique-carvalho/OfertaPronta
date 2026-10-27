import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Store, ArrowRight } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="w-full bg-background py-5 sm:py-7">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center bg-primary text-primary-foreground [clip-path:polygon(8px_0,100%_0,100%_100%,0_100%,0_8px)]">
            <Store className="size-5" />
          </div>
          <Typography
            variant="h4"
            as="span"
            className="font-extrabold tracking-tight"
          >
            Oferta
            <Typography
              as="span"
              variant="h4"
              className="text-primary font-extrabold tracking-tight"
            >
              Pronta
            </Typography>
          </Typography>
        </div>

        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#segmentos"
            className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out"
          >
            Segmentos
          </a>
          <a
            href="#formatos"
            className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out"
          >
            Formatos
          </a>
          <a
            href="#passos"
            className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out"
          >
            Como funciona
          </a>
          <a
            href="#criar"
            className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out"
          >
            Preço
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            asChild
            className="rounded-none [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)] bg-primary text-primary-foreground font-semibold hover:bg-primary-hover active:scale-[0.98] transition-[transform,background-color] duration-200 ease-out"
          >
            <a href="/criar">
              Gerar prévia grátis
              <ArrowRight className="size-4" data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
