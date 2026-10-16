import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";

export function LandingStepsSection() {
  return (
    <section
      className="bg-card-subtle px-4 py-16 sm:px-6 border-y border-border"
      id="passos"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-3 bg-card">
            Simples e Direto
          </Badge>
          <Typography variant="h2" className="mb-3">
            Como funciona em 3 passos
          </Typography>
          <Typography variant="muted" className="max-w-md mx-auto">
            Você não precisa de cadastro, cartão de crédito ou tutorial. Só
            preencher e baixar.
          </Typography>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Passo 1 */}
          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                1
              </div>
              <CardTitle className="pt-2">Escolha seu Ramo</CardTitle>
              <CardDescription>
                Supermercado, Salão, Barbearia, Pizzaria, Hamburgueria,
                Restaurante ou Comércio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography variant="muted">
                A IA adapta o vocabulário, placeholders e clima publicitário com
                base no seu nicho.
              </Typography>
            </CardContent>
          </Card>

          {/* Passo 2 */}
          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                2
              </div>
              <CardTitle className="pt-2">Dados & Insumos Visuais</CardTitle>
              <CardDescription>
                Digite o produto, valor e anexe opcionalmente foto do produto ou
                referência.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography variant="muted">
                Se não tiver foto, a IA cria a imagem do zero com iluminação e
                composição profissional.
              </Typography>
            </CardContent>
          </Card>

          {/* Passo 3 */}
          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground font-bold">
                3
              </div>
              <CardTitle className="pt-2">Pix e Download HD</CardTitle>
              <CardDescription>
                Pague R$ 9,90 no Pix e receba os PNGs nítidos sem marca
                d&apos;água em segundos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography variant="muted">
                Confirmação instantânea com direito a até 3 regenerações por IA
                pós-compra.
              </Typography>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
