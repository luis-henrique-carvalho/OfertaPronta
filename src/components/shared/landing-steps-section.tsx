import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface StepCardData {
  id: string;
  bg: string;
  title: string;
  description: string;
  footerText: string;
  delay: string;
  ui: React.ReactNode;
}

const STEP_ITEMS: readonly StepCardData[] = [
  {
    id: "step-1",
    bg: "bg-[#d1ddd3]",
    title: "Descreva sua promoção",
    description:
      "Escolha o ramo do seu negócio, digite a oferta e o preço que vai anunciar.",
    footerText:
      "Tem foto do produto no celular? Pode enviar junto. Se não tiver, a própria IA cria o cenário e a imagem para você.",
    delay: "taste-delay-2",
    ui: (
      <div
        data-ui="step-briefing-ui"
        className="relative w-full min-h-[210px] bg-[#ffffff] text-[#000000] p-4 sm:p-5 flex flex-col justify-between mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center px-2.5 py-1 bg-[#d1ddd3] text-[#000000]">
            <Typography as="span" className="text-xs font-bold text-[#000000]">
              Briefing Rápido
            </Typography>
          </div>
          <Typography
            as="span"
            className="text-xs font-semibold text-[#000000]/70"
          >
            Passo inicial
          </Typography>
        </div>

        <div className="space-y-2.5 my-auto">
          <div className="bg-[#f6f6f6] p-2.5">
            <Typography
              as="div"
              className="text-xs font-bold text-[#000000]/70 mb-0.5"
            >
              Ramo do Negócio
            </Typography>
            <Typography as="div" className="text-sm font-black text-[#000000]">
              Açougue & Casa de Carnes
            </Typography>
          </div>
          <div className="bg-[#f6f6f6] p-2.5">
            <Typography
              as="div"
              className="text-xs font-bold text-[#000000]/70 mb-0.5"
            >
              Oferta & Preço
            </Typography>
            <Typography as="h4" className="text-sm font-black text-[#000000]">
              Oferta: Alcatra Bovina • R$ 49,90
            </Typography>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-[#000000]/70">
          <Typography as="span" className="text-xs font-medium">
            Foto opcional anexada
          </Typography>
          <Typography as="span" className="text-xs font-bold text-[#000000]">
            Pronto para gerar
          </Typography>
        </div>
      </div>
    ),
  },
  {
    id: "step-2",
    bg: "bg-[#f0ff1c]",
    title: "A IA monta o card na hora",
    description:
      "Em menos de 90 segundos, seu anúncio fica pronto com iluminação, cores e preço em destaque.",
    footerText:
      "Você confere a prévia completa na tela gratuitamente antes de tomar qualquer decisão.",
    delay: "taste-delay-3",
    ui: (
      <div
        data-ui="step-ai-ui"
        className="relative w-full min-h-[210px] bg-[#000000] text-[#ffffff] p-4 sm:p-5 flex flex-col justify-between mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center px-2.5 py-1 bg-[#f0ff1c] text-[#000000]">
            <Typography as="span" className="text-xs font-bold text-[#000000]">
              Geração Inteligente
            </Typography>
          </div>
          <Typography as="span" className="text-xs font-bold text-[#f0ff1c]">
            Tempo: 90 segundos
          </Typography>
        </div>

        <div className="space-y-2.5 my-auto">
          <div className="bg-[#141414] p-2.5">
            <Typography as="h4" className="text-sm font-black text-[#ffffff]">
              Composição e Iluminação
            </Typography>
            <Typography as="div" className="text-xs text-[#ffffff]/80 mt-1">
              Arte calibrada com cores, contraste comercial e manchete
            </Typography>
          </div>
          <div className="flex items-center justify-between bg-[#141414] p-2.5">
            <Typography as="span" className="text-xs text-[#ffffff]/80">
              Selo de preço calculado
            </Typography>
            <div className="bg-[#fe7141] text-[#000000] text-xs font-black px-2 py-0.5">
              R$ 49,90/kg
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-[#f0ff1c]">
          <Typography as="span" className="text-xs font-bold text-[#f0ff1c]">
            Cenário profissional
          </Typography>
          <Typography as="span" className="text-xs font-bold text-[#f0ff1c]">
            Prévia liberada
          </Typography>
        </div>
      </div>
    ),
  },
  {
    id: "step-3",
    bg: "bg-[#fe7141]",
    title: "Baixe em alta definição e poste",
    description:
      "Gostou do resultado? Libere os arquivos sem marca d'água e publique no WhatsApp e Instagram.",
    footerText:
      "Você já recebe as duas versões prontas (Feed e Story) para mandar nos grupos e atrair pedidos no mesmo minuto.",
    delay: "taste-delay-4",
    ui: (
      <div
        data-ui="step-download-ui"
        className="relative w-full min-h-[210px] bg-[#ffffff] text-[#000000] p-4 sm:p-5 flex flex-col justify-between mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center px-2.5 py-1 bg-[#fe7141] text-[#000000]">
            <Typography as="span" className="text-xs font-bold text-[#000000]">
              Alta Definição • Sem Marca
            </Typography>
          </div>
          <Typography
            as="span"
            className="text-xs font-semibold text-[#000000]/70"
          >
            Liberação imediata
          </Typography>
        </div>

        <div className="space-y-2.5 my-auto">
          <div className="bg-[#f6f6f6] p-2.5">
            <Typography
              as="div"
              className="text-xs font-bold text-[#000000]/70 mb-0.5"
            >
              Pronto para Postar
            </Typography>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-[#000000] text-[#f0ff1c] text-xs font-bold px-2 py-1">
                Feed 1080×1350
              </div>
              <div className="bg-[#000000] text-[#fe7141] text-xs font-bold px-2 py-1">
                Story 1080×1920
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-[#000000]/70">
          <Typography as="span" className="text-xs font-medium">
            WhatsApp & Instagram
          </Typography>
          <Typography as="span" className="text-xs font-bold text-[#000000]">
            Baixar arquivos
          </Typography>
        </div>
      </div>
    ),
  },
] as const;

export function LandingStepsSection() {
  return (
    <section
      className="w-full bg-[#f6f6f6] text-[#000000] py-16 lg:py-24 overflow-x-clip"
      id="passos"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="mb-10 text-left">
          <Typography
            as="h2"
            variant="h2"
            className="text-[clamp(28px,3.2vw,44px)] font-black tracking-[-0.04em] leading-[0.95] text-[#000000] mb-3 taste-enter"
          >
            Três passos direto no celular.
          </Typography>
          <Typography
            as="p"
            variant="p"
            className="text-[18px] sm:text-[22px] lg:text-[26px] font-bold leading-[1.15] text-[#000000] max-w-2xl mb-3 taste-enter taste-delay-1"
          >
            Da sua ideia para o WhatsApp dos clientes em 3 passos
          </Typography>
          <Typography
            as="p"
            variant="p"
            className="text-base sm:text-lg text-[#000000] max-w-2xl mb-4 leading-relaxed taste-enter taste-delay-2"
          >
            Tudo direto pelo celular, sem criar conta e sem mexer em ferramentas
            complicadas de edição.
          </Typography>
          <div>
            <Typography
              as="span"
              className="inline-block bg-[#000000] text-[#ffffff] px-3.5 py-1.5 text-base font-bold taste-enter taste-delay-2"
            >
              Simples do Início ao Fim
            </Typography>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {STEP_ITEMS.map((step) => (
            <div
              key={step.id}
              className={cn(
                step.bg,
                "text-[#000000] p-6 sm:p-8 flex flex-col justify-between taste-enter",
                step.delay,
              )}
            >
              <div>
                {step.ui}
                <div className="text-left">
                  <Typography
                    as="h3"
                    variant="h3"
                    className="text-[20px] sm:text-[22px] font-black leading-[1.08] text-[#000000] mb-2"
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    as="p"
                    className="text-base text-[#000000] leading-relaxed mb-3"
                  >
                    {step.description}
                  </Typography>
                </div>
              </div>

              <Typography
                as="p"
                className="text-base text-[#000000]/80 leading-relaxed pt-2 text-left"
              >
                {step.footerText}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
