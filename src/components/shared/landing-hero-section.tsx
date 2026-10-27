import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Sparkles, Bolt, CheckCircle2 } from "lucide-react";

export function LandingHeroSection() {
  return (
    <section className="relative px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-20 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        {/* Tag de Destaque Multisegmento */}
        <Badge
          variant="outline"
          className="mb-5 gap-1.5 rounded-full border-border bg-card px-3.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm"
        >
          <Sparkles className="size-3.5 text-primary" />
          Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local
        </Badge>

        {/* Headline Principal */}
        <Typography variant="h1" className="mb-4">
          Anúncios que vendem o seu produto hoje, sem perder horas no Canva nem
          pagar agência.
        </Typography>

        {/* Subtítulo */}
        <Typography variant="lead" className="mb-8 max-w-xl">
          Digite o nome da oferta e o preço. Em 90 segundos, a IA entrega seu
          card profissional pronto para postar no WhatsApp e Instagram.
        </Typography>

        {/* Bloco de Ação / CTA */}
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <Button
            size="lg"
            asChild
            className="w-full h-14 rounded-2xl bg-primary text-base font-bold shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            <a href="/criar" className="gap-2">
              <Bolt className="size-5" data-icon="inline-start" />
              Gerar meu card grátis em 90 segundos
            </a>
          </Button>

          {/* Selos de Confiança */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-secondary" />
              <Typography variant="muted" className="font-medium">
                Gere a prévia gratuitamente
              </Typography>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-secondary" />
              <Typography variant="muted" className="font-medium">
                Sem cadastro demorado
              </Typography>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-secondary" />
              <Typography variant="muted" className="font-medium">
                Pronto para Feed & Story
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
