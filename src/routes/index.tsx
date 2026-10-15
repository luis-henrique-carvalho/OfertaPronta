import { createFileRoute } from "@tanstack/react-router"
import {
  Utensils,
  Bolt,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  QrCode,
  Layers,
  Smartphone,
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
              <Utensils className="size-5" />
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
              <a href="#criar">
                Criar Arte
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
            {/* Tag de Destaque Gourmet */}
            <Badge
              variant="outline"
              className="mb-5 gap-1.5 rounded-full border-border bg-card px-3.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm"
            >
              <Sparkles className="size-3.5 text-primary" />
              Gastronomia & Delivery Mobile
            </Badge>

            {/* Headline Principal */}
            <Typography variant="h1" className="mb-4">
              Sua promoção impecável para postar, sem complicação de design.
            </Typography>

            {/* Subtítulo */}
            <Typography variant="lead" className="mb-8 max-w-xl">
              Crie artes profissionais para Feed e Story do seu delivery em menos de 90 segundos.
              Basta preencher nome, preço e baixar os dois formatos em alta resolução.
            </Typography>

            {/* Bloco de Ação / CTA */}
            <div className="flex w-full max-w-md flex-col items-center gap-3">
              <Button
                size="lg"
                asChild
                className="w-full h-14 rounded-2xl bg-primary text-base font-bold shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all"
              >
                <a href="#criar" className="gap-2">
                  <Bolt className="size-5" data-icon="inline-start" />
                  Criar promoção agora (R$ 9,90 via Pix)
                </a>
              </Button>

              {/* Selos de Confiança Sálvia */}
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
                    Feed & Story inclusos
                  </Typography>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-secondary" />
                  <Typography variant="muted" className="font-medium">
                    Download HD
                  </Typography>
                </div>
              </div>
            </div>
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
              Pronto para o algoritmo do Instagram
            </Typography>
            <Typography variant="muted" className="max-w-lg mx-auto">
              Cada campanha gera automaticamente as 2 peças nas proporções exatas recomendadas para máximo engajamento.
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
                      Tipografia de impacto e selo de preço em destaque
                    </Typography>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Typography variant="muted" className="text-xs">
                  Perfeito para carrosséis, promoções do dia e cardápio promocional.
                </Typography>
              </CardFooter>
            </Card>

            {/* Card Story */}
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Zap className="size-3.5 text-secondary" />
                    Story & Reels
                  </Badge>
                  <Typography variant="muted" className="text-xs font-semibold">
                    1080 × 1920 px (9:16)
                  </Typography>
                </div>
                <CardTitle className="pt-2">Story com Área de Link</CardTitle>
                <CardDescription>
                  Formatado em tela cheia com respiro inferior seguro para adesivo de link do WhatsApp/iFood.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex aspect-[9/16] max-h-72 w-full items-center justify-center rounded-xl bg-card-subtle border border-dashed border-border p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="size-10 text-secondary" />
                    <Typography variant="h4">Arte para Story</Typography>
                    <Typography variant="muted" className="text-xs">
                      Zona segura calibrada para adesivo de pedido
                    </Typography>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Typography variant="muted" className="text-xs">
                  Ideal para disparar no horário de pico do almoço ou jantar.
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
                Você não precisa de cadastro, senha ou tutorial. Só preencher e baixar.
              </Typography>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {/* Passo 1 */}
              <Card className="rounded-2xl border-border bg-card">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                    1
                  </div>
                  <CardTitle className="pt-2">Dados da Oferta</CardTitle>
                  <CardDescription>
                    Digite o nome do prato, subtítulo e valor promocional.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Typography variant="muted">
                    Sem complicação: nosso sistema ajusta a tipografia automaticamente para caber com elegância.
                  </Typography>
                </CardContent>
              </Card>

              {/* Passo 2 */}
              <Card className="rounded-2xl border-border bg-card">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                    2
                  </div>
                  <CardTitle className="pt-2">Escolha o Tema</CardTitle>
                  <CardDescription>
                    Selecione entre estilos para Hamburgueria, Pizzaria e Delivery.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Typography variant="muted">
                    Veja a prévia em tempo real com marca d&apos;água imediatamente na sua tela.
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
                    Pague R$ 9,90 no Pix e receba os PNGs nítidos em segundos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Typography variant="muted">
                    Confirmação instantânea e links de download com validade segura de 7 dias.
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
                1 design final entregue nos dois formatos: Feed (1080×1350) e Story (1080×1920).
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
                  <Typography variant="muted">QR Code Pix e Copia e Cola</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-secondary shrink-0" />
                  <Typography variant="muted">Download direto em alta qualidade</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-secondary shrink-0" />
                  <Typography variant="muted">Liberação em menos de 10 segundos</Typography>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-0 flex flex-col items-center gap-4">
              <Button
                size="lg"
                asChild
                className="w-full max-w-sm h-14 rounded-2xl bg-primary text-base font-bold shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all"
              >
                <a href="#criar" className="gap-2">
                  <QrCode className="size-5" data-icon="inline-start" />
                  Começar agora sem cadastro
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
              <Utensils className="size-4" />
            </div>
            <Typography variant="muted" className="text-sm font-bold text-foreground">
              OfertaPronta
            </Typography>
          </div>
          <Typography variant="muted" className="text-xs">
            © 2026 OfertaPronta. Feito para pequenos comércios e deliveries.
          </Typography>
        </div>
      </footer>
    </div>
  )
}
