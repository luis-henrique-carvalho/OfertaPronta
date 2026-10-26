// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render as rtlRender,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OfferCreationWizard } from "./offer-creation-wizard";

const render = (
  ui: React.ReactElement,
  options?: Parameters<typeof rtlRender>[1],
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    options,
  );
};
import type { SaveOfferDraftInput } from "../data/offer-brief.schema";
import type { SaveDraftResponse, GeneratePreviewResponse } from "../server";

describe("OfferCreationWizard Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockSaveDraft = vi
    .fn()
    .mockImplementation(async (): Promise<SaveDraftResponse> => ({
      success: true,
      draftId: "draft-abc-123",
      draft: {
        id: "draft-abc-123",
        businessSegment: "fashion",
        targetAspectRatio: "feed",
        cardIntent: "promo",
        customIntentText: null,
        logoImageDataUrl: null,
        businessName: "Boutique Flor",
        offerTitle: "Vestido Floral",
        promoPrice: "R$ 89,90",
        originalPrice: null,
        callToAction: null,
        whatsapp: null,
        productImageDataUrl: null,
        referenceImageDataUrl: null,
        stylePresetId: "fashion-boutique",
        customStyleInstructions: null,
        previewCardImageUrl: null,
        aiGenerationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));

  const mockGeneratePreview = vi
    .fn()
    .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
      status: "OK",
      draft: {
        id: "draft-fashion-123",
        businessSegment: "fashion",
        targetAspectRatio: "feed",
        businessName: "Boutique Elegance",
        offerTitle: "Vestido",
        promoPrice: "R$ 89,90",
        cardIntent: "promo",
        previewCardImageUrl: "data:image/png;base64,mockPreviewDataUrl",
        aiGenerationCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));

  const mockInitiateCheckout = vi
    .fn()
    .mockImplementation(async (): Promise<{ orderId: string }> => ({
      orderId: "order-pix-789",
    }));

  it("deve renderizar o Passo 1 inicialmente com Moda & Roupas em destaque e os 7 segmentos", () => {
    render(
      <OfferCreationWizard
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    expect(screen.getByText(/Qual é o seu comércio\?/i)).toBeDefined();
    expect(
      screen.getByText(
        /A IA vai criar o card perfeito para o seu tipo de loja/i,
      ),
    ).toBeDefined();

    // Barra de progresso indica Passo 1 de 4
    expect(screen.getByText(/Passo 1 de 4/i)).toBeDefined();
    expect(screen.getByText(/1\. Ramo/i)).toBeDefined();

    // 7 ramos devem estar visíveis
    expect(screen.getByTestId("segment-option-fashion")).toBeDefined();
    expect(screen.getByTestId("segment-option-supermarket")).toBeDefined();
    expect(screen.getByTestId("segment-option-pizzeria")).toBeDefined();
    expect(screen.getByTestId("segment-option-burger-shop")).toBeDefined();
    expect(screen.getByTestId("segment-option-beauty-salon")).toBeDefined();
    expect(screen.getByTestId("segment-option-restaurant")).toBeDefined();
    expect(screen.getByTestId("segment-option-local-retail")).toBeDefined();

    // No Passo 1, o botão Voltar não é exibido, apenas Continuar
    expect(screen.queryByTestId("btn-wizard-back")).toBeNull();
    expect(screen.getByTestId("btn-wizard-next")).toBeDefined();
  });

  it("deve selecionar segmento no Passo 1 e avançar para o Passo 2", () => {
    render(
      <OfferCreationWizard
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Seleciona Pizzaria
    const pizzaSegmentBtn = screen.getByTestId("segment-option-pizzeria");
    fireEvent.click(pizzaSegmentBtn);

    // Clica em Continuar no rodapé fixo
    const nextBtn = screen.getByTestId("btn-wizard-next");
    fireEvent.click(nextBtn);

    // Agora deve estar no Passo 2
    expect(screen.getByText(/Passo 2 de 4/i)).toBeDefined();
    expect(screen.getByText(/2\. O Anúncio/i)).toBeDefined();
    expect(screen.getByText(/O que você quer postar\?/i)).toBeDefined();

    // Botão Voltar agora está visível no Passo 2
    expect(screen.getByTestId("btn-wizard-back")).toBeDefined();
  });

  it("deve desabilitar Continuar no Passo 2 quando campos obrigatórios estiverem vazios e habilitar quando válidos", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "",
          offerTitle: "",
          promoPrice: "",
          cardIntent: "promo",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Avança do Passo 1 para o Passo 2
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    const nextBtn = screen.getByTestId("btn-wizard-next");
    // Passo 2 inválido (sem nome, sem título, sem preço) -> botão desabilitado
    expect(nextBtn.hasAttribute("disabled")).toBe(true);

    const businessInput = screen.getByTestId("input-business-name");
    const titleInput = screen.getByTestId("input-offer-title");
    const priceInput = screen.getByTestId("input-promo-price");

    // Preenche apenas nome da loja
    fireEvent.change(businessInput, { target: { value: "Boutique Elegance" } });
    expect(nextBtn.hasAttribute("disabled")).toBe(true);

    // Preenche oferta
    fireEvent.change(titleInput, { target: { value: "Vestido Seda Pura" } });
    expect(nextBtn.hasAttribute("disabled")).toBe(true);

    // Preenche preço para promo
    fireEvent.change(priceInput, { target: { value: "R$ 159,90" } });
    // Agora deve estar habilitado
    expect(nextBtn.hasAttribute("disabled")).toBe(false);
  });

  it("deve ocultar preço completamente nos 4 objetivos institucionais/não promocionais (sem botão de adição)", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Elegance",
          offerTitle: "Chegou Nova Coleção de Verão",
          promoPrice: "",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Avança para Passo 2
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // 1. Objetivo: Novidade / Coleção
    fireEvent.click(screen.getByTestId("intent-option-new-arrival"));
    expect(screen.queryByTestId("input-promo-price")).toBeNull();
    expect(screen.queryByTestId("btn-add-custom-price")).toBeNull();
    expect(screen.getByTestId("btn-wizard-next").hasAttribute("disabled")).toBe(
      false,
    );

    // 2. Objetivo: Data Comemorativa
    fireEvent.click(screen.getByTestId("intent-option-special-date"));
    expect(screen.queryByTestId("input-promo-price")).toBeNull();
    expect(screen.queryByTestId("btn-add-custom-price")).toBeNull();
    expect(screen.getByTestId("btn-wizard-next").hasAttribute("disabled")).toBe(
      false,
    );

    // 3. Objetivo: Inauguração / Evento
    fireEvent.click(screen.getByTestId("intent-option-announcement"));
    expect(screen.queryByTestId("input-promo-price")).toBeNull();
    expect(screen.queryByTestId("btn-add-custom-price")).toBeNull();
    expect(screen.getByTestId("btn-wizard-next").hasAttribute("disabled")).toBe(
      false,
    );

    // 4. Objetivo: Horário / Aviso
    fireEvent.click(screen.getByTestId("intent-option-schedule"));
    expect(screen.queryByTestId("input-promo-price")).toBeNull();
    expect(screen.queryByTestId("btn-add-custom-price")).toBeNull();
    expect(screen.getByTestId("btn-wizard-next").hasAttribute("disabled")).toBe(
      false,
    );
  });

  it("deve suportar objetivo 'custom' com campo de descrição e botão opcional de adicionar/remover preço", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Elegance",
          offerTitle: "Estamos Contratando Vendedora",
          promoPrice: "",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Avança para Passo 2
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // Seleciona "Outro (Digitar)"
    fireEvent.click(screen.getByTestId("intent-option-custom"));

    // Campo de texto customizado deve aparecer
    const customIntentInput = screen.getByTestId("input-custom-intent");
    expect(customIntentInput).toBeDefined();

    // Sem customIntentText preenchido, botão Continuar fica desabilitado
    expect(screen.getByTestId("btn-wizard-next").hasAttribute("disabled")).toBe(
      true,
    );

    fireEvent.change(customIntentInput, {
      target: { value: "Vaga de emprego para vendedora comissionada" },
    });
    expect(screen.getByTestId("btn-wizard-next").hasAttribute("disabled")).toBe(
      false,
    );

    // Preço inicialmente oculto para custom, mas botão de adição está presente
    expect(screen.queryByTestId("input-promo-price")).toBeNull();
    const addPriceBtn = screen.getByTestId("btn-add-custom-price");
    expect(addPriceBtn).toBeDefined();

    // Clica em adicionar preço
    fireEvent.click(addPriceBtn);
    expect(screen.getByTestId("input-promo-price")).toBeDefined();

    // Botão de remover preço presente
    const removePriceBtn = screen.getByRole("button", {
      name: /Remover preço/i,
    });
    fireEvent.click(removePriceBtn);
    expect(screen.queryByTestId("input-promo-price")).toBeNull();
  });

  it("deve permitir no Passo 3 pular todas as imagens clicando no botão 'Deixar a IA criar tudo', avançando para o Passo 4", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Elegance",
          offerTitle: "Vestido Midi Seda",
          promoPrice: "R$ 99,90",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Passo 1 -> Passo 2
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    // Passo 2 -> Passo 3
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // Verifica que está no Passo 3
    expect(screen.getByText(/Passo 3 de 4/i)).toBeDefined();
    expect(screen.getByText(/Quer enviar alguma imagem\?/i)).toBeDefined();

    // 3 cartões de foto devem estar presentes
    expect(screen.getByTestId("photo-card-product")).toBeDefined();
    expect(screen.getByTestId("photo-card-reference")).toBeDefined();
    expect(screen.getByTestId("photo-card-logo")).toBeDefined();

    // Botão de pular imagens presente
    const skipBtn = screen.getByTestId("btn-skip-all-images");
    expect(skipBtn).toBeDefined();

    // Clica em pular imagens
    fireEvent.click(skipBtn);

    // Deve avançar diretamente para o Passo 4
    expect(screen.getByText(/Passo 4 de 4/i)).toBeDefined();
    expect(screen.getByText(/4\. Visual do Card/i)).toBeDefined();
    expect(
      screen.getByText(/Escolha o visual e paleta do seu card/i),
    ).toBeDefined();
  });

  it("deve exibir e selecionar por padrão o card 'Estilo do seu Print de Referência' no Passo 4 com nenhum estilo de catálogo selecionado", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "supermarket",
          businessName: "Supermercado Bom Preço",
          offerTitle: "Alcatra Bovina 1kg",
          promoPrice: "R$ 39,90",
          referenceImageDataUrl: "data:image/png;base64,refPrintImage",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Passo 1 -> Passo 2
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    // Passo 2 -> Passo 3
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    // Passo 3 -> Passo 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // No Passo 4, deve exibir o card especial de estilo de referência ativo e selecionado
    const refCard = screen.getByTestId("reference-style-card");
    expect(refCard).toBeDefined();
    expect(refCard.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByText(/Estilo do seu Print de Referência/i),
    ).toBeDefined();
    expect(screen.getByText(/Ativo \/ Recomendado/i)).toBeDefined();
    expect(
      screen.getByText(
        /A IA vai copiar a estética, paleta de cores e tipografia do print que você enviou/i,
      ),
    ).toBeDefined();

    // Nenhum mini-post de catálogo deve estar selecionado por padrão
    const catalogCards = screen.getAllByRole("button").filter((btn) => {
      const label = btn.getAttribute("aria-label");
      return (
        label &&
        label.startsWith("Estilo ") &&
        btn.getAttribute("data-testid") !== "reference-style-card"
      );
    });
    expect(catalogCards.length).toBeGreaterThan(0);
    catalogCards.forEach((card) => {
      expect(card.getAttribute("aria-pressed")).toBe("false");
    });
  });

  it("deve desmarcar o card de referência e selecionar o estilo do catálogo ao clicar em um mini-post", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "supermarket",
          businessName: "Supermercado Bom Preço",
          offerTitle: "Alcatra Bovina 1kg",
          promoPrice: "R$ 39,90",
          referenceImageDataUrl: "data:image/png;base64,refPrintImage",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Navega até Passo 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    const refCard = screen.getByTestId("reference-style-card");
    expect(refCard.getAttribute("aria-pressed")).toBe("true");

    const catalogCards = screen.getAllByRole("button").filter((btn) => {
      const label = btn.getAttribute("aria-label");
      return (
        label &&
        label.startsWith("Estilo ") &&
        btn.getAttribute("data-testid") !== "reference-style-card"
      );
    });
    const firstCatalogCard = catalogCards[0];

    // Clica no primeiro estilo de catálogo
    fireEvent.click(firstCatalogCard);

    // O card de referência é desmarcado
    expect(refCard.getAttribute("aria-pressed")).toBe("false");
    // O estilo de catálogo clicado fica selecionado
    expect(firstCatalogCard.getAttribute("aria-pressed")).toBe("true");
    // Os outros estilos de catálogo continuam desmarcados
    catalogCards.slice(1).forEach((card) => {
      expect(card.getAttribute("aria-pressed")).toBe("false");
    });
  });

  it("deve reativar o card de referência e desmarcar o estilo de catálogo ao clicar novamente no card de referência", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "supermarket",
          businessName: "Supermercado Bom Preço",
          offerTitle: "Alcatra Bovina 1kg",
          promoPrice: "R$ 39,90",
          referenceImageDataUrl: "data:image/png;base64,refPrintImage",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Navega até Passo 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    const refCard = screen.getByTestId("reference-style-card");
    const catalogCards = screen.getAllByRole("button").filter((btn) => {
      const label = btn.getAttribute("aria-label");
      return (
        label &&
        label.startsWith("Estilo ") &&
        btn.getAttribute("data-testid") !== "reference-style-card"
      );
    });
    const firstCatalogCard = catalogCards[0];

    // Clica no estilo de catálogo para ativá-lo
    fireEvent.click(firstCatalogCard);
    expect(refCard.getAttribute("aria-pressed")).toBe("false");
    expect(firstCatalogCard.getAttribute("aria-pressed")).toBe("true");

    // Clica novamente no card de referência
    fireEvent.click(refCard);
    expect(refCard.getAttribute("aria-pressed")).toBe("true");
    expect(firstCatalogCard.getAttribute("aria-pressed")).toBe("false");
  });

  it("não deve exibir o card de referência se referenceImageDataUrl for indefinido ou removido, mantendo a seleção padrão de catálogo", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "supermarket",
          businessName: "Supermercado Bom Preço",
          offerTitle: "Alcatra Bovina 1kg",
          promoPrice: "R$ 39,90",
          referenceImageDataUrl: undefined,
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Navega até Passo 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // O card de referência não deve existir
    expect(screen.queryByTestId("reference-style-card")).toBeNull();

    // O primeiro estilo de catálogo deve estar selecionado por padrão
    const catalogCards = screen.getAllByRole("button").filter((btn) => {
      const label = btn.getAttribute("aria-label");
      return (
        label &&
        label.startsWith("Estilo ") &&
        btn.getAttribute("data-testid") !== "reference-style-card"
      );
    });
    expect(catalogCards[0].getAttribute("aria-pressed")).toBe("true");
    catalogCards.slice(1).forEach((card) => {
      expect(card.getAttribute("aria-pressed")).toBe("false");
    });
  });

  it("deve permitir selecionar paleta rápida no Passo 4", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Elegance",
          offerTitle: "Coleção Outono",
          promoPrice: "R$ 89,90",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Navega até Passo 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // Verifica chips de paleta rápida
    const blackGoldChip = screen.getByTestId("palette-chip-black-gold");
    expect(blackGoldChip).toBeDefined();

    fireEvent.click(blackGoldChip);
    expect(blackGoldChip.getAttribute("aria-pressed")).toBe("true");

    const customPaletteInput = screen.getByTestId(
      "input-custom-palette",
    ) as HTMLInputElement;
    expect(customPaletteInput.value).toBe("Paleta: Preto e Dourado");
  });

  it("deve permitir voltar passos através do botão 'Voltar' do rodapé fixo", () => {
    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Elegance",
          offerTitle: "Vestido Seda",
          promoPrice: "R$ 89,90",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // Avança 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    expect(screen.getByText(/Passo 4 de 4/i)).toBeDefined();

    // Volta 4 -> 3
    fireEvent.click(screen.getByTestId("btn-wizard-back"));
    expect(screen.getByText(/Passo 3 de 4/i)).toBeDefined();

    // Volta 3 -> 2
    fireEvent.click(screen.getByTestId("btn-wizard-back"));
    expect(screen.getByText(/Passo 2 de 4/i)).toBeDefined();

    // Volta 2 -> 1
    fireEvent.click(screen.getByTestId("btn-wizard-back"));
    expect(screen.getByText(/Passo 1 de 4/i)).toBeDefined();
    // No Passo 1, botão voltar não existe mais
    expect(screen.queryByTestId("btn-wizard-back")).toBeNull();
  });

  it("deve disparar geração e redirecionar para /checkout/$orderId com orderId ao tocar em 'Gerar Meu Card'", async () => {
    const onNavigateToCheckout = vi.fn();

    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Elegance",
          offerTitle: "Vestido Seda Elegance",
          promoPrice: "R$ 120,00",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
        onNavigateToCheckout={onNavigateToCheckout}
      />,
    );

    // Navega 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // No Passo 4, botão é "Gerar Meu Card"
    const generateBtn = screen.getByTestId("btn-wizard-generate");
    expect(generateBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalledTimes(1);
      expect(mockGeneratePreview).toHaveBeenCalledWith({
        data: { draftId: "draft-abc-123" },
      });
      expect(mockInitiateCheckout).toHaveBeenCalledWith({
        data: {
          draftId: "draft-abc-123",
        },
      });
      expect(onNavigateToCheckout).toHaveBeenCalledWith("order-pix-789");
    });
  });

  it("deve exibir alerta de erro e não redirecionar quando a geração por IA falhar", async () => {
    const mockFailedPreview = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
        status: "ERROR",
        code: "AI_GENERATION_FAILED",
        message: "Instabilidade temporária na IA. Tente novamente.",
      }));

    const onNavigateToCheckout = vi.fn();

    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Elegance",
          offerTitle: "Vestido Seda Elegance",
          promoPrice: "R$ 120,00",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockFailedPreview}
        initiateCheckoutFn={mockInitiateCheckout}
        onNavigateToCheckout={onNavigateToCheckout}
      />,
    );

    // Navega para o Passo 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    const generateBtn = screen.getByTestId("btn-wizard-generate");
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-generation-error-alert")).toBeDefined();
      expect(
        screen.getByText(/Instabilidade temporária na IA\. Tente novamente\./i),
      ).toBeDefined();
      expect(onNavigateToCheckout).not.toHaveBeenCalled();
    });
  });

  it("permite selecionar formato Story no Passo 2 e envia targetAspectRatio: 'story' ao salvar rascunho", async () => {
    let capturedSavePayload: SaveOfferDraftInput | null = null;
    const trackingSaveDraft = vi
      .fn()
      .mockImplementation(
        async (arg: {
          data: SaveOfferDraftInput;
        }): Promise<SaveDraftResponse> => {
          capturedSavePayload = arg.data;
          return {
            success: true,
            draftId: "draft-story-123",
            draft: {
              id: "draft-story-123",
              businessSegment: "fashion",
              targetAspectRatio: arg?.data?.targetAspectRatio || "story",
              cardIntent: "promo",
              customIntentText: null,
              logoImageDataUrl: null,
              businessName: "Boutique Flor",
              offerTitle: "Vestido Floral",
              promoPrice: "R$ 89,90",
              originalPrice: null,
              callToAction: null,
              whatsapp: null,
              productImageDataUrl: null,
              referenceImageDataUrl: null,
              stylePresetId: "fashion-boutique",
              customStyleInstructions: null,
              previewCardImageUrl: null,
              aiGenerationCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          };
        },
      );

    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Flor",
          offerTitle: "Vestido Floral",
          promoPrice: "R$ 89,90",
        }}
        saveDraftFn={trackingSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
      />,
    );

    // No Passo 1, seleciona Story abaixo dos segmentos
    const storyBtn = screen.getByTestId("aspect-ratio-story");
    fireEvent.click(storyBtn);
    expect(storyBtn.getAttribute("aria-pressed")).toBe("true");

    // Passo 1 -> Avança para Passo 2
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // Avança Passo 2 -> Passo 3
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // Avança Passo 3 -> Passo 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // Passo 4: clica em Gerar Card com IA
    const generateBtn = screen.getByTestId("btn-wizard-generate");
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(trackingSaveDraft).toHaveBeenCalled();
      expect(capturedSavePayload?.targetAspectRatio).toBe("story");
    });
  });

  it("deve exibir indicador de cotas restantes no Passo 4 a partir de getPreviewQuotaFn", async () => {
    const mockGetQuota = vi.fn().mockResolvedValue({
      remaining: 1,
      blockedReason: null,
    });

    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Flor",
          offerTitle: "Vestido Floral",
          promoPrice: "R$ 89,90",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        getPreviewQuotaFn={mockGetQuota}
      />,
    );

    // Avança 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    // No Passo 4, indicador de cota restante visível
    await waitFor(() => {
      expect(screen.getByTestId("quota-counter")).toBeDefined();
      expect(screen.getByText(/1 prévia grátis restante hoje/i)).toBeDefined();
    });
  });

  it("deve manter botão habilitado com 'Continuar e Gerar Card' e exibir mensagem amigável quando cota estiver esgotada", async () => {
    const mockBlockedQuota = vi.fn().mockResolvedValue({
      remaining: 0,
      blockedReason: "visitor",
    });

    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Flor",
          offerTitle: "Vestido Floral",
          promoPrice: "R$ 89,90",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        getPreviewQuotaFn={mockBlockedQuota}
      />,
    );

    // Avança 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    await waitFor(() => {
      const btn = screen.getByTestId("btn-wizard-generate");
      expect(btn).toBeDefined();
      expect(btn.hasAttribute("disabled")).toBe(false);
      expect(screen.getByText("Continuar e Gerar Card")).toBeDefined();
      expect(
        screen.getByText(
          /Você usou suas 2 prévias grátis de hoje\. Confirme o Pix \(R\$ 9,90\) e nossa IA criará seu card logo após o pagamento\./i,
        ),
      ).toBeDefined();
    });
  });

  it("deve salvar rascunho e iniciar checkout diretamente sem chamar generatePreviewFn ao clicar em 'Continuar e Gerar Card' com cota esgotada", async () => {
    const mockBlockedQuota = vi.fn().mockResolvedValue({
      remaining: 0,
      blockedReason: "visitor",
    });
    const onNavigateToCheckout = vi.fn();

    render(
      <OfferCreationWizard
        initialDraft={{
          businessSegment: "fashion",
          businessName: "Boutique Flor",
          offerTitle: "Vestido Floral",
          promoPrice: "R$ 89,90",
        }}
        saveDraftFn={mockSaveDraft}
        generatePreviewFn={mockGeneratePreview}
        initiateCheckoutFn={mockInitiateCheckout}
        getPreviewQuotaFn={mockBlockedQuota}
        onNavigateToCheckout={onNavigateToCheckout}
      />,
    );

    // Avança 1 -> 2 -> 3 -> 4
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));
    fireEvent.click(screen.getByTestId("btn-wizard-next"));

    await waitFor(() => {
      const ctaBtn = screen.getByTestId("btn-wizard-generate");
      expect(ctaBtn).toBeDefined();
      expect(screen.getByText("Continuar e Gerar Card")).toBeDefined();
    });

    // Clicar em "Continuar e Gerar Card"
    const ctaBtn = screen.getByTestId("btn-wizard-generate");
    await act(async () => {
      fireEvent.click(ctaBtn);
    });

    await waitFor(() => {
      // 1. Rascunho é salvo
      expect(mockSaveDraft).toHaveBeenCalledTimes(1);
      // 2. IA NÃO é chamada para gerar prévia
      expect(mockGeneratePreview).not.toHaveBeenCalled();
      // 3. Checkout é iniciado diretamente com o draftId
      expect(mockInitiateCheckout).toHaveBeenCalledWith({
        data: {
          draftId: "draft-abc-123",
        },
      });
      // 4. Redirecionamento ocorre com o orderId
      expect(onNavigateToCheckout).toHaveBeenCalledWith("order-pix-789");
    });
  });
});
