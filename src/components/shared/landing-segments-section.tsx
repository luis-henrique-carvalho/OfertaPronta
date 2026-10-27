import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import {
  ShoppingCart,
  Sparkles,
  Pizza,
  Flame,
  UtensilsCrossed,
  Store,
} from "lucide-react";

export function LandingSegmentsSection() {
  return (
    <section className="px-4 py-16 sm:px-6 max-w-5xl mx-auto" id="segmentos">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-3">
          Feito para a Rotina do Comércio
        </Badge>
        <Typography variant="h2" className="mb-3">
          Pronto para o ritmo do seu balcão
        </Typography>
        <Typography variant="muted" className="max-w-lg mx-auto">
          Não importa se você vende quilo de alcatra, pizza grande ou corte de
          cabelo: a IA já conhece o visual que dá água na boca e atrai clientes
          no seu ramo.
        </Typography>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <ShoppingCart className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Supermercados</CardTitle>
          <CardDescription className="text-xs pt-1">
            Dia do hortifrúti, ofertas do açougue e encartes de fim de semana
            com preço bem visível.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Sparkles className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">
            Salões & Barbearias
          </CardTitle>
          <CardDescription className="text-xs pt-1">
            Combos de corte e barba, progressiva, manicure e promoções para
            encher a agenda da semana.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Pizza className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Pizzarias</CardTitle>
          <CardDescription className="text-xs pt-1">
            Foto de queijo derretendo, borda recheada e combo família com
            refrigerante para bombar o delivery.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Flame className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Hamburguerias</CardTitle>
          <CardDescription className="text-xs pt-1">
            Smash burger na chapa, cheddar cremoso e combos com batata que dão
            fome só de olhar no celular.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <UtensilsCrossed className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Restaurantes</CardTitle>
          <CardDescription className="text-xs pt-1">
            Prato feito do dia, marmitex, executivo e cardápio de almoço pronto
            antes de abrir as portas.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Store className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Comércio Local</CardTitle>
          <CardDescription className="text-xs pt-1">
            Queima de estoque em lojas de roupa, banho e tosa em pet shop,
            óticas, farmácias e oficinas.
          </CardDescription>
        </Card>
      </div>
    </section>
  );
}
