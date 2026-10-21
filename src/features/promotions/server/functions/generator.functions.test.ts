import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import sharp from "sharp";
import {
  generatePreviewFn,
  generatePreviewInputSchema,
} from "./generator.functions";
import { executeGeneratePreview } from "../services/preview-generator.service";
import {
  generatePreviewFn as barrelGeneratePreviewFn,
  generatePreviewInputSchema as barrelGeneratePreviewInputSchema,
} from "../index";
import { saveOfferDraft, getOfferDraft } from "../services/drafts.service";
import type { OfferDraft } from "../services/drafts.service";
import {
  setStorageServiceForTesting,
  InMemoryStorageDriver,
} from "@/server/storage";

describe("Generator Server Functions (RPC & Atomic Quota Enforcement)", () => {
  let memoryStorage: InMemoryStorageDriver;

  beforeEach(() => {
    memoryStorage = new InMemoryStorageDriver({
      publicUrlBase: "https://pub-test.r2.dev",
    });
    setStorageServiceForTesting(memoryStorage);
  });

  afterEach(() => {
    setStorageServiceForTesting(null);
  });

  describe("Input validation schema (generatePreviewInputSchema)", () => {
    it("accepts valid draftId", () => {
      const result = generatePreviewInputSchema.safeParse({
        draftId: "valid-draft-uuid",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.draftId).toBe("valid-draft-uuid");
      }
    });

    it("rejects empty or whitespace draftId", () => {
      const empty = generatePreviewInputSchema.safeParse({ draftId: "" });
      expect(empty.success).toBe(false);

      const whitespace = generatePreviewInputSchema.safeParse({
        draftId: "   ",
      });
      expect(whitespace.success).toBe(false);

      const missing = generatePreviewInputSchema.safeParse({});
      expect(missing.success).toBe(false);
    });
  });

  describe("RPC definition & Barrel Exports", () => {
    it("defines generatePreviewFn with POST method and RPC structure", () => {
      expect(generatePreviewFn).toBeDefined();
      expect(typeof generatePreviewFn).toBe("function");
      expect(generatePreviewFn.method).toBe("POST");
    });

    it("re-exports generatePreviewFn and schemas from server/index.ts", () => {
      expect(barrelGeneratePreviewFn).toBe(generatePreviewFn);
      expect(barrelGeneratePreviewInputSchema).toBe(generatePreviewInputSchema);
    });
  });

  describe("executeGeneratePreview: Quota enforcement and state machine", () => {
    const mockDraft: OfferDraft = {
      id: "draft-123",
      businessSegment: "pizzeria",
      targetAspectRatio: "feed",
      businessName: "Pizzaria Bela Vista",
      offerTitle: "Pizza Calabresa Artesanal",
      promoPrice: "R$ 49,90",
      originalPrice: "R$ 65,00",
      callToAction: "Peça pelo WhatsApp!",
      whatsapp: "(11) 99999-8888",
      productImageDataUrl: null,
      referenceImageDataUrl: null,
      stylePresetId: "pizza-rustic-wood",
      customStyleInstructions: null,
      cleanMasterImageDataUrl: null,
      previewCardImageUrl: null,
      previewAssetKey: null,
      cleanMasterAssetKey: null,
      cardIntent: "promo",
      customIntentText: null,
      logoImageDataUrl: null,
      productAssetKey: null,
      referenceAssetKey: null,
      logoAssetKey: null,
      aiGenerationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("returns NOT_FOUND when draft does not exist", async () => {
      const getDraft = vi.fn().mockResolvedValue(null);

      const response = await executeGeneratePreview(
        { draftId: "non-existent-id" },
        { getDraft },
      );

      expect(response).toEqual({
        success: false,
        code: "NOT_FOUND",
        message: "Rascunho não encontrado.",
      });
      expect(getDraft).toHaveBeenCalledWith("non-existent-id");
    });

    it("returns AI_QUOTA_EXCEEDED without calling AI when aiGenerationCount >= 1", async () => {
      const existingPreviewUrl =
        "data:image/webp;base64,existingWatermarkedPreview";
      const exhaustedDraft: OfferDraft = {
        ...mockDraft,
        previewCardImageUrl: existingPreviewUrl,
        aiGenerationCount: 1,
      };

      const getDraft = vi.fn().mockResolvedValue(exhaustedDraft);
      const generateAdCard = vi.fn();
      const watermark = vi.fn();
      const updateDraftPreview = vi.fn();

      const response = await executeGeneratePreview(
        { draftId: "draft-123" },
        { getDraft, generateAdCard, watermark, updateDraftPreview },
      );

      expect(response).toEqual({
        success: false,
        code: "AI_QUOTA_EXCEEDED",
        message:
          "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a até 3 regenerações.",
        previewUrl: existingPreviewUrl,
        aiGenerationCount: 1,
      });

      expect(getDraft).toHaveBeenCalledWith("draft-123");
      expect(generateAdCard).not.toHaveBeenCalled();
      expect(watermark).not.toHaveBeenCalled();
      expect(updateDraftPreview).not.toHaveBeenCalled();
    });

    it("preserves quota (aiGenerationCount: 0) and returns controlled error when AI generation fails", async () => {
      const freshDraft: OfferDraft = {
        ...mockDraft,
        aiGenerationCount: 0,
      };

      const getDraft = vi.fn().mockResolvedValue(freshDraft);
      const generateAdCard = vi
        .fn()
        .mockRejectedValue(new Error("Timeout / Rate limit from Gemini"));
      const watermark = vi.fn();
      const updateDraftPreview = vi.fn();

      const response = await executeGeneratePreview(
        { draftId: "draft-123" },
        { getDraft, generateAdCard, watermark, updateDraftPreview },
      );

      expect(response).toEqual({
        success: false,
        code: "AI_GENERATION_FAILED",
        message:
          "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
        aiGenerationCount: 0,
      });

      expect(getDraft).toHaveBeenCalledWith("draft-123");
      expect(generateAdCard).toHaveBeenCalled();
      expect(watermark).not.toHaveBeenCalled();
      expect(updateDraftPreview).not.toHaveBeenCalled();
    });

    it("generates preview, applies watermark, atomically updates draft, and returns success", async () => {
      const freshDraft: OfferDraft = {
        ...mockDraft,
        aiGenerationCount: 0,
      };

      const syntheticBuffer = Buffer.from("raw-image-bytes");
      const watermarkedDataUrl =
        "data:image/webp;base64,watermarkedValidPreview";

      const getDraft = vi.fn().mockResolvedValue(freshDraft);
      const generateAdCard = vi.fn().mockResolvedValue({
        rawImageBuffer: syntheticBuffer,
        mimeType: "image/png",
      });
      const watermark = vi.fn().mockResolvedValue({
        dataUrl: watermarkedDataUrl,
      });
      const updateDraftPreview = vi.fn().mockResolvedValue({
        ...freshDraft,
        previewCardImageUrl: watermarkedDataUrl,
        aiGenerationCount: 1,
      });

      const response = await executeGeneratePreview(
        { draftId: "draft-123" },
        { getDraft, generateAdCard, watermark, updateDraftPreview },
      );

      expect(response).toEqual({
        success: true,
        previewUrl: expect.stringMatching(
          /^https?:\/\/.+\/previews\/draft-123\/\d+\.(webp|png)$/,
        ),
        aiGenerationCount: 1,
      });

      expect(getDraft).toHaveBeenCalledWith("draft-123");
      expect(generateAdCard).toHaveBeenCalledWith({
        businessSegment: "pizzeria",
        targetAspectRatio: "feed",
        businessName: "Pizzaria Bela Vista",
        offerTitle: "Pizza Calabresa Artesanal",
        promoPrice: "R$ 49,90",
        originalPrice: "R$ 65,00",
        callToAction: "Peça pelo WhatsApp!",
        whatsapp: "(11) 99999-8888",
        productImageDataUrl: null,
        referenceImageDataUrl: null,
        stylePresetId: "pizza-rustic-wood",
        customStyleInstructions: null,
        cardIntent: "promo",
        customIntentText: null,
        logoImageDataUrl: null,
      });
      expect(watermark).toHaveBeenCalledWith(syntheticBuffer);
      expect(updateDraftPreview).toHaveBeenCalledWith(
        "draft-123",
        expect.stringMatching(
          /^https?:\/\/.+\/previews\/draft-123\/\d+\.(webp|png)$/,
        ),
        `data:image/png;base64,${syntheticBuffer.toString("base64")}`,
        expect.stringMatching(/^previews\/draft-123\/\d+\.(webp|png)$/),
        expect.stringMatching(/^masters\/(drafts\/)?draft-123\/\d+\.png$/),
      );
    });

    it("forwards targetAspectRatio: 'story' to generateAdCard when draft specifies story format", async () => {
      const storyDraft: OfferDraft = {
        ...mockDraft,
        id: "draft-story-456",
        targetAspectRatio: "story",
        aiGenerationCount: 0,
      };

      const getDraft = vi.fn().mockResolvedValue(storyDraft);
      const generateAdCard = vi.fn().mockResolvedValue({
        rawImageBuffer: Buffer.from("story-buffer"),
        mimeType: "image/png",
      });
      const watermark = vi.fn().mockResolvedValue({
        dataUrl: "data:image/webp;base64,storyPreview",
      });
      const updateDraftPreview = vi.fn().mockResolvedValue({
        ...storyDraft,
        previewCardImageUrl: "data:image/webp;base64,storyPreview",
        aiGenerationCount: 1,
      });

      const response = await executeGeneratePreview(
        { draftId: "draft-story-456" },
        { getDraft, generateAdCard, watermark, updateDraftPreview },
      );

      expect(response.success).toBe(true);
      expect(generateAdCard).toHaveBeenCalledWith(
        expect.objectContaining({
          targetAspectRatio: "story",
        }),
      );
    });

    it("handles concurrent race condition where draft was updated between check and commit", async () => {
      const freshDraft: OfferDraft = {
        ...mockDraft,
        aiGenerationCount: 0,
      };

      const getDraft = vi.fn().mockResolvedValue(freshDraft);
      const generateAdCard = vi.fn().mockResolvedValue({
        rawImageBuffer: Buffer.from("img"),
        mimeType: "image/png",
      });
      const watermark = vi.fn().mockResolvedValue({
        dataUrl: "data:image/webp;base64,watermarked",
      });
      // updateDraftPreview returns null if atomic update condition (aiGenerationCount == 0) failed
      const updateDraftPreview = vi.fn().mockResolvedValue(null);

      const response = await executeGeneratePreview(
        { draftId: "draft-123" },
        { getDraft, generateAdCard, watermark, updateDraftPreview },
      );

      expect(response).toEqual({
        success: false,
        code: "AI_QUOTA_EXCEEDED",
        message:
          "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a até 3 regenerações.",
        previewUrl: freshDraft.previewCardImageUrl,
        aiGenerationCount: 1,
      });
    });
  });

  describe("Integration: Real DB and Watermark with Mocked AI Generator", () => {
    it("persists watermarked preview in PostgreSQL and blocks 2nd attempt", async () => {
      // 1. Create fresh draft in real database
      const createdDraft = await saveOfferDraft({
        businessSegment: "burger-shop",
        businessName: "Burger Artesanal Top",
        offerTitle: "Smash Burger Duplo",
        promoPrice: "R$ 28,00",
      });

      expect(createdDraft.aiGenerationCount).toBe(0);
      expect(createdDraft.previewCardImageUrl).toBeNull();

      // 2. Generate synthetic image buffer using real Sharp
      const syntheticCardBuffer = await sharp({
        create: {
          width: 1080,
          height: 1350,
          channels: 4,
          background: { r: 255, g: 120, b: 0, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const mockGenerateAdCard = vi.fn().mockResolvedValue({
        rawImageBuffer: syntheticCardBuffer,
        mimeType: "image/png",
      });

      // 3. Execute generation using real DB and real Sharp watermark
      const firstResponse = await executeGeneratePreview(
        { draftId: createdDraft.id },
        { generateAdCard: mockGenerateAdCard },
      );

      expect(firstResponse.success).toBe(true);
      if (firstResponse.success) {
        expect(firstResponse.aiGenerationCount).toBe(1);
        expect(firstResponse.previewUrl).toMatch(
          /^https?:\/\/.+\/previews\/.+\.(webp|png)$/,
        );
      }

      // 4. Verify draft in DB has been updated atomically
      const fetchedAfter = await getOfferDraft(createdDraft.id);
      expect(fetchedAfter).not.toBeNull();
      expect(fetchedAfter?.aiGenerationCount).toBe(1);
      expect(fetchedAfter?.previewCardImageUrl).toBe(
        firstResponse.success ? firstResponse.previewUrl : null,
      );
      expect(fetchedAfter?.previewAssetKey).toMatch(
        /^previews\/.+\.(webp|png)$/,
      );
      expect(fetchedAfter?.cleanMasterAssetKey).toMatch(
        /^masters\/(drafts\/)?.+\.png$/,
      );

      // 5. Attempt 2nd generation on same draft -> must be blocked
      const secondMockGenerator = vi.fn();
      const secondResponse = await executeGeneratePreview(
        { draftId: createdDraft.id },
        { generateAdCard: secondMockGenerator },
      );

      expect(secondResponse).toEqual({
        success: false,
        code: "AI_QUOTA_EXCEEDED",
        message:
          "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a até 3 regenerações.",
        previewUrl: fetchedAfter?.previewCardImageUrl,
        aiGenerationCount: 1,
      });
      expect(secondMockGenerator).not.toHaveBeenCalled();
    });

    it("does not increment quota in real DB when AI generator fails", async () => {
      const createdDraft = await saveOfferDraft({
        businessSegment: "supermarket",
        businessName: "Supermercado Bom Preço",
        offerTitle: "Arroz 5kg",
        promoPrice: "R$ 19,90",
      });

      const failingGenerator = vi
        .fn()
        .mockRejectedValue(new Error("Gemini quota exhausted / 429"));

      const response = await executeGeneratePreview(
        { draftId: createdDraft.id },
        { generateAdCard: failingGenerator },
      );

      expect(response).toEqual({
        success: false,
        code: "AI_GENERATION_FAILED",
        message:
          "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
        aiGenerationCount: 0,
      });

      // Confirm in real DB that draft was untouched
      const fetched = await getOfferDraft(createdDraft.id);
      expect(fetched?.aiGenerationCount).toBe(0);
      expect(fetched?.previewCardImageUrl).toBeNull();
    });
  });
});
