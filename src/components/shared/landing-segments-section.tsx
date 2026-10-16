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
          Multisegmento Especializado
        </Badge>
        <Typography variant="h2" className="mb-3">
          Feito para o seu tipo de negócio
        </Typography>
        <Typography variant="muted" className="max-w-lg mx-auto">
          A IA adapta automaticamente os elementos gráficos, iluminação, cores e
          tipografia ao perfil exato da sua empresa.
        </Typography>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <ShoppingCart className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Supermercados</CardTitle>
          <CardDescription className="text-xs pt-1">
            Encartes de ofertas, carnes nobres e hortifrúti fresco.
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
            Combos de beleza, corte, barba e estética.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Pizza className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Pizzarias</CardTitle>
          <CardDescription className="text-xs pt-1">
            Forno a lenha, bordas recheadas e combos delivery.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Flame className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Hamburguerias</CardTitle>
          <CardDescription className="text-xs pt-1">
            Smash burgers na chapa, bacon crocante e combos.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <UtensilsCrossed className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Restaurantes</CardTitle>
          <CardDescription className="text-xs pt-1">
            Pratos executivos, marmitas e buffet diário.
          </CardDescription>
        </Card>
        <Card className="rounded-2xl border-border bg-card p-4 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Store className="size-5" />
          </div>
          <CardTitle className="text-sm font-bold">Comércio Local</CardTitle>
          <CardDescription className="text-xs pt-1">
            Moda, óticas, eletrônicos, pet shops e serviços de bairro.
          </CardDescription>
        </Card>
      </div>
    </section>
  );
}
