import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { LandingFooter } from "@/components/shared/landing-footer";
import { LegalPageHeader } from "@/components/shared/legal-page-header";
import { PrivacyDataCards } from "@/components/shared/privacy-data-cards";
import { PrivacyRightsCards } from "@/components/shared/privacy-rights-cards";
import { getCompanyLegalProfile } from "@/lib/legal-company";

export const Route = createFileRoute("/privacidade")({
  component: PoliticaPrivacidadeComponent,
});

function PoliticaPrivacidadeComponent() {
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
              Política de Privacidade
            </Typography>
            <Typography variant="muted" className="text-sm">
              Conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei nº
              13.709/2018) • {profile.legalName}
            </Typography>
            <Typography
              variant="lead"
              className="text-base text-muted-foreground sm:text-lg"
            >
              Sua privacidade e a segurança dos dados do seu negócio são
              prioridades absolutas no OfertaPronta. Conheça como tratamos seus
              dados com transparência e respeito.
            </Typography>
          </div>

          <Separator />

          {/* Seções Estruturadas em Cards */}
          <div className="grid gap-6">
            <PrivacyDataCards profile={profile} />
            <PrivacyRightsCards profile={profile} />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
