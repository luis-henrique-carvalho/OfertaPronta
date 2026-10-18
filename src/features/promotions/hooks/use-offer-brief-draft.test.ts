// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useOfferBriefDraft } from "./use-offer-brief-draft";
import type {
  GeneratePreviewResponse,
  SaveDraftResponse,
  OfferDraft,
} from "../server";
import type { SaveOfferDraftInput } from "../data/offer-brief.schema";

function createMockDraft(overrides: Partial<OfferDraft> = {}): OfferDraft {
  return {
    id: "draft-xyz",
    businessSegment: "supermarket",
    targetAspectRatio: "feed",
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
    aiGenerationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
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
    const mockPreview = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
        success: true,
        previewUrl: "data:image/png;base64,newPreviewUrl",
        aiGenerationCount: 1,
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

    expect(res).toEqual({
      success: true,
      previewUrl: "data:image/png;base64,newPreviewUrl",
      aiGenerationCount: 1,
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.previewCardImageUrl).toBe(
      "data:image/png;base64,newPreviewUrl",
    );
    expect(result.current.aiGenerationCount).toBe(1);
    expect(result.current.generationError).toBeNull();
  });

  it("deve tratar cota esgotada AI_QUOTA_EXCEEDED preservando a prévia anterior", async () => {
    const mockQuota = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
        success: false,
        code: "AI_QUOTA_EXCEEDED",
        message: "Limite de cota atingido",
        previewUrl: "data:image/png;base64,existingCard",
        aiGenerationCount: 1,
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
      success: false,
      code: "AI_QUOTA_EXCEEDED",
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.previewCardImageUrl).toBe(
      "data:image/png;base64,existingCard",
    );
    expect(result.current.generationError).toEqual({
      code: "AI_QUOTA_EXCEEDED",
      message: "Limite de cota atingido",
    });
  });

  it("deve capturar erro AI_GENERATION_FAILED e permitir limpeza com clearGenerationError", async () => {
    const mockFail = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewResponse> => ({
        success: false,
        code: "AI_GENERATION_FAILED",
        message: "Instabilidade transitória na IA",
        aiGenerationCount: 0,
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
    expect(result.current.stylePresetId).toBeUndefined();

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

  it("deve aplicar regra de exclusividade mútua: setStylePresetId limpa referenceImageDataUrl", () => {
    const { result } = renderHook(() => useOfferBriefDraft());

    act(() => {
      result.current.setReferenceImageDataUrl(
        "data:image/png;base64,sampleReference",
      );
    });
    expect(result.current.referenceImageDataUrl).toBe(
      "data:image/png;base64,sampleReference",
    );
    expect(result.current.stylePresetId).toBeUndefined();

    // Selecionar estilo pronto
    act(() => {
      result.current.setStylePresetId("market-fresh");
    });
    expect(result.current.stylePresetId).toBe("market-fresh");
    expect(result.current.referenceImageDataUrl).toBeUndefined();
  });

  it("deve aplicar regra de exclusividade mútua: setReferenceImageDataUrl limpa stylePresetId", () => {
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
    expect(result.current.stylePresetId).toBeUndefined();
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
