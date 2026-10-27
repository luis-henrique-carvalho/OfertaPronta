import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";

export function LandingPricingSection() {
  const defaultPlan = getDefaultCampaignPlan();

  return (
    <section
      className="bg-card-subtle min-h-[80svh] flex items-center py-20 lg:py-36 px-4 sm:px-8"
      id="criar"
    >
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* Colunas 1-4: Ancoragem comparativa */}
        <div className="lg:col-span-4 text-left">
          <Typography
            variant="h2"
            className="text-left text-[clamp(28px,2.8vw,36px)] font-bold tracking-tight mb-4"
          >
            Visual de agência por uma fração do que você gasta hoje
          </Typography>
          <Typography
            variant="muted"
            className="text-left text-[17px] leading-relaxed mb-4"
          >
            Uma agência cobra R$ 150 por arte avulsa e o Canva consome 2 horas
            da sua noite. Aqui você gera a prévia de graça e só paga se aprovar
            o resultado.
          </Typography>
          <div className="inline-flex items-center px-3 py-1.5 bg-secondary text-secondary-foreground [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]">
            <Typography
              as="span"
              variant="muted"
              className="text-xs font-bold text-secondary-foreground"
            >
              Risco Zero: Teste Antes de Pagar
            </Typography>
          </div>
        </div>

        {/* Colunas 6-12: Preço monumental e benefícios */}
        <div className="lg:col-start-6 lg:col-span-7 text-left flex flex-col items-start">
          <div className="relative inline-flex flex-wrap items-baseline gap-x-3 mb-8">
            <Typography
              as="span"
              variant="muted"
              className="text-[clamp(44px,6vw,88px)] font-extrabold leading-none text-foreground self-start mt-2"
            >
              {defaultPlan.priceParts.currencySymbol}
            </Typography>
            <Typography
              as="span"
              variant="h2"
              className="text-[34vw] sm:text-[clamp(120px,16vw,220px)] font-black leading-[0.85] tracking-[-0.04em] text-primary"
            >
              {defaultPlan.priceParts.formattedDecimal}
            </Typography>
            <div className="absolute -top-3 right-0 translate-x-1/4 bg-foreground text-background px-3 py-1 [clip-path:polygon(8px_0,100%_0,100%_100%,0_100%,0_8px)]">
              <Typography
                as="span"
                variant="muted"
                className="text-xs font-bold text-background"
              >
                Feed + Story
              </Typography>
            </div>
            <Typography
              as="span"
              variant="muted"
              className="text-base sm:text-[18px] font-medium text-muted-foreground ml-1"
            >
              / por campanha aprovada (Feed + Story)
            </Typography>
          </div>

          <div className="flex flex-col gap-3 text-left w-full mb-8">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-secondary shrink-0 mt-0.5" />
              <Typography
                variant="muted"
                className="text-base text-foreground/90"
              >
                Você só paga depois de ver a prévia gerada com marca d&apos;água
              </Typography>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-secondary shrink-0 mt-0.5" />
              <Typography
                variant="muted"
                className="text-base text-foreground/90"
              >
                Download imediato em altíssima definição: Feed (1080×1350) e
                Story (1080×1920)
              </Typography>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-secondary shrink-0 mt-0.5" />
              <Typography
                variant="muted"
                className="text-base text-foreground/90"
              >
                Até {defaultPlan.maxPostPaymentRegenerations} regenerações por
                IA inclusas para ajustar detalhes
              </Typography>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-secondary shrink-0 mt-0.5" />
              <Typography
                variant="muted"
                className="text-base text-foreground/90"
              >
                Pagamento único via Pix, sem mensalidade e sem cadastrar cartão
              </Typography>
            </div>
          </div>

          <Button
            size="lg"
            asChild
            className="w-full sm:w-auto h-14 px-10 rounded-none [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))] bg-primary text-primary-foreground text-base font-bold hover:bg-primary-hover active:scale-[0.98] transition-[transform,background-color] duration-200 ease-out"
          >
            <a href="/criar" className="inline-flex items-center gap-2">
              <Sparkles className="size-5" />
              Gerar minha prévia grátis agora
            </a>
          </Button>

          <div className="flex items-center gap-2 pt-4">
            <ShieldCheck className="size-4 text-secondary shrink-0" />
            <Typography variant="muted" className="text-xs text-left">
              Zero compromisso: gere a prévia sem pagar nada • Liberação
              instantânea via Pix
            </Typography>
          </div>
        </div>
      </div>
    </section>
  );
}
