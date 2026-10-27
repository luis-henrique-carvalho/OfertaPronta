import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";

export function LandingPricingSection() {
  const defaultPlan = getDefaultCampaignPlan();

  return (
    <section
      className="px-4 py-16 sm:px-6 max-w-4xl mx-auto text-center"
      id="criar"
    >
      <Card className="rounded-3xl border-border bg-card p-6 sm:p-10 shadow-sm">
        <CardHeader className="p-0 mb-6">
          <Badge variant="secondary" className="mx-auto mb-3">
            Risco Zero: Teste Antes de Pagar
          </Badge>
          <Typography variant="h2" className="mb-2">
            Visual de agência por uma fração do que você gasta hoje
          </Typography>
          <Typography variant="muted" className="max-w-lg mx-auto">
            Uma agência cobra R$ 150 por arte avulsa e o Canva consome 2 horas
            da sua noite. Aqui você gera a prévia de graça e só paga se aprovar
            o resultado.
          </Typography>
        </CardHeader>

        <CardContent className="p-0 mb-8 flex flex-col items-center">
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <Typography variant="muted" className="text-2xl font-semibold">
              {defaultPlan.priceParts.currencySymbol}
            </Typography>
            <Typography
              variant="h1"
              className="text-5xl sm:text-6xl text-primary font-black"
            >
              {defaultPlan.priceParts.formattedDecimal}
            </Typography>
            <Typography variant="muted" className="text-sm">
              / por campanha aprovada (Feed + Story)
            </Typography>
          </div>

          <div className="flex flex-col gap-2.5 text-left max-w-sm w-full">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-secondary shrink-0 mt-0.5" />
              <Typography variant="muted">
                Você só paga depois de ver a prévia gerada com marca d&apos;água
              </Typography>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-secondary shrink-0 mt-0.5" />
              <Typography variant="muted">
                Download imediato em altíssima definição: Feed (1080×1350) e
                Story (1080×1920)
              </Typography>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-secondary shrink-0 mt-0.5" />
              <Typography variant="muted">
                Até {defaultPlan.maxPostPaymentRegenerations} regenerações por
                IA inclusas para ajustar detalhes
              </Typography>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-secondary shrink-0 mt-0.5" />
              <Typography variant="muted">
                Pagamento único via Pix, sem mensalidade e sem cadastrar cartão
              </Typography>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-0 flex flex-col items-center gap-4">
          <Button
            size="lg"
            asChild
            className="w-full max-w-sm h-14 rounded-2xl bg-primary text-base font-bold shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            <a href="/criar" className="gap-2">
              <Sparkles className="size-5" data-icon="inline-start" />
              Gerar minha prévia grátis agora
            </a>
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-secondary" />
            <Typography variant="muted" className="text-xs">
              Zero compromisso: gere a prévia sem pagar nada • Liberação
              instantânea via Pix
            </Typography>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
}
