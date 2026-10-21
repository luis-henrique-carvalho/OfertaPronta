import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { LandingFooter } from "@/components/shared/landing-footer";
import { LegalPageHeader } from "@/components/shared/legal-page-header";
import { TermsServiceCards } from "@/components/shared/terms-service-cards";
import { TermsPolicyCards } from "@/components/shared/terms-policy-cards";
import { getCompanyLegalProfile } from "@/lib/legal-company";

export const Route = createFileRoute("/termos")({
  component: TermosDeUsoComponent,
});

function TermosDeUsoComponent() {
  const profile = getCompanyLegalProfile();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LegalPageHeader />

      {/* Conteúdo Principal */}
      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Hero da Página */}
          <div className="space-y-3 text-center sm:text-left">
            <Typography
              variant="h1"
              className="text-3xl font-extrabold sm:text-4xl"
            >
              Termos de Uso
            </Typography>
            <Typography variant="muted" className="text-sm">
              Última atualização: 21 de outubro de 2026 • {profile.legalName}
            </Typography>
            <Typography
              variant="lead"
              className="text-base text-muted-foreground sm:text-lg"
            >
              Estes Termos de Uso estabelecem as regras para utilização da
              plataforma OfertaPronta para criação de Cards Publicitários com
              Inteligência Artificial.
            </Typography>
          </div>

          <Separator />

          {/* Seções de Cláusulas em Cards Estruturados */}
          <div className="grid gap-6">
            <TermsServiceCards profile={profile} />
            <TermsPolicyCards profile={profile} />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
