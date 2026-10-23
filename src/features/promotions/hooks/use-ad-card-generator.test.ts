// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdCardGenerator } from "./use-ad-card-generator";
import type {
  DraftClientDto,
  GeneratePreviewOutput,
} from "../data/offer-brief.schema";

function createMockDraftDto(
  overrides: Partial<DraftClientDto> = {},
): DraftClientDto {
  return {
    id: "draft-mock-123",
    businessSegment: "fashion",
    targetAspectRatio: "feed",
    businessName: "Boutique Flor",
    offerTitle: "Vestido Floral",
    promoPrice: "R$ 89,90",
    cardIntent: "promo",
    aiGenerationCount: 1,
    previewCardImageUrl: "data:image/webp;base64,mockPreviewArt",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("useAdCardGenerator Hook", () => {
  it("deve processar status OK com sucesso e atualizar currentDraft e lastDraft", async () => {
    const mockDraft = createMockDraftDto();
    const mockGenFn = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewOutput> => ({
        status: "OK",
        draft: mockDraft,
      }));

    const { result } = renderHook(() =>
      useAdCardGenerator({ generatePreviewFn: mockGenFn }),
    );

    let res: GeneratePreviewOutput | undefined;
    await act(async () => {
      res = await result.current.generateCard("draft-mock-123");
    });

    expect(res?.status).toBe("OK");
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isLimitReached).toBe(false);
    expect(result.current.limitReason).toBeNull();
    expect(result.current.currentDraft).toEqual(mockDraft);
    expect(result.current.lastDraft).toEqual(mockDraft);
  });

  it("deve tratar LIMIT_REACHED com reason 'visitor' e lastDraft sem disparar erro", async () => {
    const mockLastDraft = createMockDraftDto({ id: "last-draft-visitor" });
    const mockGenFn = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewOutput> => ({
        status: "LIMIT_REACHED",
        reason: "visitor",
        lastDraft: mockLastDraft,
      }));

    const onLimitReached = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useAdCardGenerator({
        generatePreviewFn: mockGenFn,
        onLimitReached,
        onError,
      }),
    );

    let res: GeneratePreviewOutput | undefined;
    await act(async () => {
      res = await result.current.generateCard("draft-mock-123");
    });

    expect(res?.status).toBe("LIMIT_REACHED");
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isLimitReached).toBe(true);
    expect(result.current.limitReason).toBe("visitor");
    expect(result.current.lastDraft).toEqual(mockLastDraft);
    // CRÍTICO: Não deve ser tratado como erro genérico
    expect(result.current.error).toBeNull();
    expect(onError).not.toHaveBeenCalled();
    expect(onLimitReached).toHaveBeenCalledWith("visitor", mockLastDraft);
  });

  it("deve tratar LIMIT_REACHED com reason 'ip' e lastDraft nulo", async () => {
    const mockGenFn = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewOutput> => ({
        status: "LIMIT_REACHED",
        reason: "ip",
        lastDraft: null,
      }));

    const { result } = renderHook(() =>
      useAdCardGenerator({ generatePreviewFn: mockGenFn }),
    );

    await act(async () => {
      await result.current.generateCard("draft-mock-123");
    });

    expect(result.current.isLimitReached).toBe(true);
    expect(result.current.limitReason).toBe("ip");
    expect(result.current.lastDraft).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("deve tratar LIMIT_REACHED com reason 'global'", async () => {
    const mockGenFn = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewOutput> => ({
        status: "LIMIT_REACHED",
        reason: "global",
        lastDraft: null,
      }));

    const { result } = renderHook(() =>
      useAdCardGenerator({ generatePreviewFn: mockGenFn }),
    );

    await act(async () => {
      await result.current.generateCard("draft-mock-123");
    });

    expect(result.current.isLimitReached).toBe(true);
    expect(result.current.limitReason).toBe("global");
    expect(result.current.error).toBeNull();
  });

  it("deve capturar status ERROR e preencher estado error", async () => {
    const mockGenFn = vi
      .fn()
      .mockImplementation(async (): Promise<GeneratePreviewOutput> => ({
        status: "ERROR",
        code: "AI_GENERATION_FAILED",
        message: "Falha na sintetização de imagem",
      }));

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdCardGenerator({ generatePreviewFn: mockGenFn, onError }),
    );

    await act(async () => {
      await result.current.generateCard("draft-mock-123");
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.isLimitReached).toBe(false);
    expect(result.current.error).toEqual({
      code: "AI_GENERATION_FAILED",
      message: "Falha na sintetização de imagem",
    });
    expect(onError).toHaveBeenCalledWith({
      code: "AI_GENERATION_FAILED",
      message: "Falha na sintetização de imagem",
    });
  });

  it("deve capturar rejeição de rede/RPC e normalizar para status ERROR", async () => {
    const mockGenFn = vi.fn().mockRejectedValue(new Error("Network timeout"));

    const { result } = renderHook(() =>
      useAdCardGenerator({ generatePreviewFn: mockGenFn }),
    );

    let res: GeneratePreviewOutput | undefined;
    await act(async () => {
      res = await result.current.generateCard("draft-mock-123");
    });

    expect(res?.status).toBe("ERROR");
    expect(result.current.error).toEqual({
      code: "AI_GENERATION_FAILED",
      message: "Network timeout",
    });
  });
});
