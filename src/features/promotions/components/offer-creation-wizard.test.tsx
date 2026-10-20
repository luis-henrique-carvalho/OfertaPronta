// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import { OfferCreationWizard } from "./offer-creation-wizard";
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
        cleanMasterImageDataUrl: null,
        previewCardImageUrl: null,
        aiGenerationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));

  const mockGeneratePreview = vi
    .fn()
    .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
      success: true,
      previewUrl: "data:image/png;base64,mockPreviewDataUrl",
      aiGenerationCount: 1,
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

  it("deve exibir banner de Print de Referência Ativo no Passo 4 se houver imagem de referência enviada", () => {
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

    // No Passo 4, deve exibir o banner de referência ativo
    expect(screen.getByTestId("reference-image-active-banner")).toBeDefined();
    expect(screen.getByText(/Print de Referência Ativo!/i)).toBeDefined();
    expect(
      screen.getByText(/A IA vai seguir o formato do print que você enviou/i),
    ).toBeDefined();
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
    expect(customPaletteInput.value).toBe("Paleta Preto e Dourado");
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
        success: false,
        code: "AI_GENERATION_FAILED",
        message: "Instabilidade temporária na IA. Tente novamente.",
        aiGenerationCount: 0,
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
});
