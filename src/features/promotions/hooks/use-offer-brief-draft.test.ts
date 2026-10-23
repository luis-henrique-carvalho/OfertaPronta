// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useOfferBriefDraft, isStep2Valid } from "./use-offer-brief-draft";
import type {
  GeneratePreviewResponse,
  SaveDraftResponse,
  OfferDraft,
} from "../server";
import {
  REFERENCE_STYLE_PRESET_ID,
  type SaveOfferDraftInput,
} from "../data/offer-brief.schema";

function createMockDraft(overrides: Partial<OfferDraft> = {}): OfferDraft {
  const { cardIntent, ...restOverrides } = overrides;
  return {
    id: "draft-xyz",
    businessSegment: "supermarket",
    targetAspectRatio: "feed",
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
    previewCardImageUrl: null,
    aiGenerationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...restOverrides,
  };
}

describe("useOfferBriefDraft Hook - AI Preview Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockSave = vi
    .fn()
    .mockImplementation(async (): Promise<SaveDraftResponse> => ({
      success: true,
      draftId: "draft-xyz",
      draft: createMockDraft(),
    }));

  it("deve inicializar com os estados de IA padrão", () => {
    const { result } = renderHook(() =>
      useOfferBriefDraft({
        initialDraft: {
          id: "draft-1",
          previewCardImageUrl: "data:image/png;base64,initialPreview",
          aiGenerationCount: 1,
        },
      }),
    );

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationStage).toBe("briefing");
    expect(result.current.generationError).toBeNull();
    expect(result.current.previewCardImageUrl).toBe(
      "data:image/png;base64,initialPreview",
    );
    expect(result.current.aiGenerationCount).toBe(1);
  });

  it("deve executar generateAiPreview com sucesso e atualizar estados", async () => {
    const mockDraft = {
      id: "draft-xyz",
      businessSegment: "supermarket" as const,
      targetAspectRatio: "feed" as const,
      businessName: "Mercado Central",
      offerTitle: "Oferta",
      promoPrice: "R$ 10,00",
      cardIntent: "promo" as const,
      previewCardImageUrl: "data:image/png;base64,newPreviewUrl",
      aiGenerationCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockPreview = vi.fn().mockImplementation(async () => ({
      status: "OK" as const,
      draft: mockDraft,
    }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockPreview,
      }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.generateAiPreview();
    });

    expect(res).toMatchObject({
      status: "OK",
      draft: mockDraft,
      previewUrl: "data:image/png;base64,newPreviewUrl",
      aiGenerationCount: 1,
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.previewCardImageUrl).toBe(
      "data:image/png;base64,newPreviewUrl",
    );
    expect(result.current.aiGenerationCount).toBe(1);
    expect(result.current.isLimitReached).toBe(false);
    expect(result.current.generationError).toBeNull();
  });

  it("deve tratar cota esgotada LIMIT_REACHED preservando a prévia anterior sem marcar erro genérico", async () => {
    const mockLastDraft = {
      id: "draft-xyz",
      businessSegment: "supermarket" as const,
      targetAspectRatio: "feed" as const,
      businessName: "Mercado Central",
      offerTitle: "Oferta",
      promoPrice: "R$ 10,00",
      cardIntent: "promo" as const,
      previewCardImageUrl: "data:image/png;base64,existingCard",
      aiGenerationCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockQuota = vi.fn().mockImplementation(async () => ({
      status: "LIMIT_REACHED" as const,
      reason: "visitor" as const,
      lastDraft: mockLastDraft,
    }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockQuota,
      }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.generateAiPreview();
    });

    expect(res).toMatchObject({
      status: "LIMIT_REACHED",
      reason: "visitor",
      lastDraft: mockLastDraft,
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isLimitReached).toBe(true);
    expect(result.current.limitReason).toBe("visitor");
    expect(result.current.lastDraft).toEqual(mockLastDraft);
    expect(result.current.previewCardImageUrl).toBe(
      "data:image/png;base64,existingCard",
    );
    // CRÍTICO: Não deve ter generationError no LIMIT_REACHED
    expect(result.current.generationError).toBeNull();
  });

  it("deve tratar LIMIT_REACHED com reason 'ip' e lastDraft nulo", async () => {
    const mockQuotaIp = vi.fn().mockImplementation(async () => ({
      status: "LIMIT_REACHED" as const,
      reason: "ip" as const,
      lastDraft: null,
    }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockQuotaIp,
      }),
    );

    await act(async () => {
      await result.current.generateAiPreview();
    });

    expect(result.current.isLimitReached).toBe(true);
    expect(result.current.limitReason).toBe("ip");
    expect(result.current.lastDraft).toBeNull();
    expect(result.current.generationError).toBeNull();
  });

  it("deve tratar LIMIT_REACHED com reason 'global' e permitir checkout do lastDraft via initiateLastDraftCheckout", async () => {
    const mockLastDraft = {
      id: "draft-previous-id",
      businessSegment: "supermarket" as const,
      targetAspectRatio: "feed" as const,
      businessName: "Mercado Central",
      offerTitle: "Oferta",
      promoPrice: "R$ 10,00",
      cardIntent: "promo" as const,
      previewCardImageUrl: "data:image/png;base64,globalPreview",
      aiGenerationCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockQuotaGlobal = vi.fn().mockImplementation(async () => ({
      status: "LIMIT_REACHED" as const,
      reason: "global" as const,
      lastDraft: mockLastDraft,
    }));

    const mockCheckout = vi.fn().mockImplementation(async () => ({
      orderId: "order-from-last-draft",
    }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockQuotaGlobal,
        initiateCheckoutFn: mockCheckout,
      }),
    );

    await act(async () => {
      await result.current.generateAiPreview();
    });

    expect(result.current.isLimitReached).toBe(true);
    expect(result.current.limitReason).toBe("global");

    let checkoutResult: unknown;
    await act(async () => {
      checkoutResult = await result.current.initiateLastDraftCheckout();
    });

    expect(checkoutResult).toEqual({
      success: true,
      orderId: "order-from-last-draft",
    });
    expect(mockCheckout).toHaveBeenCalledWith({
      data: {
        draftId: "draft-previous-id",
      },
    });
  });

  it("deve capturar erro AI_GENERATION_FAILED e permitir limpeza com clearGenerationError", async () => {
    const mockFail = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
        status: "ERROR",
        code: "AI_GENERATION_FAILED",
        message: "Instabilidade transitória na IA",
      }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockFail,
      }),
    );

    await act(async () => {
      await result.current.generateAiPreview();
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationError).toEqual({
      code: "AI_GENERATION_FAILED",
      message: "Instabilidade transitória na IA",
    });

    // Limpar erro
    act(() => {
      result.current.clearGenerationError();
    });

    expect(result.current.generationError).toBeNull();
  });
});

describe("useOfferBriefDraft Hook - targetAspectRatio & updateField", () => {
  it("deve inicializar com targetAspectRatio padrão 'feed' no estado e no formData", () => {
    const { result } = renderHook(() => useOfferBriefDraft());
    expect(result.current.targetAspectRatio).toBe("feed");
    expect(result.current.formData.targetAspectRatio).toBe("feed");
  });

  it("deve inicializar com targetAspectRatio customizado se fornecido em initialDraft", () => {
    const { result } = renderHook(() =>
      useOfferBriefDraft({
        initialDraft: {
          targetAspectRatio: "story",
        },
      }),
    );
    expect(result.current.targetAspectRatio).toBe("story");
    expect(result.current.formData.targetAspectRatio).toBe("story");
  });

  it("deve permitir alterar targetAspectRatio via setTargetAspectRatio", () => {
    const { result } = renderHook(() => useOfferBriefDraft());
    act(() => {
      result.current.setTargetAspectRatio("story");
    });
    expect(result.current.targetAspectRatio).toBe("story");
    expect(result.current.formData.targetAspectRatio).toBe("story");
  });

  it("deve permitir alterar targetAspectRatio e outros campos via updateField", () => {
    const { result } = renderHook(() => useOfferBriefDraft());
    act(() => {
      result.current.updateField("targetAspectRatio", "story");
      result.current.updateField("businessName", "Barbearia Vintage");
    });
    expect(result.current.targetAspectRatio).toBe("story");
    expect(result.current.formData.targetAspectRatio).toBe("story");
    expect(result.current.businessName).toBe("Barbearia Vintage");
    expect(result.current.formData.businessName).toBe("Barbearia Vintage");
  });

  it("deve incluir targetAspectRatio no payload ao salvar draft", async () => {
    const mockSaveWithCheck = vi
      .fn()
      .mockImplementation(async ({ data }: { data: SaveOfferDraftInput }) => {
        expect(data.targetAspectRatio).toBe("story");
        return {
          success: true,
          draftId: "draft-xyz",
          draft: createMockDraft({ targetAspectRatio: "story" }),
        };
      });

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSaveWithCheck,
      }),
    );

    act(() => {
      result.current.setTargetAspectRatio("story");
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mockSaveWithCheck).toHaveBeenCalledTimes(1);
    expect(mockSaveWithCheck).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetAspectRatio: "story",
      }),
    });
  });
});

describe("useOfferBriefDraft Hook - Style Presets, Mutual Exclusivity and Reactive Segment Change", () => {
  it("deve inicializar com o primeiro estilo padrão do segmento (supermarket -> market-discount)", () => {
    const { result } = renderHook(() => useOfferBriefDraft());
    expect(result.current.businessSegment).toBe("supermarket");
    expect(result.current.stylePresetId).toBe("market-discount");
  });

  it("deve preservar stylePresetId existente quando fornecido em initialDraft", () => {
    const { result } = renderHook(() =>
      useOfferBriefDraft({
        initialDraft: {
          id: "draft-preserved",
          businessSegment: "supermarket",
          stylePresetId: "market-premium",
        },
      }),
    );
    expect(result.current.stylePresetId).toBe("market-premium");
  });

  it("deve redefinir reativamente o stylePresetId e limpar referenceImageDataUrl ao alterar o segmento comercial", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setReferenceImageDataUrl(
        "data:image/png;base64,sampleReference",
      );
    });

    expect(result.current.referenceImageDataUrl).toBe(
      "data:image/png;base64,sampleReference",
    );
    expect(result.current.stylePresetId).toBe(REFERENCE_STYLE_PRESET_ID);

    // Trocar de 'supermarket' para 'beauty-salon'
    act(() => {
      result.current.setBusinessSegment("beauty-salon");
    });

    expect(result.current.businessSegment).toBe("beauty-salon");
    expect(result.current.stylePresetId).toBe("salon-glamour");
    expect(result.current.referenceImageDataUrl).toBeUndefined();

    // Trocar de 'beauty-salon' para 'pizzeria'
    act(() => {
      result.current.setBusinessSegment("pizzeria");
    });

    expect(result.current.businessSegment).toBe("pizzeria");
    expect(result.current.stylePresetId).toBe("pizza-rustic-wood");
  });

  it("deve permitir selecionar preset de catálogo sem limpar referenceImageDataUrl", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setReferenceImageDataUrl(
        "data:image/png;base64,sampleReference",
      );
    });
    expect(result.current.referenceImageDataUrl).toBe(
      "data:image/png;base64,sampleReference",
    );
    expect(result.current.stylePresetId).toBe(REFERENCE_STYLE_PRESET_ID);

    // Selecionar estilo pronto
    act(() => {
      result.current.setStylePresetId("market-fresh");
    });
    expect(result.current.stylePresetId).toBe("market-fresh");
    expect(result.current.referenceImageDataUrl).toBe(
      "data:image/png;base64,sampleReference",
    );
  });

  it("deve definir stylePresetId como REFERENCE_STYLE_PRESET_ID ao definir referenceImageDataUrl", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    expect(result.current.stylePresetId).toBe("market-discount");

    act(() => {
      result.current.setReferenceImageDataUrl(
        "data:image/png;base64,customRefImage",
      );
    });
    expect(result.current.referenceImageDataUrl).toBe(
      "data:image/png;base64,customRefImage",
    );
    expect(result.current.stylePresetId).toBe(REFERENCE_STYLE_PRESET_ID);
  });

  it("deve persistir stylePresetId no payload enviado para saveDraftFn", async () => {
    const mockSaveWithPreset = vi.fn().mockImplementation(async () => ({
      success: true,
      draftId: "draft-preset-123",
      draft: createMockDraft({ stylePresetId: "market-premium" }),
    }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSaveWithPreset,
      }),
    );

    act(() => {
      result.current.setStylePresetId("market-premium");
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mockSaveWithPreset).toHaveBeenCalledTimes(1);
    expect(mockSaveWithPreset).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stylePresetId: "market-premium",
        referenceImageDataUrl: null,
      }),
    });
  });
});

describe("useOfferBriefDraft Hook - Micro-Steps States (Épico 6)", () => {
  it("deve inicializar com os novos estados padrão", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    expect(result.current.cardIntent).toBe("promo");
    expect(result.current.customIntentText).toBe("");
    expect(result.current.logoImageDataUrl).toBeUndefined();
    expect(result.current.customStyleNote).toBe("");
  });

  it("deve inicializar com os novos estados customizados fornecidos em initialDraft", () => {
    const { result } = renderHook(() =>
      useOfferBriefDraft({
        initialDraft: {
          cardIntent: "new-arrival",
          customIntentText: "Chegaram vestidos novos",
          logoImageDataUrl: "data:image/png;base64,myLogo",
          customStyleNote: "Paleta Azul Royal",
        },
      }),
    );

    expect(result.current.cardIntent).toBe("new-arrival");
    expect(result.current.customIntentText).toBe("Chegaram vestidos novos");
    expect(result.current.logoImageDataUrl).toBe(
      "data:image/png;base64,myLogo",
    );
    expect(result.current.customStyleNote).toBe("Paleta Azul Royal");
  });

  it("deve permitir alterar cardIntent via setCardIntent e updateField", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setCardIntent("announcement");
    });
    expect(result.current.cardIntent).toBe("announcement");

    act(() => {
      result.current.updateField("cardIntent", "schedule");
    });
    expect(result.current.cardIntent).toBe("schedule");
  });

  it("deve permitir alterar customIntentText via setCustomIntentText e updateField", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setCustomIntentText("Inauguração da filial sul");
    });
    expect(result.current.customIntentText).toBe("Inauguração da filial sul");

    act(() => {
      result.current.updateField("customIntentText", "Nova data do evento");
    });
    expect(result.current.customIntentText).toBe("Nova data do evento");
  });

  it("deve permitir alterar logoImageDataUrl via setLogoImageDataUrl e updateField", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setLogoImageDataUrl("data:image/png;base64,sampleLogo");
    });
    expect(result.current.logoImageDataUrl).toBe(
      "data:image/png;base64,sampleLogo",
    );

    act(() => {
      result.current.setLogoImageDataUrl(undefined);
    });
    expect(result.current.logoImageDataUrl).toBeUndefined();
  });

  it("deve permitir alterar customStyleNote via setCustomStyleNote e sincronizar com customStyleInstructions", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setCustomStyleNote("Dourado e preto sofisticado");
    });
    expect(result.current.customStyleNote).toBe("Dourado e preto sofisticado");
    expect(result.current.customStyleInstructions).toBe(
      "Dourado e preto sofisticado",
    );
  });

  it("deve incluir os novos campos no payload enviado ao salvar draft", async () => {
    const mockSave = vi
      .fn()
      .mockImplementation(async ({ data }: { data: SaveOfferDraftInput }) => ({
        success: true,
        draftId: "draft-micro-steps",
        draft: createMockDraft(data),
      }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
      }),
    );

    act(() => {
      result.current.setCardIntent("custom");
      result.current.setCustomIntentText("Anúncio de Black Friday especial");
      result.current.setLogoImageDataUrl("data:image/png;base64,logoData");
      result.current.setCustomStyleNote("Neon e alto contraste");
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cardIntent: "custom",
        customIntentText: "Anúncio de Black Friday especial",
        logoImageDataUrl: "data:image/png;base64,logoData",
        customStyleInstructions: "Neon e alto contraste",
      }),
    });
  });
});

describe("useOfferBriefDraft Hook - Validação Inteligente do Passo 2 (validateStep2 & isStep2Valid)", () => {
  it("deve invalidar se businessName estiver vazio ou apenas espaços", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setBusinessName("   ");
      result.current.setOfferTitle("Oferta Especial");
      result.current.setPromoPrice("R$ 29,90");
    });

    let isValid = false;
    act(() => {
      isValid = result.current.validateStep2();
    });

    expect(isValid).toBe(false);
    expect(result.current.isStep2Valid).toBe(false);
    expect(result.current.validationErrors.businessName).toBe(
      "Informe o nome do estabelecimento",
    );
  });

  it("deve invalidar se offerTitle estiver vazio ou apenas espaços", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setBusinessName("Loja Exemplo");
      result.current.setOfferTitle("   ");
      result.current.setPromoPrice("R$ 29,90");
    });

    let isValid = false;
    act(() => {
      isValid = result.current.validateStep2();
    });

    expect(isValid).toBe(false);
    expect(result.current.isStep2Valid).toBe(false);
    expect(result.current.validationErrors.offerTitle).toBe(
      "Informe o título ou mensagem principal",
    );
  });

  it("deve exigir promoPrice quando cardIntent === 'promo'", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setBusinessName("Loja Exemplo");
      result.current.setOfferTitle("Produto X");
      result.current.setCardIntent("promo");
      result.current.setPromoPrice("   ");
    });

    let isValid = false;
    act(() => {
      isValid = result.current.validateStep2();
    });

    expect(isValid).toBe(false);
    expect(result.current.isStep2Valid).toBe(false);
    expect(result.current.validationErrors.promoPrice).toBe(
      "Informe o preço promocional",
    );

    // Preenchendo promoPrice deve validar
    act(() => {
      result.current.setPromoPrice("R$ 49,90");
    });

    act(() => {
      isValid = result.current.validateStep2();
    });

    expect(isValid).toBe(true);
    expect(result.current.isStep2Valid).toBe(true);
    expect(result.current.validationErrors.promoPrice).toBeUndefined();
  });

  it("deve validar com sucesso mesmo sem promoPrice para os outros 4 objetivos", () => {
    const nonPromoIntents = [
      "new-arrival",
      "special-date",
      "announcement",
      "schedule",
    ] as const;

    for (const intent of nonPromoIntents) {
      const { result } = renderHook(() => useOfferBriefDraft());

      act(() => {
        result.current.setBusinessName("Boutique Elegance");
        result.current.setOfferTitle("Nova Coleção Primavera/Verão");
        result.current.setCardIntent(intent);
        result.current.setPromoPrice("");
      });

      let isValid = false;
      act(() => {
        isValid = result.current.validateStep2();
      });

      expect(isValid).toBe(true);
      expect(result.current.isStep2Valid).toBe(true);
      expect(result.current.validationErrors.promoPrice).toBeUndefined();
    }
  });

  it("deve invalidar se cardIntent === 'custom' e customIntentText estiver vazio", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setBusinessName("Restaurante Bom Sabor");
      result.current.setOfferTitle("Comunicado Geral");
      result.current.setCardIntent("custom");
      result.current.setCustomIntentText("   ");
      result.current.setPromoPrice("");
    });

    let isValid = false;
    act(() => {
      isValid = result.current.validateStep2();
    });

    expect(isValid).toBe(false);
    expect(result.current.isStep2Valid).toBe(false);
    expect(result.current.validationErrors.customIntentText).toBe(
      "Descreva o tipo de card que você deseja criar",
    );

    // Preenchendo customIntentText valida com sucesso mesmo sem preço
    act(() => {
      result.current.setCustomIntentText("Aviso de recesso de final de ano");
    });

    act(() => {
      isValid = result.current.validateStep2();
    });

    expect(isValid).toBe(true);
    expect(result.current.isStep2Valid).toBe(true);
    expect(result.current.validationErrors.customIntentText).toBeUndefined();
  });

  it("helper isStep2Valid deve validar corretamente todas as variações de forma pura", () => {
    expect(isStep2Valid({ businessName: "", offerTitle: "A" })).toBe(false);
    expect(isStep2Valid({ businessName: "Loja", offerTitle: "" })).toBe(false);
    expect(
      isStep2Valid({
        businessName: "Loja",
        offerTitle: "Oferta",
        cardIntent: "promo",
        promoPrice: "",
      }),
    ).toBe(false);
    expect(
      isStep2Valid({
        businessName: "Loja",
        offerTitle: "Oferta",
        cardIntent: "promo",
        promoPrice: "R$ 10",
      }),
    ).toBe(true);
    expect(
      isStep2Valid({
        businessName: "Loja",
        offerTitle: "Oferta",
        cardIntent: "new-arrival",
        promoPrice: "",
      }),
    ).toBe(true);
    expect(
      isStep2Valid({
        businessName: "Loja",
        offerTitle: "Oferta",
        cardIntent: "custom",
        customIntentText: "",
      }),
    ).toBe(false);
    expect(
      isStep2Valid({
        businessName: "Loja",
        offerTitle: "Oferta",
        cardIntent: "custom",
        customIntentText: "Meu Objetivo",
      }),
    ).toBe(true);
  });
});

describe("useOfferBriefDraft Hook - Orquestração Contínua de Geração e Início de Checkout", () => {
  it("deve executar o fluxo completo de sucesso: saveDraft -> generatePreviewFn -> initiateCheckoutFn -> orderId", async () => {
    const mockSave = vi.fn().mockImplementation(async () => ({
      success: true,
      draftId: "draft-orchestrated",
      draft: createMockDraft({ id: "draft-orchestrated" }),
    }));

    const mockGenerate = vi.fn().mockImplementation(async () => ({
      success: true,
      previewUrl: "data:image/png;base64,watermarkedPreview",
      aiGenerationCount: 1,
    }));

    const mockCheckout = vi.fn().mockImplementation(async () => ({
      orderId: "order-uuid-999",
    }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockGenerate,
        initiateCheckoutFn: mockCheckout,
      }),
    );

    act(() => {
      result.current.setWhatsapp("11987654321");
    });

    let orchestrationRes: unknown;
    await act(async () => {
      orchestrationRes = await result.current.generateCardAndInitiateCheckout();
    });

    expect(orchestrationRes).toEqual({
      success: true,
      orderId: "order-uuid-999",
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith({
      data: { draftId: "draft-orchestrated" },
    });
    expect(mockCheckout).toHaveBeenCalledTimes(1);
    expect(mockCheckout).toHaveBeenCalledWith({
      data: {
        draftId: "draft-orchestrated",
        customerWhatsapp: "11987654321",
      },
    });

    expect(result.current.previewCardImageUrl).toBe(
      "data:image/png;base64,watermarkedPreview",
    );
    expect(result.current.aiGenerationCount).toBe(1);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isInitiatingCheckout).toBe(false);
    expect(result.current.generationError).toBeNull();
  });

  it("deve permitir passar customerWhatsapp customizado no parâmetro de generateCardAndInitiateCheckout", async () => {
    const mockSave = vi.fn().mockImplementation(async () => ({
      success: true,
      draftId: "draft-whatsapp-override",
      draft: createMockDraft(),
    }));

    const mockGenerate = vi.fn().mockImplementation(async () => ({
      success: true,
      previewUrl: "data:image/png;base64,preview",
      aiGenerationCount: 1,
    }));

    const mockCheckout = vi.fn().mockImplementation(async () => ({
      orderId: "order-override-123",
    }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockGenerate,
        initiateCheckoutFn: mockCheckout,
      }),
    );

    await act(async () => {
      await result.current.generateCardAndInitiateCheckout({
        customerWhatsapp: "21999998888",
      });
    });

    expect(mockCheckout).toHaveBeenCalledWith({
      data: {
        draftId: "draft-whatsapp-override",
        customerWhatsapp: "21999998888",
      },
    });
  });

  it("deve tratar cota esgotada AI_QUOTA_EXCEEDED aproveitando a prévia e iniciando checkout normalmente", async () => {
    const mockSave = vi.fn().mockImplementation(async () => ({
      success: true,
      draftId: "draft-with-existing-preview",
      draft: createMockDraft(),
    }));

    const mockQuotaGenerate = vi.fn().mockImplementation(async () => ({
      success: false,
      code: "AI_QUOTA_EXCEEDED",
      message: "Limite de 1 card gratuito atingido para este rascunho",
      previewUrl: "data:image/png;base64,existingWatermarkedPreview",
      aiGenerationCount: 1,
    }));

    const mockCheckout = vi.fn().mockImplementation(async () => ({
      orderId: "order-from-quota-exceeded",
    }));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockQuotaGenerate,
        initiateCheckoutFn: mockCheckout,
      }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.generateCardAndInitiateCheckout();
    });

    expect(res).toEqual({
      success: true,
      orderId: "order-from-quota-exceeded",
    });

    expect(result.current.previewCardImageUrl).toBe(
      "data:image/png;base64,existingWatermarkedPreview",
    );
    expect(result.current.generationError).toBeNull();
    expect(mockCheckout).toHaveBeenCalledTimes(1);
  });

  it("deve interromper o fluxo e reportar erro em caso de falha da IA sem chamar checkout", async () => {
    const mockSave = vi.fn().mockImplementation(async () => ({
      success: true,
      draftId: "draft-ai-fail",
      draft: createMockDraft(),
    }));

    const mockFailGenerate = vi.fn().mockImplementation(async () => ({
      success: false,
      code: "PROMPT_SAFETY_VIOLATION",
      message: "A imagem ou texto violou políticas de segurança",
      aiGenerationCount: 0,
    }));

    const mockCheckout = vi.fn();

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockFailGenerate,
        initiateCheckoutFn: mockCheckout,
      }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.generateCardAndInitiateCheckout();
    });

    expect(res).toEqual({
      success: false,
      error: {
        code: "PROMPT_SAFETY_VIOLATION",
        message: "A imagem ou texto violou políticas de segurança",
      },
      code: "PROMPT_SAFETY_VIOLATION",
      message: "A imagem ou texto violou políticas de segurança",
    });

    expect(mockCheckout).not.toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationError).toEqual({
      code: "PROMPT_SAFETY_VIOLATION",
      message: "A imagem ou texto violou políticas de segurança",
    });
  });

  it("deve capturar exceção de rede/RPC na IA e reportar AI_GENERATION_FAILED sem chamar checkout", async () => {
    const mockSave = vi.fn().mockImplementation(async () => ({
      success: true,
      draftId: "draft-rpc-fail",
      draft: createMockDraft(),
    }));

    const mockThrowGenerate = vi
      .fn()
      .mockRejectedValue(new Error("Timeout de rede de 60s"));
    const mockCheckout = vi.fn();

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockThrowGenerate,
        initiateCheckoutFn: mockCheckout,
      }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.generateCardAndInitiateCheckout();
    });

    expect(res).toEqual({
      success: false,
      error: {
        code: "AI_GENERATION_FAILED",
        message: "Timeout de rede de 60s",
      },
      code: "AI_GENERATION_FAILED",
      message: "Timeout de rede de 60s",
    });

    expect(mockCheckout).not.toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generationError?.code).toBe("AI_GENERATION_FAILED");
  });

  it("deve interromper o fluxo se saveDraft falhar", async () => {
    const mockFailingSave = vi
      .fn()
      .mockRejectedValue(new Error("Banco de dados indisponível"));
    const mockGenerate = vi.fn();
    const mockCheckout = vi.fn();

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockFailingSave,
        generatePreviewFn: mockGenerate,
        initiateCheckoutFn: mockCheckout,
      }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.generateCardAndInitiateCheckout();
    });

    expect(res).toMatchObject({
      success: false,
      code: "SAVE_FAILED",
    });

    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockCheckout).not.toHaveBeenCalled();
  });

  it("deve reportar CHECKOUT_INIT_FAILED se initiateCheckoutFn falhar", async () => {
    const mockSave = vi.fn().mockImplementation(async () => ({
      success: true,
      draftId: "draft-checkout-fail",
      draft: createMockDraft(),
    }));

    const mockGenerate = vi.fn().mockImplementation(async () => ({
      success: true,
      previewUrl: "data:image/png;base64,preview",
      aiGenerationCount: 1,
    }));

    const mockFailingCheckout = vi
      .fn()
      .mockRejectedValue(new Error("Pushin Pay API indisponível"));

    const { result } = renderHook(() =>
      useOfferBriefDraft({
        saveDraftFn: mockSave,
        generatePreviewFn: mockGenerate,
        initiateCheckoutFn: mockFailingCheckout,
      }),
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.generateCardAndInitiateCheckout();
    });

    expect(res).toEqual({
      success: false,
      error: {
        code: "CHECKOUT_INIT_FAILED",
        message: "Pushin Pay API indisponível",
      },
      code: "CHECKOUT_INIT_FAILED",
      message: "Pushin Pay API indisponível",
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isInitiatingCheckout).toBe(false);
    expect(result.current.generationError).toEqual({
      code: "CHECKOUT_INIT_FAILED",
      message: "Pushin Pay API indisponível",
    });
  });
});
