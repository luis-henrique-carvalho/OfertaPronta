import { Typography } from "@/components/ui/typography";
import { SHOWCASE_SEED_CATALOG } from "@/features/promotions/data/showcase-catalog";

export function LandingStepsSection() {
  const step1Image =
    SHOWCASE_SEED_CATALOG.find((item) => item.id === "seed-supermarket-02") ??
    SHOWCASE_SEED_CATALOG[0];
  const step2Image =
    SHOWCASE_SEED_CATALOG.find((item) => item.id === "seed-restaurant-02") ??
    SHOWCASE_SEED_CATALOG[1];
  const step3ImageFeed =
    SHOWCASE_SEED_CATALOG.find((item) => item.id === "seed-burger-03") ??
    SHOWCASE_SEED_CATALOG[2];
  const step3ImageStory =
    SHOWCASE_SEED_CATALOG.find((item) => item.id === "seed-pizzeria-03") ??
    SHOWCASE_SEED_CATALOG[3];

  return (
    <section className="bg-card-subtle py-20 lg:py-36 px-4 sm:px-8" id="passos">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-left">
          <Typography
            variant="h2"
            className="text-left text-[clamp(28px,3.2vw,44px)] font-bold tracking-tight mb-3"
          >
            Da sua ideia para o WhatsApp dos clientes em 3 passos
          </Typography>
          <Typography
            variant="muted"
            className="text-left max-w-md text-base mb-2"
          >
            Tudo direto pelo celular, sem criar conta e sem mexer em ferramentas
            complicadas de edição.
          </Typography>
          <Typography
            variant="muted"
            className="text-left text-sm font-semibold text-primary"
          >
            Simples do Início ao Fim
          </Typography>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-[10px] items-end">
          {/* Tile 1 */}
          <div className="lg:col-span-3 flex flex-col justify-end">
            <div className="min-h-[34vw] lg:min-h-[30vh] bg-background [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,0_100%)] p-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary [clip-path:polygon(4px_0,100%_0,100%_100%,0_100%,0_4px)] mb-3">
                  <Typography
                    as="span"
                    variant="muted"
                    className="text-xs font-bold text-primary"
                  >
                    Briefing Rápido
                  </Typography>
                </div>
                <Typography variant="h4" className="text-sm font-bold">
                  Oferta: Alcatra Bovina • R$ 49,90
                </Typography>
              </div>
              <div className="mt-4 relative aspect-[4/3] w-full overflow-hidden [clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,0_100%)]">
                <img
                  src={step1Image.imageUrl}
                  alt="Foto da Oferta"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="text-left">
              <Typography variant="h3" className="text-[20px] font-bold mt-4">
                Descreva sua promoção
              </Typography>
              <Typography variant="muted" className="text-base mt-1">
                Escolha o ramo do seu negócio, digite a oferta e o preço que vai
                anunciar.
              </Typography>
              <Typography variant="muted" className="text-sm mt-2">
                Tem foto do produto no celular? Pode enviar junto. Se não tiver,
                a própria IA cria o cenário e a imagem para você.
              </Typography>
            </div>
          </div>

          {/* Tile 2 */}
          <div className="lg:col-span-4 flex flex-col justify-end">
            <div className="min-h-[46vw] lg:min-h-[44vh] bg-secondary/15 [clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,0_100%)] p-6 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center px-2.5 py-1 bg-secondary text-secondary-foreground [clip-path:polygon(4px_0,100%_0,100%_100%,0_100%,0_4px)] mb-3">
                  <Typography
                    as="span"
                    variant="muted"
                    className="text-xs font-bold text-secondary-foreground"
                  >
                    Geração Inteligente
                  </Typography>
                </div>
                <Typography
                  variant="h4"
                  className="text-sm font-bold text-foreground"
                >
                  Composição e Iluminação
                </Typography>
              </div>
              <div className="mt-4 relative aspect-[4/3] w-full overflow-hidden [clip-path:polygon(0_0,calc(100%-20px)_0,100%_20px,100%_100%,0_100%)]">
                <img
                  src={step2Image.imageUrl}
                  alt="Card em criação"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="text-left">
              <Typography variant="h3" className="text-[20px] font-bold mt-4">
                A IA monta o card na hora
              </Typography>
              <Typography variant="muted" className="text-base mt-1">
                Em menos de 90 segundos, seu anúncio fica pronto com iluminação,
                cores e preço em destaque.
              </Typography>
              <Typography variant="muted" className="text-sm mt-2">
                Você confere a prévia completa na tela gratuitamente antes de
                tomar qualquer decisão.
              </Typography>
            </div>
          </div>

          {/* Tile 3 */}
          <div className="lg:col-span-5 flex flex-col justify-end">
            <div className="min-h-[62vw] lg:min-h-[60vh] bg-primary text-primary-foreground [clip-path:polygon(0_0,calc(100%-36px)_0,100%_36px,100%_100%,0_100%)] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center px-3 py-1 bg-background text-foreground [clip-path:polygon(6px_0,100%_0,100%_100%,0_100%,0_6px)] mb-3">
                  <Typography
                    as="span"
                    variant="muted"
                    className="text-xs font-bold text-foreground"
                  >
                    Alta Definição • Sem Marca
                  </Typography>
                </div>
                <Typography
                  as="div"
                  variant="h4"
                  className="text-base font-bold text-primary-foreground"
                >
                  Pronto para Postar
                </Typography>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                <div className="relative aspect-[4/5] overflow-hidden [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)]">
                  <img
                    src={step3ImageFeed.imageUrl}
                    alt="Card final Feed"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="relative aspect-[4/5] overflow-hidden [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)]">
                  <img
                    src={step3ImageStory.imageUrl}
                    alt="Card final Story"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <div className="text-left">
              <Typography variant="h3" className="text-[20px] font-bold mt-4">
                Baixe em alta definição e poste
              </Typography>
              <Typography variant="muted" className="text-base mt-1">
                Gostou do resultado? Libere os arquivos sem marca d&apos;água e
                publique no WhatsApp e Instagram.
              </Typography>
              <Typography variant="muted" className="text-sm mt-2">
                Você já recebe as duas versões prontas (Feed e Story) para
                mandar nos grupos e atrair pedidos no mesmo minuto.
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
