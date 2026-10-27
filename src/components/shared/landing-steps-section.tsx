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
            Simples do Início ao Fim
          </Badge>
          <Typography variant="h2" className="mb-3">
            Da sua ideia para o WhatsApp dos clientes em 3 passos
          </Typography>
          <Typography variant="muted" className="max-w-md mx-auto">
            Tudo direto pelo celular, sem criar conta e sem mexer em ferramentas
            complicadas de edição.
          </Typography>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Passo 1 */}
          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                1
              </div>
              <CardTitle className="pt-2">Descreva sua promoção</CardTitle>
              <CardDescription>
                Escolha o ramo do seu negócio, digite a oferta e o preço que vai
                anunciar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography variant="muted">
                Tem foto do produto no celular? Pode enviar junto. Se não tiver,
                a própria IA cria o cenário e a imagem para você.
              </Typography>
            </CardContent>
          </Card>

          {/* Passo 2 */}
          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                2
              </div>
              <CardTitle className="pt-2">A IA monta o card na hora</CardTitle>
              <CardDescription>
                Em menos de 90 segundos, seu anúncio fica pronto com iluminação,
                cores e preço em destaque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography variant="muted">
                Você confere a prévia completa na tela gratuitamente antes de
                tomar qualquer decisão.
              </Typography>
            </CardContent>
          </Card>

          {/* Passo 3 */}
          <Card className="rounded-2xl border-border bg-card">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground font-bold">
                3
              </div>
              <CardTitle className="pt-2">
                Baixe em alta definição e poste
              </CardTitle>
              <CardDescription>
                Gostou do resultado? Libere os arquivos sem marca d&apos;água e
                publique no WhatsApp e Instagram.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography variant="muted">
                Você já recebe as duas versões prontas (Feed e Story) para
                mandar nos grupos e atrair pedidos no mesmo minuto.
              </Typography>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
