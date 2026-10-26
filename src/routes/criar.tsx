import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { OfferCreationWizard } from "@/features/promotions/components/offer-creation-wizard";
import { CreationHeader } from "@/features/promotions/components/wizard/creation-header";
import { Typography } from "@/components/ui/typography";

export const Route = createFileRoute("/criar")({
  component: CriarPageComponent,
});

function CriarPageComponent() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Header Mobile-First com Botão de Ajuda WhatsApp */}
      <CreationHeader />

      {/* Main Content: Fluxo Oficial em Micro-Passos com Rodapé Fixo */}
      <main className="flex-1">
        <OfferCreationWizard
          onNavigateToCheckout={(orderId) => {
            navigate({
              to: "/checkout/$orderId",
              params: { orderId },
            });
          }}
        />
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-border bg-card py-6 px-4 text-center">
        <Typography variant="muted" className="text-xs text-muted-foreground">
          © 2026 OfertaPronta • Card Publicitário nos formatos Feed (4:5) e
          Story (9:16)
        </Typography>
      </footer>
    </div>
  );
}
