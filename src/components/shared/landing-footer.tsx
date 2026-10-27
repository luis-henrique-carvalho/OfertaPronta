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
  {
    id: "footer-mark-01",
    letter: "O",
    height: "78%",
    bg: "bg-[#fe7141] text-[#000000]",
  },
  {
    id: "footer-mark-02",
    letter: "F",
    height: "92%",
    bg: "bg-[#ffffff] text-[#000000]",
  },
  {
    id: "footer-mark-03",
    letter: "E",
    height: "65%",
    bg: "bg-[#f0ff1c] text-[#000000]",
  },
  {
    id: "footer-mark-04",
    letter: "R",
    height: "100%",
    bg: "bg-[#fe7141] text-[#000000]",
  },
  {
    id: "footer-mark-05",
    letter: "T",
    height: "82%",
    bg: "bg-[#ffffff] text-[#000000]",
  },
  {
    id: "footer-mark-06",
    letter: "A",
    height: "95%",
    bg: "bg-[#f0ff1c] text-[#000000]",
  },
  {
    id: "footer-mark-07",
    letter: "P",
    height: "70%",
    bg: "bg-[#fe7141] text-[#000000]",
  },
  {
    id: "footer-mark-08",
    letter: "R",
    height: "88%",
    bg: "bg-[#ffffff] text-[#000000]",
  },
  {
    id: "footer-mark-09",
    letter: "O",
    height: "100%",
    bg: "bg-[#fe7141] text-[#000000]",
  },
  {
    id: "footer-mark-10",
    letter: "N",
    height: "64%",
    bg: "bg-[#f0ff1c] text-[#000000]",
  },
  {
    id: "footer-mark-11",
    letter: "T",
    height: "85%",
    bg: "bg-[#ffffff] text-[#000000]",
  },
  {
    id: "footer-mark-12",
    letter: "A",
    height: "90%",
    bg: "bg-[#fe7141] text-[#000000]",
  },
];

export function LandingFooter() {
  const profile = getCompanyLegalProfile();

  return (
    <footer className="w-full bg-[#000000] text-[#f4f4f4] py-16 lg:py-24 overflow-x-clip">
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12 flex flex-col gap-10">
        {/* Marca construída a partir de formas geométricas */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-[4px] items-end h-[16svh] sm:h-[20svh] w-full select-none overflow-hidden taste-enter">
          {FOOTER_MARK_BLOCKS.map((block) => (
            <div
              key={block.id}
              className={`w-full flex items-center justify-center pb-2 ${block.bg}`}
              style={{ height: block.height }}
            >
              <Typography
                as="span"
                className="font-black text-[clamp(28px,4.5vw,64px)] leading-none select-none text-[#000000]"
              >
                {block.letter}
              </Typography>
            </div>
          ))}
        </div>

        {/* Bloco Superior: Marca e Colunas de Navegação */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 sm:gap-6 pt-4 taste-enter taste-delay-1">
          {/* Coluna 1: Identidade da Marca (5 cols desktop) */}
          <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center bg-[#fe7141] text-[#000000]">
                <Store className="size-4" />
              </div>
              <Typography
                as="div"
                className="text-base font-black tracking-tight text-[#ffffff]"
              >
                Oferta
                <Typography as="span" className="text-[#f0ff1c] font-black">
                  Pronta
                </Typography>
              </Typography>
            </div>
            <Typography
              as="p"
              className="text-base leading-relaxed text-[#f4f4f4] max-w-sm"
            >
              Anúncios profissionais gerados por IA para Instagram e WhatsApp em
              menos de 90 segundos. Gere a prévia grátis, sem cadastro e sem
              mensalidade.
            </Typography>
            <div className="flex items-center gap-1.5 pt-1 text-base font-bold text-[#f0ff1c]">
              <ShieldCheck className="size-4 shrink-0" />
              <Typography
                as="span"
                className="text-base font-bold text-[#f0ff1c]"
              >
                Ambiente Seguro • Pix Dinâmico
              </Typography>
            </div>
          </div>

          {/* Coluna 2: Navegação Institucional & Legal (4 cols desktop, 6 mobile) */}
          <div className="flex flex-col gap-3 sm:col-span-1 lg:col-span-4 text-left">
            <Typography
              as="h4"
              className="text-base font-bold text-[#ffffff] mb-1"
            >
              Documentos Legais
            </Typography>
            <nav className="flex flex-col gap-2.5 text-base">
              <a
                href="/termos"
                className="group inline-flex items-center gap-2 text-[#f4f4f4] transition-colors hover:text-[#f0ff1c]"
              >
                <FileText className="size-4 text-[#f0ff1c] transition-colors" />
                <Typography
                  as="span"
                  className="text-[#f4f4f4] group-hover:text-[#f0ff1c] text-base font-medium"
                >
                  Termos de Uso
                </Typography>
              </a>
              <a
                href="/privacidade"
                className="group inline-flex items-center gap-2 text-[#f4f4f4] transition-colors hover:text-[#f0ff1c]"
              >
                <ShieldCheck className="size-4 text-[#f0ff1c] transition-colors" />
                <Typography
                  as="span"
                  className="text-[#f4f4f4] group-hover:text-[#f0ff1c] text-base font-medium"
                >
                  Política de Privacidade
                </Typography>
              </a>
            </nav>
          </div>

          {/* Coluna 3: Atendimento & Suporte (3 cols desktop, 6 mobile) */}
          <div className="flex flex-col gap-3 sm:col-span-1 lg:col-span-3 text-left">
            <Typography
              as="h4"
              className="text-base font-bold text-[#ffffff] mb-1"
            >
              Atendimento
            </Typography>
            <nav className="flex flex-col gap-2.5 text-base">
              <a
                href={profile.supportWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-[#f4f4f4] transition-colors hover:text-[#f0ff1c]"
              >
                <div className="flex size-6 items-center justify-center bg-[#f0ff1c] text-[#000000]">
                  <MessageCircle className="size-3.5" />
                </div>
                <Typography
                  as="span"
                  className="text-[#f4f4f4] group-hover:text-[#f0ff1c] text-base font-medium"
                >
                  Suporte WhatsApp
                </Typography>
              </a>
              <a
                href={`mailto:${profile.contactEmail}`}
                className="group inline-flex items-center gap-2 text-[#f4f4f4] transition-colors hover:text-[#f0ff1c]"
              >
                <div className="flex size-6 items-center justify-center bg-[#fe7141] text-[#000000]">
                  <Mail className="size-3.5" />
                </div>
                <Typography
                  as="span"
                  className="text-[#f4f4f4] group-hover:text-[#f0ff1c] text-base font-medium"
                >
                  {profile.contactEmail}
                </Typography>
              </a>
            </nav>
          </div>
        </div>

        {/* Faixa Fiscal & Legal (CDC / Decreto 7.962/2013) */}
        <div className="bg-[#141414] p-4 sm:p-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-[#f4f4f4] text-left taste-enter taste-delay-2">
          <Typography as="p" className="text-sm leading-relaxed text-[#f4f4f4]">
            <Typography as="span" className="font-bold text-[#ffffff]">
              {profile.legalName}
            </Typography>{" "}
            • CNPJ: {profile.cnpj} • {profile.addressCityState}
          </Typography>
          <Typography as="p" className="text-sm shrink-0 text-[#f4f4f4]">
            Compra avulsa sob demanda • Entrega imediata
          </Typography>
        </div>

        {/* Linha Inferior: Direitos Autorais, Formatos e CTA */}
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left pt-2 taste-enter taste-delay-3">
          <Typography as="p" className="text-sm text-[#f4f4f4]/70">
            © 2026 {profile.tradeName}. Todos os direitos reservados.
          </Typography>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Typography as="span" className="text-sm text-[#f4f4f4]/70">
              Formatos inclusos: Feed 1080×1350 e Story 1080×1920
            </Typography>
            <Button
              size="sm"
              asChild
              className="rounded-none bg-[#fe7141] text-[#000000] font-black hover:bg-[#f0ff1c] hover:text-[#000000] h-9 px-5 text-sm transition-colors"
            >
              <a href="/criar">Criar oferta</a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
