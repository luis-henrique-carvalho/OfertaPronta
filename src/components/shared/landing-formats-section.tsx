import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Smartphone, Layers, Zap } from "lucide-react";

export function LandingFormatsSection() {
  return (
    <section className="px-4 py-16 sm:px-6 max-w-5xl mx-auto" id="formatos">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-3">
          2 Formatos em 1 Compra
        </Badge>
        <Typography variant="h2" className="mb-3">
          Pronto para Feed e Stories do Instagram e WhatsApp
        </Typography>
        <Typography variant="muted" className="max-w-lg mx-auto">
          Cada geração cria automaticamente as 2 peças nas proporções
          recomendadas para você postar sem cortes.
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
              Ocupa o espaço vertical máximo na tela do cliente sem cortes feios
              na grade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex aspect-[4/5] max-h-72 w-full items-center justify-center rounded-xl bg-card-subtle border border-dashed border-border p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <Layers className="size-10 text-primary" />
                <Typography variant="h4">Arte para Feed</Typography>
                <Typography variant="muted" className="text-xs">
                  Tipografia comercial de alto impacto e selo de preço em
                  destaque
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
              Formatado em tela cheia com respiro inferior seguro para adesivo
              de link do WhatsApp.
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
              Ideal para disparar no WhatsApp Status e Instagram Stories
              diários.
            </Typography>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
