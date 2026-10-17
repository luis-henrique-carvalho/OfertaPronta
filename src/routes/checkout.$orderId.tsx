import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getOrderCheckoutDetailsFn } from "@/features/checkout/server/functions/checkout.functions";
import { CheckoutView } from "@/features/checkout/views";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle, Store, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/checkout/$orderId")({
  loader: async ({ params }) => {
    try {
      const details = await getOrderCheckoutDetailsFn({
        data: { orderId: params.orderId },
      });
      return { details, error: null };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Pedido não encontrado";
      return { details: null, error: message };
    }
  },
  component: CheckoutPageComponent,
});

function CheckoutPageComponent() {
  const { details, error } = Route.useLoaderData();
  const navigate = useNavigate();

  if (error || !details) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
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
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
                <AlertCircle className="size-6" />
              </div>
              <CardTitle className="text-xl font-bold">
                Pedido Não Encontrado
              </CardTitle>
              <CardDescription className="text-xs">
                {error ||
                  "Não conseguimos carregar os dados desta cobrança Pix."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                className="w-full font-bold"
                onClick={() => navigate({ to: "/criar" })}
              >
                <ArrowLeft className="size-4" data-icon="inline-start" />
                <span>Voltar e Criar Nova Oferta</span>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1">
        <CheckoutView
          initialDetails={details}
          onNavigateBack={() => navigate({ to: "/criar" })}
        />
      </main>
      <footer className="border-t border-border bg-card py-6 px-4 text-center">
        <Typography variant="muted" className="text-xs text-muted-foreground">
          © 2026 OfertaPronta • Checkout Seguro Pix Dinâmico
        </Typography>
      </footer>
    </div>
  );
}
