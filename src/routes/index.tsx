import { createFileRoute } from "@tanstack/react-router"
import {
  Store,
  Bolt,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  QrCode,
  Layers,
  Smartphone,
  ShoppingCart,
  Pizza,
  Flame,
  UtensilsCrossed,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Typography } from "@/components/ui/typography"

export const Route = createFileRoute("/")({
  component: LandingPageComponent,
})

function LandingPageComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Store className="size-5" />
            </div>
            <Typography variant="h4" className="font-extrabold tracking-tight">
              Oferta<span className="text-primary">Pronta</span>
            </Typography>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs">
              {/* shadcn-ignore: live status indicator */}
              <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
              Sem cadastro
            </Badge>
            <Button size="sm" asChild className="rounded-full font-semibold">
              <a href="/criar">
                Criar Card com IA
                <ArrowRight className="size-4" data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-20 text-center">
          <div className="mx-auto flex max-w-3xl flex-col items-center">
            {/* Tag de Destaque Multisegmento */}
            <Badge
              variant="outline"
              className="mb-5 gap-1.5 rounded-full border-border bg-card px-3.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm"
            >
              <Sparkles className="size-3.5 text-primary" />
              IA Multimodal para Microempresários & Comércio Local
            </Badge>

            {/* Headline Principal */}
            <Typography variant="h1" className="mb-4">
              Seu Card Publicitário gerado por IA e pronto para postar.
            </Typography>

            {/* Subtítulo */}
            <Typography variant="lead" className="mb-8 max-w-xl">
              Crie artes profissionais para Supermercados, Salões, Barbearias, Pizzarias, Hamburguerias, Restaurantes e Comércio Local em menos de 90 segundos.
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
                  Criar meu card agora (R$ 9,90 via Pix)
                </a>
              </Button>

              {/* Selos de Confiança */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-secondary" />
                  <Typography variant="muted" className="font-medium">
                    Sem mensalidade
                  </Typography>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-secondary" />
                  <Typography variant="muted" className="font-medium">
                    Feed (4:5) & Story (9:16)
                  </Typography>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-secondary" />
                  <Typography variant="muted" className="font-medium">
                    Download HD sem marca d&apos;água
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator className="mx-auto max-w-5xl" />

        {/* 6 Segmentos Comerciais Atendidos */}
        <section className="px-4 py-16 sm:px-6 max-w-5xl mx-auto" id="segmentos">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              Multisegmento Especializado
            </Badge>
            <Typography variant="h2" className="mb-3">
              Feito para o seu tipo de negócio
            </Typography>
            <Typography variant="muted" className="max-w-lg mx-auto">
              A IA adapta automaticamente os elementos gráficos, iluminação, cores e tipografia ao perfil exato da sua empresa.
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
              <CardTitle className="text-sm font-bold">Salões & Barbearias</CardTitle>
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

        <Separator className="mx-auto max-w-5xl" />

        {/* Formatos e Vitrine Section */}
        <section className="px-4 py-16 sm:px-6 max-w-5xl mx-auto" id="formatos">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              2 Formatos em 1 Compra
            </Badge>
            <Typography variant="h2" className="mb-3">
              Pronto para Feed e Stories do Instagram e WhatsApp
            </Typography>
            <Typography variant="muted" className="max-w-lg mx-auto">
              Cada geração cria automaticamente as 2 peças nas proporções recomendadas para você postar sem cortes.
            </Typography>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Card Feed */}
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Smartphone className="size-3.5" />
                    Feed Retrato
                  </Badge>
                  <Typography variant="muted" className="text-xs font-semibold">
                    1080 × 1350 px (4:5)
                  </Typography>
                </div>
                <CardTitle className="pt-2">Post no Feed Principal</CardTitle>
                <CardDescription>
                  Ocupa o espaço vertical máximo na tela do cliente sem cortes feios na grade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex aspect-[4/5] max-h-72 w-full items-center justify-center rounded-xl bg-card-subtle border border-dashed border-border p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Layers className="size-10 text-primary" />
                    <Typography variant="h4">Arte para Feed</Typography>
                    <Typography variant="muted" className="text-xs">
                      Tipografia comercial de alto impacto e selo de preço em destaque
                    </Typography>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Typography variant="muted" className="text-xs">
                  Perfeito para carrosséis, promoções semanais e ofertas relâmpago.
                </Typography>
              </CardFooter>
            </Card>

            {/* Card Story */}
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Zap className="size-3.5 text-secondary" />
                    Story & Status
                  </Badge>
                  <Typography variant="muted" className="text-xs font-semibold">
                    1080 × 1920 px (9:16)
                  </Typography>
                </div>
                <CardTitle className="pt-2">Story com Área de Link</CardTitle>
                <CardDescription>
                  Formatado em tela cheia com respiro inferior seguro para adesivo de link do WhatsApp.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex aspect-[9/16] max-h-72 w-full items-center justify-center rounded-xl bg-card-subtle border border-dashed border-border p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="size-10 text-secondary" />
                    <Typography variant="h4">Arte para Story</Typography>
                    <Typography variant="muted" className="text-xs">
                      Zona segura calibrada para sticker de pedido e mensagens
                    </Typography>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Typography variant="muted" className="text-xs">
                  Ideal para disparar no WhatsApp Status e Instagram Stories diários.
                </Typography>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Passo a Passo Section */}
        <section className="bg-card-subtle px-4 py-16 sm:px-6 border-y border-border" id="passos">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-3 bg-card">
                Simples e Direto
              </Badge>
              <Typography variant="h2" className="mb-3">
                Como funciona em 3 passos
              </Typography>
              <Typography variant="muted" className="max-w-md mx-auto">
                Você não precisa de cadastro, cartão de crédito ou tutorial. Só preencher e baixar.
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
                    Supermercado, Salão, Barbearia, Pizzaria, Hamburgueria, Restaurante ou Comércio.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Typography variant="muted">
                    A IA adapta o vocabulário, placeholders e clima publicitário com base no seu nicho.
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
                    Digite o produto, valor e anexe opcionalmente foto do produto ou referência.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Typography variant="muted">
                    Se não tiver foto, a IA cria a imagem do zero com iluminação e composição profissional.
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
                    Pague R$ 9,90 no Pix e receba os PNGs nítidos sem marca d&apos;água em segundos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Typography variant="muted">
                    Confirmação instantânea com direito a até 3 regenerações por IA pós-compra.
                  </Typography>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing / CTA Section */}
        <section className="px-4 py-16 sm:px-6 max-w-4xl mx-auto text-center" id="criar">
          <Card className="rounded-3xl border-border bg-card p-6 sm:p-10 shadow-sm">
            <CardHeader className="p-0 mb-6">
              <Badge variant="secondary" className="mx-auto mb-3">
                Preço Avulso & Justo
              </Badge>
              <Typography variant="h2" className="mb-2">
                Apenas R$ 9,90 por campanha completa
              </Typography>
              <Typography variant="muted" className="max-w-md mx-auto">
                1 card publicitário entregue nos dois formatos: Feed (1080×1350) e Story (1080×1920).
              </Typography>
            </CardHeader>

            <CardContent className="p-0 mb-8 flex flex-col items-center">
              <div className="flex items-baseline justify-center gap-1 mb-4">
                <Typography variant="muted" className="text-2xl font-semibold">
                  R$
                </Typography>
                <Typography variant="h1" className="text-5xl sm:text-6xl text-primary font-black">
                  9,90
                </Typography>
                <Typography variant="muted" className="text-sm">
                  / avulso
                </Typography>
              </div>

              <div className="flex flex-col gap-2.5 text-left max-w-xs w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-secondary shrink-0" />
                  <Typography variant="muted">Sem mensalidade ou fidelidade</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-secondary shrink-0" />
                  <Typography variant="muted">QR Code Pix e Copia e Cola instantâneo</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-secondary shrink-0" />
                  <Typography variant="muted">Download direto em alta resolução</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-secondary shrink-0" />
                  <Typography variant="muted">Até 3 regenerações por IA inclusas</Typography>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4" />
            </div>
            <Typography variant="muted" className="text-sm font-bold text-foreground">
              OfertaPronta
            </Typography>
          </div>
          <Typography variant="muted" className="text-xs">
            © 2026 OfertaPronta. Feito para microempresários de supermercados, salões, barbearias, pizzarias, hamburguerias, restaurantes e comércio local.
          </Typography>
        </div>
      </footer>
    </div>
  )
}
