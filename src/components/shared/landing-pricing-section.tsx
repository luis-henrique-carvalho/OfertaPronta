import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2, QrCode, ShieldCheck } from "lucide-react";

export function LandingPricingSection() {
  return (
    <section
      className="px-4 py-16 sm:px-6 max-w-4xl mx-auto text-center"
      id="criar"
    >
      <Card className="rounded-3xl border-border bg-card p-6 sm:p-10 shadow-sm">
        <CardHeader className="p-0 mb-6">
          <Badge variant="secondary" className="mx-auto mb-3">
            Preço Avulso & Justo
          </Badge>
          <Typography variant="h2" className="mb-2">
            Apenas R$ 9,90 por campanha completa
          </Typography>
          <Typography variant="muted" className="max-w-md mx-auto">
            1 card publicitário entregue nos dois formatos: Feed (1080×1350) e
            Story (1080×1920).
          </Typography>
        </CardHeader>

        <CardContent className="p-0 mb-8 flex flex-col items-center">
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <Typography variant="muted" className="text-2xl font-semibold">
              R$
            </Typography>
            <Typography
              variant="h1"
              className="text-5xl sm:text-6xl text-primary font-black"
            >
              9,90
            </Typography>
            <Typography variant="muted" className="text-sm">
              / avulso
            </Typography>
          </div>

          <div className="flex flex-col gap-2.5 text-left max-w-xs w-full">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-secondary shrink-0" />
              <Typography variant="muted">
                Sem mensalidade ou fidelidade
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-secondary shrink-0" />
              <Typography variant="muted">
                QR Code Pix e Copia e Cola instantâneo
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-secondary shrink-0" />
              <Typography variant="muted">
                Download direto em alta resolução
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-secondary shrink-0" />
              <Typography variant="muted">
                Até 3 regenerações por IA inclusas
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
              <QrCode className="size-5" data-icon="inline-start" />
              Criar meu card agora sem cadastro
            </a>
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-secondary" />
            <Typography variant="muted" className="text-xs">
              Pagamento protegido via Pix Dinâmico
            </Typography>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
}
