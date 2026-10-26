import { Store, Sparkles, Loader2 } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function DeliveryPendingComponent() {
  return (
    <div
      data-testid="delivery-pending-loader"
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4" />
            </div>
            <Typography
              variant="h4"
              className="text-base font-extrabold tracking-tight"
            >
              Oferta<span className="text-primary">Pronta</span>
            </Typography>
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border bg-card shadow-sm text-center">
          <CardHeader className="pb-3">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7 animate-pulse text-primary" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Gerando sua arte publicitária com IA...
            </CardTitle>
            <CardDescription className="pt-1 text-xs leading-relaxed text-muted-foreground">
              Estamos criando suas versões em alta resolução para Feed
              (1080×1350) e Story (1080×1920). Isso leva menos de 15 segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              <span>Processando composição visual e formatos...</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export const DeliveryPendingCard = DeliveryPendingComponent;
