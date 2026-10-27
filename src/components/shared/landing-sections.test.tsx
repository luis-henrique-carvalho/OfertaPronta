// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LandingHeroSection } from "./landing-hero-section";
import { LandingStepsSection } from "./landing-steps-section";
import { LandingPricingSection } from "./landing-pricing-section";
import { LandingHeader } from "./landing-header";
import { LandingSegmentsSection } from "./landing-segments-section";
import { LandingFormatsSection } from "./landing-formats-section";
import { LandingFooter } from "./landing-footer";

describe("LandingHeroSection", () => {
  it("renderiza sem atrito de preço prematuro e com CTA de ação rápida de 90 segundos", () => {
    render(<LandingHeroSection />);

    // Headline e subtítulo
    expect(
      screen.getByText(
        "Anúncios que vendem o seu produto hoje, sem perder horas no Canva nem pagar agência.",
      ),
    ).toBeDefined();

    expect(
      screen.getByText(
        "Digite o nome da oferta e o preço. Em 90 segundos, a IA entrega seu card profissional pronto para postar no WhatsApp e Instagram.",
      ),
    ).toBeDefined();

    // Badge
    expect(
      screen.getByText(
        "Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local",
      ),
    ).toBeDefined();

    // CTA principal
    const ctaButton = screen.getByRole("link", {
      name: /gerar meu card grátis em 90 segundos/i,
    });
    expect(ctaButton.getAttribute("href")).toBe("/criar");
    expect(ctaButton.textContent).not.toContain("R$ 9,90");
    expect(ctaButton.textContent).not.toContain("via Pix");

    // Selos de confiança
    expect(screen.getByText("Gere a prévia gratuitamente")).toBeDefined();
    expect(screen.getByText("Sem cadastro demorado")).toBeDefined();
    expect(screen.getByText("Pronto para Feed & Story")).toBeDefined();
  });

  it("renderiza e permite interagir com o simulador interativo de balcão (hero-live-fragment)", () => {
    render(<LandingHeroSection />);

    // Validar que screen.getByTestId("hero-live-fragment") existe e possui data-ui="hero-live-fragment"
    const liveFragment = screen.getByTestId("hero-live-fragment");
    expect(liveFragment).toBeDefined();
    expect(liveFragment.getAttribute("data-ui")).toBe("hero-live-fragment");

    // Validar que o card inicial ("Festival de Carnes Nobres" e "R$ 54,90/kg") aparece
    expect(screen.getByText("Festival de Carnes Nobres")).toBeDefined();
    expect(screen.getByText("R$ 54,90/kg")).toBeDefined();

    // Clicar na aba de segmento "Pizzaria" e validar que o card muda para "Terça da Pizza em Dobro" e "R$ 59,90"
    const pizzariaTab = screen.getByRole("button", { name: "Pizzaria" });
    fireEvent.click(pizzariaTab);
    expect(screen.getByText("Terça da Pizza em Dobro")).toBeDefined();
    expect(screen.getByText("R$ 59,90")).toBeDefined();

    // Clicar nos botões hero-live-format-story e hero-live-format-feed para testar a alternância de proporção ao vivo
    const storyBtn = screen.getByTestId("hero-live-format-story");
    fireEvent.click(storyBtn);
    const storyImg = screen.getByAltText("Terça da Pizza em Dobro");
    expect(storyImg.parentElement?.className).toContain("aspect-[9/16]");

    const feedBtn = screen.getByTestId("hero-live-format-feed");
    fireEvent.click(feedBtn);
    const feedImg = screen.getByAltText("Terça da Pizza em Dobro");
    expect(feedImg.parentElement?.className).toContain("aspect-[4/5]");
  });
});

describe("LandingStepsSection", () => {
  it("renderiza os 3 passos simplificados sem termos técnicos e jargões", () => {
    const { container } = render(<LandingStepsSection />);

    // Badge e títulos
    expect(screen.getByText("Simples do Início ao Fim")).toBeDefined();
    expect(
      screen.getByText("Da sua ideia para o WhatsApp dos clientes em 3 passos"),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Tudo direto pelo celular, sem criar conta e sem mexer em ferramentas complicadas de edição.",
      ),
    ).toBeDefined();

    // Passo 1
    expect(screen.getByText("Descreva sua promoção")).toBeDefined();
    expect(
      screen.getByText(
        "Escolha o ramo do seu negócio, digite a oferta e o preço que vai anunciar.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Tem foto do produto no celular? Pode enviar junto. Se não tiver, a própria IA cria o cenário e a imagem para você.",
      ),
    ).toBeDefined();

    // Passo 2
    expect(screen.getByText("A IA monta o card na hora")).toBeDefined();
    expect(
      screen.getByText(
        "Em menos de 90 segundos, seu anúncio fica pronto com iluminação, cores e preço em destaque.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Você confere a prévia completa na tela gratuitamente antes de tomar qualquer decisão.",
      ),
    ).toBeDefined();

    // Passo 3
    expect(screen.getByText("Baixe em alta definição e poste")).toBeDefined();
    expect(
      screen.getByText(
        "Gostou do resultado? Libere os arquivos sem marca d'água e publique no WhatsApp e Instagram.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Você já recebe as duas versões prontas (Feed e Story) para mandar nos grupos e atrair pedidos no mesmo minuto.",
      ),
    ).toBeDefined();

    // Ausência de jargões técnicos
    const sectionText = container.textContent || "";
    expect(sectionText).not.toContain("placeholders");
    expect(sectionText).not.toContain("insumos visuais");
    expect(sectionText).not.toContain("PNGs");
  });

  it("não exibe marcadores numéricos decorativos (01/02/03)", () => {
    const { container } = render(<LandingStepsSection />);
    const sectionText = container.textContent || "";
    expect(sectionText).not.toMatch(/>\s*0[1-9]\s*</);
  });
});

describe("LandingPricingSection", () => {
  it("renderiza ancoragem comparativa com agência/Canva, benefícios com reversão de risco e CTA correto", () => {
    render(<LandingPricingSection />);

    // Badge e título
    expect(screen.getByText("Risco Zero: Teste Antes de Pagar")).toBeDefined();
    expect(
      screen.getByText(
        "Visual de agência por uma fração do que você gasta hoje",
      ),
    ).toBeDefined();

    // Subtítulo comparativo
    expect(
      screen.getByText(
        "Uma agência cobra R$ 150 por arte avulsa e o Canva consome 2 horas da sua noite. Aqui você gera a prévia de graça e só paga se aprovar o resultado.",
      ),
    ).toBeDefined();

    // Rótulo de preço
    expect(
      screen.getByText("/ por campanha aprovada (Feed + Story)"),
    ).toBeDefined();

    // Benefícios
    expect(
      screen.getByText(
        "Você só paga depois de ver a prévia gerada com marca d'água",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Download imediato em altíssima definição: Feed (1080×1350) e Story (1080×1920)",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(/regenerações por IA inclusas para ajustar detalhes/i),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Pagamento único via Pix, sem mensalidade e sem cadastrar cartão",
      ),
    ).toBeDefined();

    // CTA
    const ctaButton = screen.getByRole("link", {
      name: /gerar minha prévia grátis agora/i,
    });
    expect(ctaButton.getAttribute("href")).toBe("/criar");

    // Rodapé de segurança
    expect(
      screen.getByText(
        "Zero compromisso: gere a prévia sem pagar nada • Liberação instantânea via Pix",
      ),
    ).toBeDefined();
  });
});

describe("LandingHeader", () => {
  it("renderiza botão CTA secundário 'Gerar prévia grátis'", () => {
    render(<LandingHeader />);

    const ctaLink = screen.getByRole("link", {
      name: /gerar prévia grátis/i,
    });
    expect(ctaLink.getAttribute("href")).toBe("/criar");
  });
});

describe("LandingSegmentsSection", () => {
  it("renderiza os 6 segmentos com textos orientados ao balcão e apetite/urgência", () => {
    render(<LandingSegmentsSection />);

    expect(screen.getByText("Feito para a Rotina do Comércio")).toBeDefined();
    expect(screen.getByText("Pronto para o ritmo do seu balcão")).toBeDefined();
    expect(
      screen.getByText(
        "Não importa se você vende quilo de alcatra, pizza grande ou corte de cabelo: a IA já conhece o visual que dá água na boca e atrai clientes no seu ramo.",
      ),
    ).toBeDefined();

    // 6 segmentos
    expect(
      screen.getByText(
        "Dia do hortifrúti, ofertas do açougue e encartes de fim de semana com preço bem visível.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Combos de corte e barba, progressiva, manicure e promoções para encher a agenda da semana.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Foto de queijo derretendo, borda recheada e combo família com refrigerante para bombar o delivery.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Smash burger na chapa, cheddar cremoso e combos com batata que dão fome só de olhar no celular.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Prato feito do dia, marmitex, executivo e cardápio de almoço pronto antes de abrir as portas.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Queima de estoque em lojas de roupa, banho e tosa em pet shop, óticas, farmácias e oficinas.",
      ),
    ).toBeDefined();
  });

  it("permite interagir com os segmentos mantendo o conteúdo de balcão acessível", () => {
    render(<LandingSegmentsSection />);

    const pizzariasTrigger = screen.getByText("Pizzarias");
    fireEvent.click(pizzariasTrigger);

    expect(
      screen.getByText(
        "Foto de queijo derretendo, borda recheada e combo família com refrigerante para bombar o delivery.",
      ),
    ).toBeDefined();

    const button = pizzariasTrigger.closest("button");
    if (button) {
      expect(button).toBeDefined();
    }
  });
});

describe("LandingFormatsSection", () => {
  it("renderiza os 2 formatos com foco em Feed e Story/Status", () => {
    render(<LandingFormatsSection />);

    expect(screen.getByText("2 Formatos Prontos de Uma Vez")).toBeDefined();
    expect(
      screen.getByText(
        "Uma única criação entrega o post do Feed e a tela cheia do Story",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Nada de post cortado pela metade ou letra miúda que ninguém lê no celular. Você recebe os dois tamanhos certos para divulgar em todas as redes.",
      ),
    ).toBeDefined();

    // Feed
    expect(screen.getByText("Post para Feed e Grupos")).toBeDefined();
    expect(
      screen.getByText(
        "Formato retrato que ocupa mais espaço na tela do celular e faz o cliente parar de rolar o Instagram.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Ideal para fixar no perfil da loja e disparar nas listas de transmissão do WhatsApp.",
      ),
    ).toBeDefined();

    // Story
    expect(
      screen.getByText("Story e Status com Espaço para Link"),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Tela cheia vertical com espaço livre na parte de baixo para você colar a figurinha do link do seu WhatsApp.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Perfeito para postar todo dia no Status do WhatsApp e nos Stories sem tampar o preço.",
      ),
    ).toBeDefined();
  });
});

describe("LandingFooter institucional", () => {
  it("exibe a nova descrição institucional da marca com prévia grátis", () => {
    render(<LandingFooter />);

    expect(
      screen.getByText(
        "Anúncios profissionais gerados por IA para Instagram e WhatsApp em menos de 90 segundos. Gere a prévia grátis, sem cadastro e sem mensalidade.",
      ),
    ).toBeDefined();
  });
});
