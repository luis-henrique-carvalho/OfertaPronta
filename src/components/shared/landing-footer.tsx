import { Store, MessageCircle, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { getCompanyLegalProfile } from "@/lib/legal-company";

export function LandingFooter() {
  const profile = getCompanyLegalProfile();

  return (
    <footer className="border-t border-border bg-card py-10 px-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {/* Linha superior: Marca e Links de Navegação */}
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start gap-2 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Store className="size-4" />
              </div>
              <Typography
                variant="h4"
                className="text-base font-bold text-foreground"
              >
                {profile.tradeName}
              </Typography>
            </div>
            <Typography variant="muted" className="text-xs leading-relaxed">
              Cards publicitários profissionais gerados por IA para Instagram e
              WhatsApp. R$ 9,90 avulso via Pix, sem cadastro.
            </Typography>
          </div>

          {/* Links Institucionais e Suporte */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:justify-end sm:gap-6">
            <a
              href="/termos"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Typography
                as="span"
                variant="muted"
                className="hover:text-foreground"
              >
                Termos de Uso
              </Typography>
            </a>
            <a
              href="/privacidade"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Typography
                as="span"
                variant="muted"
                className="hover:text-foreground"
              >
                Política de Privacidade
              </Typography>
            </a>
            <a
              href={profile.supportWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-[#25D366]"
            >
              <MessageCircle className="size-3.5" />
              <Typography
                as="span"
                variant="muted"
                className="hover:text-[#25D366]"
              >
                Suporte WhatsApp
              </Typography>
            </a>
            <a
              href={`mailto:${profile.contactEmail}`}
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-3.5" />
              <Typography
                as="span"
                variant="muted"
                className="hover:text-foreground"
              >
                {profile.contactEmail}
              </Typography>
            </a>
          </div>
        </div>

        <Separator />

        {/* Linha inferior: Dados cadastrais legais e Direitos Reservados */}
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <Typography variant="muted" className="text-xs">
            {profile.legalName} • CNPJ: {profile.cnpj} •{" "}
            {profile.addressCityState}
          </Typography>
          <Typography variant="muted" className="text-xs">
            © 2026 {profile.tradeName}. Todos os direitos reservados.
          </Typography>
        </div>
      </div>
    </footer>
  );
}
