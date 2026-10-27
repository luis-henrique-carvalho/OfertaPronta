import {
  Store,
  MessageCircle,
  Mail,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { getCompanyLegalProfile } from "@/lib/legal-company";

const FOOTER_MARK_BLOCKS = [
  { id: "footer-mark-01", letter: "O", height: "78%", bg: "bg-primary" },
  { id: "footer-mark-02", letter: "F", height: "92%", bg: "bg-foreground" },
  { id: "footer-mark-03", letter: "E", height: "65%", bg: "bg-secondary" },
  { id: "footer-mark-04", letter: "R", height: "100%", bg: "bg-primary" },
  { id: "footer-mark-05", letter: "T", height: "82%", bg: "bg-foreground" },
  { id: "footer-mark-06", letter: "A", height: "95%", bg: "bg-secondary" },
  { id: "footer-mark-07", letter: "P", height: "70%", bg: "bg-primary" },
  { id: "footer-mark-08", letter: "R", height: "88%", bg: "bg-foreground" },
  { id: "footer-mark-09", letter: "O", height: "100%", bg: "bg-primary" },
  { id: "footer-mark-10", letter: "N", height: "64%", bg: "bg-secondary" },
  { id: "footer-mark-11", letter: "T", height: "85%", bg: "bg-foreground" },
  { id: "footer-mark-12", letter: "A", height: "90%", bg: "bg-primary" },
];

export function LandingFooter() {
  const profile = getCompanyLegalProfile();

  return (
    <footer className="bg-background pt-12 pb-8 px-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        {/* Marca construída a partir de formas geométricas */}
        <div
          aria-hidden="true"
          className="grid grid-cols-6 sm:grid-cols-12 gap-[4px] items-end h-[22svh] sm:h-[30svh] w-full select-none overflow-hidden"
        >
          {FOOTER_MARK_BLOCKS.map((block) => (
            <div
              key={block.id}
              className={`w-full flex items-center justify-center pb-2 [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] ${block.bg}`}
              style={{ height: block.height }}
            >
              <Typography
                as="span"
                variant="muted"
                className="text-background font-black text-[clamp(28px,4.5vw,64px)] leading-none select-none"
              >
                {block.letter}
              </Typography>
            </div>
          ))}
        </div>

        {/* Bloco Superior: Marca e Colunas de Navegação */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 sm:gap-6 pt-4">
          {/* Coluna 1: Identidade da Marca (5 cols desktop) */}
          <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground [clip-path:polygon(4px_0,100%_0,100%_100%,0_100%,0_4px)]">
                <Store className="size-4" />
              </div>
              <Typography
                variant="h4"
                className="text-base font-extrabold tracking-tight text-foreground"
              >
                Oferta
                <Typography
                  as="span"
                  variant="h4"
                  className="text-primary font-extrabold"
                >
                  Pronta
                </Typography>
              </Typography>
            </div>
            <Typography
              variant="muted"
              className="text-xs leading-relaxed max-w-sm"
            >
              Anúncios profissionais gerados por IA para Instagram e WhatsApp em
              menos de 90 segundos. Gere a prévia grátis, sem cadastro e sem
              mensalidade.
            </Typography>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-secondary">
              <ShieldCheck className="size-3.5 shrink-0" />
              <Typography
                as="span"
                variant="muted"
                className="text-xs font-medium text-secondary"
              >
                Ambiente Seguro • Pix Dinâmico
              </Typography>
            </div>
          </div>

          {/* Coluna 2: Navegação Institucional & Legal (4 cols desktop, 6 mobile) */}
          <div className="flex flex-col gap-2.5 sm:col-span-1 lg:col-span-4 text-left">
            <Typography
              variant="muted"
              className="text-sm font-bold text-foreground mb-1"
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
          <div className="flex flex-col gap-2.5 sm:col-span-1 lg:col-span-3 text-left">
            <Typography
              variant="muted"
              className="text-sm font-bold text-foreground mb-1"
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
                <div className="flex size-5 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <MessageCircle className="size-3" />
                </div>
                <Typography
                  as="span"
                  variant="muted"
                  className="hover:text-secondary text-xs font-medium"
                >
                  Suporte WhatsApp
                </Typography>
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
        <div className="bg-card-subtle p-3.5 sm:p-4 [clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,0_100%)] flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground text-left">
          <Typography variant="muted" className="text-[11px] leading-relaxed">
            <Typography
              as="span"
              variant="muted"
              className="font-semibold text-foreground/80"
            >
              {profile.legalName}
            </Typography>{" "}
            • CNPJ: {profile.cnpj} • {profile.addressCityState}
          </Typography>
          <Typography
            variant="muted"
            className="text-[11px] shrink-0 text-muted-foreground/80"
          >
            Compra avulsa sob demanda • Entrega imediata
          </Typography>
        </div>

        {/* Linha Inferior: Direitos Autorais, Formatos e CTA */}
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left pt-2">
          <Typography variant="muted" className="text-xs text-muted-foreground">
            © 2026 {profile.tradeName}. Todos os direitos reservados.
          </Typography>
          <div className="flex items-center gap-4">
            <Typography
              variant="muted"
              className="text-[11px] text-muted-foreground/70"
            >
              Formatos inclusos: Feed 1080×1350 e Story 1080×1920
            </Typography>
            <Button
              size="sm"
              asChild
              className="rounded-none [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] bg-primary text-primary-foreground font-semibold hover:bg-primary-hover h-8 px-4 text-xs transition-[transform,background-color] duration-200 ease-out"
            >
              <a href="/criar">Criar oferta</a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
