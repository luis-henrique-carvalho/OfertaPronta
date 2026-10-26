import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { getOrderDeliveryDetailsFn } from "@/features/delivery/server/functions/delivery.functions";
import { OrderDeliveryView } from "@/features/delivery/views";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle, Store, ArrowLeft, CreditCard } from "lucide-react";
import { DeliveryPendingComponent } from "@/features/delivery/components/delivery-pending-card";

export { DeliveryPendingComponent };

export const Route = createFileRoute("/pedido/$orderId")({
  loader: async ({ params }) => {
    try {
      const details = await getOrderDeliveryDetailsFn({
        data: { orderId: params.orderId },
      });
      return { details, error: null, isNotPaid: false };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Pedido não encontrado";

      const isNotPaid =
        message.includes("ORDER_NOT_PAID") ||
        message.includes("não foi confirmado") ||
        message.includes("não foi pago");

      if (isNotPaid) {
        throw redirect({
          to: "/checkout/$orderId",
          params: { orderId: params.orderId },
        });
      }

      return { details: null, error: message, isNotPaid };
    }
  },
  pendingComponent: DeliveryPendingComponent,
  component: DeliveryPageComponent,
});

function DeliveryPageComponent() {
  const { details, error, isNotPaid } = Route.useLoaderData();
  const { orderId } = Route.useParams();
  const navigate = useNavigate();

  if (isNotPaid) {
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
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-2">
                <CreditCard className="size-6" />
              </div>
              <CardTitle className="text-xl font-bold">
                Pagamento Pendente
              </CardTitle>
              <CardDescription className="text-xs">
                As artes em alta resolução sem marca d&apos;água só são
                liberadas após a confirmação do pagamento Pix.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                className="w-full font-bold"
                onClick={() =>
                  navigate({
                    to: "/checkout/$orderId",
                    params: { orderId },
                  })
                }
              >
                <span>Ir para Pagamento Pix</span>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
                {error || "Não conseguimos localizar este pedido de campanha."}
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
        <OrderDeliveryView
          initialDetails={details}
          onNavigateHome={() => navigate({ to: "/criar" })}
        />
      </main>
      <footer className="border-t border-border bg-card py-6 px-4 text-center">
        <Typography variant="muted" className="text-xs text-muted-foreground">
          © 2026 OfertaPronta • Artes Publicitárias Prontas para Postar
        </Typography>
      </footer>
    </div>
  );
}
