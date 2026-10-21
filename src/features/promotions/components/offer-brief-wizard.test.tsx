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
import { OfferBriefWizard } from "./offer-brief-wizard";
import { ContextualAiLoader } from "./contextual-ai-loader";
import { CardArtCanvas } from "./card-art-canvas";
import { UtensilsCrossed } from "lucide-react";
import type {
  GeneratePreviewResponse,
  SaveDraftResponse,
  OfferDraft,
} from "../server";
import type { SaveOfferDraftInput } from "../data/offer-brief.schema";

function createMockDraft(overrides: Partial<OfferDraft> = {}): OfferDraft {
  const { targetAspectRatio, cardIntent, ...restOverrides } = overrides;
  return {
    id: "draft-123",
    businessSegment: "supermarket",
    targetAspectRatio: targetAspectRatio ?? "feed",
    cardIntent: cardIntent ?? "promo",
    customIntentText: null,
    logoImageDataUrl: null,
    businessName: "Mercado Central",
    offerTitle: "Oferta",
    promoPrice: "R$ 10,00",
    originalPrice: null,
    callToAction: null,
    whatsapp: null,
    productImageDataUrl: null,
    referenceImageDataUrl: null,
    stylePresetId: null,
    customStyleInstructions: null,
    cleanMasterImageDataUrl: null,
    previewCardImageUrl: null,
    previewAssetKey: null,
    cleanMasterAssetKey: null,
    aiGenerationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...restOverrides,
  };
}

describe("OfferBriefWizard Component & AI Generation Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockSuccessfulSave = vi
    .fn()
    .mockImplementation(async (): Promise<SaveDraftResponse> => ({
      success: true,
      draftId: "draft-123",
      draft: createMockDraft(),
    }));

  const mockSuccessfulPreview = vi
    .fn()
    .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
      success: true,
      previewUrl: "data:image/png;base64,mockWatermarkedPng",
      aiGenerationCount: 1,
    }));

  it("deve navegar da Etapa 1 para Etapa 2 e avançar para Etapa 3 gerando prévia por IA", async () => {
    render(
      <OfferBriefWizard
        saveDraftFn={mockSuccessfulSave}
        generatePreviewFn={mockSuccessfulPreview}
      />,
    );

    // Passo 1: Seleção de segmento -> clicar em avançar
    const step1NextBtn = screen.getByRole("button", {
      name: /Avançar para dados da oferta/i,
    });
    fireEvent.click(step1NextBtn);

    // Passo 2: Botão Gerar Prévia com IA presente
    expect(
      screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
    ).toBeDefined();

    // Clicar em Gerar Prévia com IA
    const generateBtn = screen.getByRole("button", {
      name: /Gerar Prévia com IA/i,
    });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(mockSuccessfulSave).toHaveBeenCalledTimes(1);
      expect(mockSuccessfulPreview).toHaveBeenCalledWith({
        data: { draftId: "draft-123" },
      });
    });

    // Passo 3: Prévia renderizada com sucesso
    await waitFor(() => {
      expect(screen.getByText(/Prévia do Card IA/i)).toBeDefined();
      expect(
        screen.getByRole("button", {
          name: /Liberar em HD sem marca d'água/i,
        }),
      ).toBeDefined();
    });
  });

  it("deve renderizar a imagem real protegida gerada pelo servidor na Etapa 3", async () => {
    render(
      <OfferBriefWizard
        initialDraft={{
          id: "draft-123",
          previewCardImageUrl: "data:image/png;base64,realServerImage",
          aiGenerationCount: 1,
          businessName: "Pizzaria Bella",
          offerTitle: "Pizza Calabresa Especial",
          promoPrice: "R$ 39,90",
        }}
        saveDraftFn={mockSuccessfulSave}
        generatePreviewFn={mockSuccessfulPreview}
      />,
    );

    // Avançar para Etapa 2
    fireEvent.click(
      screen.getByRole("button", { name: /Avançar para dados da oferta/i }),
    );

    // Gerar prévia (ou avançar)
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
      );
    });

    await waitFor(() => {
      const img = screen.getByRole("img", {
        name: /Pizza Calabresa Especial|Card Publicitário/i,
      });
      expect(img).toBeDefined();
      expect(img.getAttribute("src")).toBe(
        "data:image/png;base64,mockWatermarkedPng",
      );
    });
  });

  it("deve exibir banner de paywall informativo quando cota gratuita for esgotada (AI_QUOTA_EXCEEDED)", async () => {
    const mockQuotaExceeded = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
        success: false,
        code: "AI_QUOTA_EXCEEDED",
        message:
          "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a até 3 regenerações.",
        previewUrl: "data:image/png;base64,existingCard",
        aiGenerationCount: 1,
      }));

    render(
      <OfferBriefWizard
        saveDraftFn={mockSuccessfulSave}
        generatePreviewFn={mockQuotaExceeded}
      />,
    );

    // Passo 1 -> Passo 2
    fireEvent.click(
      screen.getByRole("button", { name: /Avançar para dados da oferta/i }),
    );

    // Disparar geração
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
      );
    });

    // Deve navegar para a Etapa 3 e exibir o Banner Informativo de Paywall
    await waitFor(() => {
      expect(
        screen.getByText(/Limite da prévia gratuita atingido/i),
      ).toBeDefined();
      expect(
        screen.getByText(
          /Você já gerou sua prévia gratuita deste rascunho\. Para gerar novas variações ou refinar com IA, conclua o pagamento Pix \(R\$ 9,90\)/i,
        ),
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: /Pagar com Pix \(R\$ 9,90\)/i }),
      ).toBeDefined();
    });
  });

  it("deve permanecer na Etapa 2 e exibir alerta com 'Tentar Novamente' quando ocorrer erro de IA (AI_GENERATION_FAILED)", async () => {
    const mockFailedGeneration = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
        success: false,
        code: "AI_GENERATION_FAILED",
        message:
          "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
        aiGenerationCount: 0,
      }));

    render(
      <OfferBriefWizard
        saveDraftFn={mockSuccessfulSave}
        generatePreviewFn={mockFailedGeneration}
      />,
    );

    // Passo 1 -> Passo 2
    fireEvent.click(
      screen.getByRole("button", { name: /Avançar para dados da oferta/i }),
    );

    // Disparar geração
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
      );
    });

    // Deve permanecer na Etapa 2 e exibir o Alerta de Erro
    await waitFor(() => {
      expect(
        screen.getByText(/Instabilidade temporária na geração por IA/i),
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: /Tentar Novamente/i }),
      ).toBeDefined();
      // O formulário ainda está na Etapa 2
      expect(
        screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
      ).toBeDefined();
    });
  });

  it("deve alternar aspecto Feed (4:5) e Story (9:16) no LiveCardPreview", async () => {
    render(
      <OfferBriefWizard
        initialDraft={{
          id: "draft-123",
          previewCardImageUrl: "data:image/png;base64,realServerImage",
          aiGenerationCount: 1,
        }}
        saveDraftFn={mockSuccessfulSave}
        generatePreviewFn={mockSuccessfulPreview}
      />,
    );

    // Avançar até Etapa 3
    fireEvent.click(
      screen.getByRole("button", { name: /Avançar para dados da oferta/i }),
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Card Publicitário \(1080.*1350\)/),
      ).toBeDefined();
    });

    // Alternar para Story
    const storyBtn = screen.getByRole("button", { name: /Story \(9:16\)/i });
    fireEvent.click(storyBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Card Publicitário \(1080.*1920\)/),
      ).toBeDefined();
    });
  });

  it("deve permitir selecionar formato Story (9:16) na Etapa 2 e sincronizar com a prévia na Etapa 3", async () => {
    const mockSaveWithStory = vi
      .fn()
      .mockImplementation(async ({ data }: { data: SaveOfferDraftInput }) => ({
        success: true,
        draftId: "draft-123",
        draft: createMockDraft({ targetAspectRatio: data.targetAspectRatio }),
      }));

    render(
      <OfferBriefWizard
        saveDraftFn={mockSaveWithStory}
        generatePreviewFn={mockSuccessfulPreview}
      />,
    );

    // Passo 1 -> Passo 2
    fireEvent.click(
      screen.getByRole("button", { name: /Avançar para dados da oferta/i }),
    );

    // Seletores de Formato do Card
    const feedBtn = screen.getByTestId("aspect-ratio-feed");
    const storyBtn = screen.getByTestId("aspect-ratio-story");
    expect(feedBtn).toBeDefined();
    expect(storyBtn).toBeDefined();
    expect(feedBtn.getAttribute("aria-pressed")).toBe("true");
    expect(storyBtn.getAttribute("aria-pressed")).toBe("false");

    // Selecionar Story (9:16)
    fireEvent.click(storyBtn);
    expect(storyBtn.getAttribute("aria-pressed")).toBe("true");
    expect(feedBtn.getAttribute("aria-pressed")).toBe("false");

    // Gerar Prévia com IA
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
      );
    });

    await waitFor(() => {
      expect(mockSaveWithStory).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetAspectRatio: "story",
        }),
      });
      // Na Etapa 3, o LiveCardPreview deve inicializar no formato Story (1080×1920)
      expect(
        screen.getByText(/Card Publicitário \(1080.*1920\)/),
      ).toBeDefined();
    });
  });

  it("deve atualizar reativamente a galeria de estilos no Passo 2 e redefinir para o estilo padrão ao trocar de segmento no Passo 1", async () => {
    render(
      <OfferBriefWizard
        saveDraftFn={mockSuccessfulSave}
        generatePreviewFn={mockSuccessfulPreview}
      />,
    );

    // Passo 1: Selecionar "Salão de Beleza & Barbearia"
    const beautySegmentBtn = screen.getByRole("button", {
      name: /Salão de Beleza & Barbearia/i,
    });
    fireEvent.click(beautySegmentBtn);

    // Avançar para o Passo 2
    fireEvent.click(
      screen.getByRole("button", { name: /Avançar para dados da oferta/i }),
    );

    // Verificar se os estilos de beleza são exibidos e se 'Glamour Rose Gold & Editorial' está selecionado
    await waitFor(() => {
      expect(screen.getByText(/Glamour Rose Gold & Editorial/i)).toBeDefined();
      expect(
        screen.getByText(/Barbearia Retrô Couro & Madeira/i),
      ).toBeDefined();
      expect(screen.getByText(/Clínica & Estética Serenity/i)).toBeDefined();
      expect(screen.getByText(/Degradê Urbano & Streetwear/i)).toBeDefined();
    });

    // O estilo padrão 'Glamour Rose Gold & Editorial' deve estar selecionado com aria-pressed="true"
    const glamourCard = screen.getByRole("button", {
      name: /Selecionar estilo Glamour Rose Gold & Editorial/i,
    });
    expect(glamourCard.getAttribute("aria-pressed")).toBe("true");
  });

  it("deve persistir o stylePresetId selecionado na galeria ao gerar a prévia com IA", async () => {
    const mockSaveWithStyle = vi
      .fn()
      .mockImplementation(async ({ data }: { data: SaveOfferDraftInput }) => ({
        success: true,
        draftId: "draft-123",
        draft: createMockDraft({ stylePresetId: data.stylePresetId }),
      }));

    render(
      <OfferBriefWizard
        saveDraftFn={mockSaveWithStyle}
        generatePreviewFn={mockSuccessfulPreview}
      />,
    );

    // Avançar do Passo 1 para o Passo 2 (Supermercado)
    fireEvent.click(
      screen.getByRole("button", { name: /Avançar para dados da oferta/i }),
    );

    // No Passo 2, selecionar o estilo "Feira & Hortifrúti Natural"
    await waitFor(() => {
      expect(screen.getByText(/Feira & Hortifrúti Natural/i)).toBeDefined();
    });

    const freshStyleCard = screen.getByRole("button", {
      name: /Selecionar estilo Feira & Hortifrúti Natural/i,
    });
    fireEvent.click(freshStyleCard);

    // Clicar em "Gerar Prévia com IA"
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
      );
    });

    await waitFor(() => {
      expect(mockSaveWithStyle).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stylePresetId: "market-fresh",
        }),
      });
    });
  });

  it("deve disparar initiateCheckoutFn na Etapa 3 e navegar para checkout com orderId", async () => {
    const mockInitiateCheckout = vi.fn().mockResolvedValue({
      orderId: "order-abc-123",
    });
    const onNavigateToCheckout = vi.fn();

    render(
      <OfferBriefWizard
        initialDraft={{
          id: "draft-123",
          businessSegment: "supermarket",
          businessName: "Mercado Central",
          offerTitle: "Oferta de Frutas",
          promoPrice: "R$ 4,99",
          previewCardImageUrl: "data:image/png;base64,mockPreview",
        }}
        saveDraftFn={mockSuccessfulSave}
        generatePreviewFn={mockSuccessfulPreview}
        initiateCheckoutFn={mockInitiateCheckout}
        onNavigateToCheckout={onNavigateToCheckout}
      />,
    );

    // Avança para a Etapa 2
    fireEvent.click(
      screen.getByRole("button", { name: /Avançar para dados da oferta/i }),
    );

    // Clica para Gerar Prévia com IA -> Etapa 3
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Gerar Prévia com IA/i }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Gostou da prévia\?/i)).toBeDefined();
    });

    // Clica no botão de checkout
    const checkoutBtn = screen.getByRole("button", {
      name: /Liberar em HD sem marca d'água/i,
    });
    await act(async () => {
      fireEvent.click(checkoutBtn);
    });

    await waitFor(() => {
      expect(mockInitiateCheckout).toHaveBeenCalledWith({
        data: expect.objectContaining({
          draftId: "draft-123",
        }),
      });
      expect(onNavigateToCheckout).toHaveBeenCalledWith("order-abc-123");
    });
  });
});

describe("ContextualAiLoader Component", () => {
  it("deve renderizar as mensagens corretas para cada etapa de geração", () => {
    const { rerender } = render(
      <ContextualAiLoader open={true} stage="briefing" />,
    );

    expect(
      screen.getByText(/Interpretando seu briefing e insumos visuais\.\.\./i),
    ).toBeDefined();

    rerender(<ContextualAiLoader open={true} stage="composing" />);
    expect(
      screen.getByText(
        /Compondo o cenário e iluminação comercial com IA\.\.\./i,
      ),
    ).toBeDefined();

    rerender(<ContextualAiLoader open={true} stage="watermarking" />);
    expect(
      screen.getByText(
        /Integrando textos e aplicando proteção de prévia\.\.\./i,
      ),
    ).toBeDefined();
  });
});

describe("CardArtCanvas Component", () => {
  it("deve renderizar a imagem real quando previewCardImageUrl for fornecida", () => {
    render(
      <CardArtCanvas
        currentRatio="feed"
        activePreset={{
          label: "Estilo Moderno",
          previewBadgeColor: "#10b981",
        }}
        previewCardImageUrl="data:image/png;base64,bakedPng"
        placeholderBusinessName="Pizzaria"
        placeholderOfferTitle="Pizza"
        placeholderPromoPrice="R$ 30,00"
        placeholderCallToAction="Peça já"
        SegmentIcon={UtensilsCrossed}
      />,
    );

    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("data:image/png;base64,bakedPng");
  });

  it("deve renderizar fundo harmônico desfocado quando targetAspectRatio for diferente de currentRatio", () => {
    const { container } = render(
      <CardArtCanvas
        currentRatio="story"
        targetAspectRatio="feed"
        activePreset={{
          label: "Estilo Moderno",
          previewBadgeColor: "#10b981",
        }}
        previewCardImageUrl="data:image/png;base64,feedCard"
        placeholderBusinessName="Pizzaria"
        placeholderOfferTitle="Pizza"
        placeholderPromoPrice="R$ 30,00"
        placeholderCallToAction="Peça já"
        SegmentIcon={UtensilsCrossed}
      />,
    );

    // Deve conter imagem em object-contain e camada de fundo com backdrop-blur-md
    expect(container.querySelector(".backdrop-blur-md")).toBeDefined();
    expect(container.querySelector(".object-contain")).toBeDefined();
  });

  it("deve renderizar imagem nativa em object-cover quando targetAspectRatio for igual a currentRatio", () => {
    const { container } = render(
      <CardArtCanvas
        currentRatio="feed"
        targetAspectRatio="feed"
        activePreset={{
          label: "Estilo Moderno",
          previewBadgeColor: "#10b981",
        }}
        previewCardImageUrl="data:image/png;base64,feedCard"
        placeholderBusinessName="Pizzaria"
        placeholderOfferTitle="Pizza"
        placeholderPromoPrice="R$ 30,00"
        placeholderCallToAction="Peça já"
        SegmentIcon={UtensilsCrossed}
      />,
    );

    expect(container.querySelector(".object-cover")).toBeDefined();
    expect(container.querySelector(".object-contain")).toBeNull();
  });

  it("deve renderizar a marca d'água simulada quando não houver imagem do servidor", () => {
    render(
      <CardArtCanvas
        currentRatio="feed"
        activePreset={{
          label: "Estilo Moderno",
          previewBadgeColor: "#10b981",
        }}
        placeholderBusinessName="Pizzaria"
        placeholderOfferTitle="Pizza"
        placeholderPromoPrice="R$ 30,00"
        placeholderCallToAction="Peça já"
        SegmentIcon={UtensilsCrossed}
        showWatermark={true}
      />,
    );

    expect(screen.getByText(/PRÉVIA OFERTAPRONTA/i)).toBeDefined();
    expect(
      screen.getByText(/ARTE PROTEGIDA • LIBERAÇÃO PÓS-PIX/i),
    ).toBeDefined();
  });
});
