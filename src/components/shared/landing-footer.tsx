import {
  Store,
  MessageCircle,
  Mail,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { getCompanyLegalProfile } from "@/lib/legal-company";

export function LandingFooter() {
  const profile = getCompanyLegalProfile();

  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-sm pt-12 pb-8 px-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {/* Bloco Superior: Marca e Colunas de Navegação */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-12 sm:gap-6">
          {/* Coluna 1: Identidade da Marca (5 cols desktop) */}
          <div className="flex flex-col gap-3 sm:col-span-5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Store className="size-4" />
              </div>
              <Typography
                variant="h4"
                className="text-base font-extrabold tracking-tight text-foreground"
              >
                Oferta<span className="text-primary">Pronta</span>
              </Typography>
            </div>
            <Typography
              variant="muted"
              className="text-xs leading-relaxed max-w-sm"
            >
              Cards publicitários profissionais gerados por IA para Instagram e
              WhatsApp em menos de 90 segundos. R$ 9,90 avulso via Pix, sem
              mensalidade ou cadastro.
            </Typography>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3.5 shrink-0" />
              <span>Ambiente Seguro • Pix Dinâmico</span>
            </div>
          </div>

          {/* Coluna 2: Navegação Institucional & Legal (4 cols desktop, 6 mobile) */}
          <div className="flex flex-col gap-2.5 sm:col-span-4 text-left">
            <Typography
              variant="muted"
              className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-1"
            >
              Documentos Legais
            </Typography>
            <nav className="flex flex-col gap-2 text-xs">
              <a
                href="/termos"
                className="group inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <FileText className="size-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                <Typography
                  as="span"
                  variant="muted"
                  className="hover:text-foreground text-xs"
                >
                  Termos de Uso
                </Typography>
              </a>
              <a
                href="/privacidade"
                className="group inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ShieldCheck className="size-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                <Typography
                  as="span"
                  variant="muted"
                  className="hover:text-foreground text-xs"
                >
                  Política de Privacidade
                </Typography>
              </a>
            </nav>
          </div>

          {/* Coluna 3: Atendimento & Suporte (3 cols desktop, 6 mobile) */}
          <div className="flex flex-col gap-2.5 sm:col-span-3 text-left">
            <Typography
              variant="muted"
              className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-1"
            >
              Atendimento
            </Typography>
            <nav className="flex flex-col gap-2 text-xs">
              <a
                href={profile.supportWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="size-3" />
                </div>
                <div className="flex flex-col">
                  <Typography
                    as="span"
                    variant="muted"
                    className="hover:text-[#25D366] text-xs font-medium"
                  >
                    Suporte WhatsApp
                  </Typography>
                </div>
              </a>
              <a
                href={`mailto:${profile.contactEmail}`}
                className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="size-3" />
                </div>
                <Typography
                  as="span"
                  variant="muted"
                  className="hover:text-foreground text-xs"
                >
                  {profile.contactEmail}
                </Typography>
              </a>
            </nav>
          </div>
        </div>

        {/* Faixa Fiscal & Legal (CDC / Decreto 7.962/2013) */}
        <Card className="border-border/60 bg-muted/30 shadow-none text-left">
          <CardContent className="p-3.5 sm:p-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <Typography variant="muted" className="text-[11px] leading-relaxed">
              <strong className="font-semibold text-foreground/80">
                {profile.legalName}
              </strong>{" "}
              • CNPJ: {profile.cnpj} • {profile.addressCityState}
            </Typography>
            <Typography
              variant="muted"
              className="text-[11px] shrink-0 text-muted-foreground/80"
            >
              Compra avulsa sob demanda • Entrega imediata
            </Typography>
          </CardContent>
        </Card>

        <Separator className="opacity-60" />

        {/* Linha Inferior: Direitos Autorais e Créditos */}
        <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <Typography variant="muted" className="text-xs text-muted-foreground">
            © 2026 {profile.tradeName}. Todos os direitos reservados.
          </Typography>
          <Typography
            variant="muted"
            className="text-[11px] text-muted-foreground/70"
          >
            Formatos inclusos: Feed 1080×1350 e Story 1080×1920
          </Typography>
        </div>
      </div>
    </footer>
  );
}
