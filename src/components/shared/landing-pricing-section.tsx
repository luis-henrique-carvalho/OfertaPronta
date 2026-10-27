import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";

export function LandingPricingSection() {
  const defaultPlan = getDefaultCampaignPlan();

  return (
    <section
      className="w-full bg-[#fe7141] text-[#000000] py-16 lg:py-24 overflow-x-clip"
      id="criar"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Colunas 1-5: Ancoragem comparativa */}
        <div className="lg:col-span-5 text-left flex flex-col items-start">
          <Typography
            as="h2"
            variant="h2"
            className="text-[clamp(28px,3.2vw,44px)] font-black tracking-[-0.04em] leading-[0.95] text-[#000000] mb-4 taste-enter"
          >
            Preço único por campanha.
          </Typography>
          <Typography
            as="p"
            variant="p"
            className="text-[18px] sm:text-[22px] lg:text-[26px] font-bold leading-[1.15] text-[#000000] mb-4 taste-enter taste-delay-1"
          >
            Visual de agência por uma fração do que você gasta hoje
          </Typography>
          <Typography
            as="p"
            variant="p"
            className="text-base sm:text-lg text-[#000000] leading-relaxed mb-6 taste-enter taste-delay-2"
          >
            Uma agência cobra R$ 150 por arte avulsa e o Canva consome 2 horas
            da sua noite. Aqui você gera a prévia de graça e só paga se aprovar
            o resultado.
          </Typography>
        </div>

        {/* Colunas 6-12: Preço monumental e benefícios */}
        <div className="lg:col-span-7 bg-[#ffffff] text-[#000000] p-6 sm:p-10 lg:p-12 flex flex-col items-start taste-enter taste-delay-3">
          {/* Algarismos monumentais de preço */}
          <div className="flex flex-wrap items-baseline gap-x-2 sm:gap-x-3 mb-2">
            <Typography
              as="span"
              className="text-3xl sm:text-5xl font-black text-[#000000] self-start mt-2"
            >
              {defaultPlan.priceParts.currencySymbol}
            </Typography>
            <Typography
              as="span"
              className="text-[72px] sm:text-[110px] lg:text-[140px] font-black leading-[0.88] tracking-[-0.05em] text-[#000000]"
            >
              {defaultPlan.priceParts.formattedDecimal}
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Typography
              as="p"
              className="text-base sm:text-lg font-bold text-[#000000]"
            >
              / por campanha aprovada (Feed + Story)
            </Typography>
            <span className="bg-[#f0ff1c] text-[#000000] px-2.5 py-1 text-base font-bold">
              Feed + Story
            </span>
          </div>

          <div className="flex flex-col gap-3.5 text-left w-full mb-8">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-[#fe7141] shrink-0 mt-0.5" />
              <Typography
                as="span"
                className="text-base font-medium text-[#000000]"
              >
                Você só paga depois de ver a prévia gerada com marca d&apos;água
              </Typography>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-[#fe7141] shrink-0 mt-0.5" />
              <Typography
                as="span"
                className="text-base font-medium text-[#000000]"
              >
                Download imediato em altíssima definição: Feed (1080×1350) e
                Story (1080×1920)
              </Typography>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-[#fe7141] shrink-0 mt-0.5" />
              <Typography
                as="span"
                className="text-base font-medium text-[#000000]"
              >
                Até {defaultPlan.maxPostPaymentRegenerations} regenerações por
                IA inclusas para ajustar detalhes
              </Typography>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-5 text-[#fe7141] shrink-0 mt-0.5" />
              <Typography
                as="span"
                className="text-base font-medium text-[#000000]"
              >
                Pagamento único via Pix, sem mensalidade e sem cadastrar cartão
              </Typography>
            </div>
          </div>

          <Button
            size="lg"
            asChild
            className="w-full h-14 rounded-none bg-[#000000] px-8 text-base font-black text-[#f0ff1c] hover:bg-[#fe7141] hover:text-[#000000] transition-colors"
          >
            <a
              href="/criar"
              className="inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="size-5 text-[#f0ff1c]" />
              Gerar minha prévia grátis agora
            </a>
          </Button>

          <div className="flex items-center gap-2 pt-4">
            <ShieldCheck className="size-4 text-[#000000] shrink-0" />
            <Typography
              as="p"
              className="text-base font-bold text-[#000000] text-left"
            >
              Zero compromisso: gere a prévia sem pagar nada • Liberação
              instantânea via Pix
            </Typography>
          </div>

          <div className="mt-3 inline-block bg-[#000000] text-[#f0ff1c] px-3.5 py-1.5 text-base font-bold">
            <Typography
              as="span"
              className="text-base font-bold text-[#f0ff1c]"
            >
              Risco Zero: Teste Antes de Pagar
            </Typography>
          </div>
        </div>
      </div>
    </section>
  );
}
