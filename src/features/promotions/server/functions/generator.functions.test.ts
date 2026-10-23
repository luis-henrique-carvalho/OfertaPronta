import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import sharp from "sharp";
import {
  generatePreviewFn,
  generatePreviewInputSchema,
  generatePreviewOutputSchema,
  getPreviewQuotaFn,
  getPreviewQuotaOutputSchema,
} from "./generator.functions";
import { executeGeneratePreview } from "../services/preview-generator.service";
import {
  generatePreviewFn as barrelGeneratePreviewFn,
  generatePreviewInputSchema as barrelGeneratePreviewInputSchema,
  generatePreviewOutputSchema as barrelGeneratePreviewOutputSchema,
  getPreviewQuotaFn as barrelGetPreviewQuotaFn,
  getPreviewQuotaOutputSchema as barrelGetPreviewQuotaOutputSchema,
} from "../index";
import { saveOfferDraft, getOfferDraft } from "../services/drafts.service";
import type { OfferDraft } from "../services/drafts.service";
import {
  setStorageServiceForTesting,
  InMemoryStorageDriver,
} from "@/server/storage";
import { db } from "@/server/db";
import { drafts } from "@/server/db/schema/promotions";
import { eq } from "drizzle-orm";

describe("Generator Server Functions (RPC & Atomic Quota Enforcement)", () => {
  let memoryStorage: InMemoryStorageDriver;

  beforeEach(async () => {
    memoryStorage = new InMemoryStorageDriver({
      publicUrlBase: "https://pub-test.r2.dev",
    });
    setStorageServiceForTesting(memoryStorage);
  });

  afterEach(() => {
    setStorageServiceForTesting(null);
  });

  describe("Input & Output schemas", () => {
    it("accepts valid draftId in generatePreviewInputSchema", () => {
      const result = generatePreviewInputSchema.safeParse({
        draftId: "valid-draft-uuid",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.draftId).toBe("valid-draft-uuid");
      }
    });

    it("rejects empty or whitespace draftId", () => {
      expect(
        generatePreviewInputSchema.safeParse({ draftId: "" }).success,
      ).toBe(false);
      expect(
        generatePreviewInputSchema.safeParse({ draftId: "   " }).success,
      ).toBe(false);
      expect(generatePreviewInputSchema.safeParse({}).success).toBe(false);
    });

    it("validates generatePreviewOutputSchema discriminated union variants", () => {
      const okVariant = generatePreviewOutputSchema.safeParse({
        status: "OK",
        draft: {
          id: "draft-1",
          businessSegment: "fashion",
          targetAspectRatio: "feed",
          businessName: "Loja",
          offerTitle: "Vestido",
          promoPrice: "R$ 10",
          cardIntent: "promo",
          aiGenerationCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      expect(okVariant.success).toBe(true);

      const limitVariant = generatePreviewOutputSchema.safeParse({
        status: "LIMIT_REACHED",
        reason: "visitor",
        lastDraft: null,
      });
      expect(limitVariant.success).toBe(true);

      const errorVariant = generatePreviewOutputSchema.safeParse({
        status: "ERROR",
        code: "NOT_FOUND",
        message: "Rascunho não encontrado.",
      });
      expect(errorVariant.success).toBe(true);
    });

    it("validates getPreviewQuotaOutputSchema", () => {
      const valid = getPreviewQuotaOutputSchema.safeParse({
        remaining: 2,
        blockedReason: null,
      });
      expect(valid.success).toBe(true);

      const blocked = getPreviewQuotaOutputSchema.safeParse({
        remaining: 0,
        blockedReason: "global",
      });
      expect(blocked.success).toBe(true);
    });
  });

  describe("RPC definition & Barrel Exports", () => {
    it("defines generatePreviewFn with POST method and RPC structure", () => {
      expect(generatePreviewFn).toBeDefined();
      expect(typeof generatePreviewFn).toBe("function");
      expect(generatePreviewFn.method).toBe("POST");
    });

    it("defines getPreviewQuotaFn with GET method and RPC structure", () => {
      expect(getPreviewQuotaFn).toBeDefined();
      expect(typeof getPreviewQuotaFn).toBe("function");
      expect(getPreviewQuotaFn.method).toBe("GET");
    });

    it("re-exports generatePreviewFn and schemas from server/index.ts", () => {
      expect(barrelGeneratePreviewFn).toBe(generatePreviewFn);
      expect(barrelGeneratePreviewInputSchema).toBe(generatePreviewInputSchema);
      expect(barrelGeneratePreviewOutputSchema).toBe(
        generatePreviewOutputSchema,
      );
      expect(barrelGetPreviewQuotaFn).toBe(getPreviewQuotaFn);
      expect(barrelGetPreviewQuotaOutputSchema).toBe(
        getPreviewQuotaOutputSchema,
      );
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
      previewCardImageUrl: null,
      cardIntent: "promo",
      customIntentText: null,
      logoImageDataUrl: null,
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
        status: "ERROR",
        code: "NOT_FOUND",
        message: "Rascunho não encontrado.",
      });
      expect(getDraft).toHaveBeenCalledWith("non-existent-id");
    });

    it("returns LIMIT_REACHED(visitor) without calling AI or consuming ledger when aiGenerationCount >= 1", async () => {
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
      const reservePreviewMock = vi.fn();

      const response = await executeGeneratePreview(
        { draftId: "draft-123" },
        {
          getDraft,
          generateAdCard,
          watermark,
          updateDraftPreview,
          quota: {
            reservePreview: reservePreviewMock,
            settlePreview: vi.fn(),
            findLastPreviewDraftId: vi.fn(),
          },
        },
      );

      expect(response.status).toBe("LIMIT_REACHED");
      if (response.status === "LIMIT_REACHED") {
        expect(response.reason).toBe("visitor");
        expect(response.lastDraft?.previewCardImageUrl).toBe(
          existingPreviewUrl,
        );
      }

      expect(getDraft).toHaveBeenCalledWith("draft-123");
      expect(reservePreviewMock).not.toHaveBeenCalled();
      expect(generateAdCard).not.toHaveBeenCalled();
      expect(watermark).not.toHaveBeenCalled();
      expect(updateDraftPreview).not.toHaveBeenCalled();
    });

    it("blocks before Gemini when quota is exhausted and returns LIMIT_REACHED with reason", async () => {
      const freshDraft: OfferDraft = {
        ...mockDraft,
        aiGenerationCount: 0,
      };

      const getDraft = vi.fn().mockResolvedValue(freshDraft);
      const generateAdCard = vi.fn();
      const reservePreviewMock = vi
        .fn()
        .mockResolvedValue({ ok: false, reason: "ip" });
      const findLastPreviewDraftIdMock = vi.fn().mockResolvedValue(null);

      const response = await executeGeneratePreview(
        { draftId: "draft-123" },
        {
          getDraft,
          generateAdCard,
          quota: {
            reservePreview: reservePreviewMock,
            settlePreview: vi.fn(),
            findLastPreviewDraftId: findLastPreviewDraftIdMock,
          },
        },
      );

      expect(response).toEqual({
        status: "LIMIT_REACHED",
        reason: "ip",
        lastDraft: null,
      });

      expect(reservePreviewMock).toHaveBeenCalled();
      expect(generateAdCard).not.toHaveBeenCalled();
    });

    it("settles as FAILED and returns ERROR when AI generation fails", async () => {
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
      const settleMock = vi.fn();

      const response = await executeGeneratePreview(
        { draftId: "draft-123" },
        {
          getDraft,
          generateAdCard,
          watermark,
          updateDraftPreview,
          quota: {
            reservePreview: vi
              .fn()
              .mockResolvedValue({ ok: true, reservationId: "res-123" }),
            settlePreview: settleMock,
            findLastPreviewDraftId: vi.fn(),
          },
        },
      );

      expect(response).toEqual({
        status: "ERROR",
        code: "AI_GENERATION_FAILED",
        message:
          "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
      });

      expect(settleMock).toHaveBeenCalledWith(
        "res-123",
        "FAILED",
        expect.any(Date),
        undefined,
      );
    });

    it("generates preview, settles CONSUMED, and returns status: OK with client draft DTO", async () => {
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
        previewCardImageUrl:
          "https://pub-test.r2.dev/drafts/draft-123/preview.webp",
        aiGenerationCount: 1,
      });
      const settleMock = vi.fn();

      const response = await executeGeneratePreview(
        { draftId: "draft-123" },
        {
          getDraft,
          generateAdCard,
          watermark,
          updateDraftPreview,
          quota: {
            reservePreview: vi
              .fn()
              .mockResolvedValue({ ok: true, reservationId: "res-456" }),
            settlePreview: settleMock,
            findLastPreviewDraftId: vi.fn(),
          },
        },
      );

      expect(response.status).toBe("OK");
      if (response.status === "OK") {
        expect(response.draft.aiGenerationCount).toBe(1);
        expect(response.draft.previewCardImageUrl).toContain("/preview.webp");
        // Verify cleanMaster* and asset keys are NOT present in client DTO
        expect(
          (response.draft as Record<string, unknown>).cleanMasterImageDataUrl,
        ).toBeUndefined();
        expect(
          (response.draft as Record<string, unknown>).cleanMasterAssetKey,
        ).toBeUndefined();
        expect(
          (response.draft as Record<string, unknown>).previewAssetKey,
        ).toBeUndefined();
      }

      expect(settleMock).toHaveBeenCalledWith(
        "res-456",
        "CONSUMED",
        expect.any(Date),
        undefined,
      );
    });
  });

  describe("Integration: Real DB and Watermark with Mocked AI Generator", () => {
    let identity: { visitorId: string; ipHash: string };

    beforeEach(() => {
      identity = {
        visitorId: `visitor-gen-${crypto.randomUUID()}`,
        ipHash: `ip-gen-${crypto.randomUUID()}`,
      };
    });

    it("persists watermarked preview in PostgreSQL, settles ledger, and blocks subsequent attempt", async () => {
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
        { generateAdCard: mockGenerateAdCard, identity },
      );

      expect(firstResponse.status).toBe("OK");
      if (firstResponse.status === "OK") {
        expect(firstResponse.draft.aiGenerationCount).toBe(1);
        expect(firstResponse.draft.previewCardImageUrl).toMatch(
          /^https?:\/\/.+\/drafts\/.+\/preview\.webp$/,
        );
      }

      // 4. Verify draft in DB has been updated atomically
      const [dbRow] = await db
        .select()
        .from(drafts)
        .where(eq(drafts.id, createdDraft.id));

      expect(dbRow.aiGenerationCount).toBe(1);
      expect(dbRow.previewAssetKey).toMatch(/^drafts\/.+\/preview\.webp$/);
      expect(dbRow.cleanMasterAssetKey).toMatch(
        /^drafts\/.+\/private-master-.+\.png$/,
      );

      // 5. Attempt 2nd generation on same draft -> must return LIMIT_REACHED (visitor)
      const secondMockGenerator = vi.fn();
      const secondResponse = await executeGeneratePreview(
        { draftId: createdDraft.id },
        { generateAdCard: secondMockGenerator, identity },
      );

      expect(secondResponse.status).toBe("LIMIT_REACHED");
      if (secondResponse.status === "LIMIT_REACHED") {
        expect(secondResponse.reason).toBe("visitor");
        expect(secondResponse.lastDraft?.id).toBe(createdDraft.id);
      }
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
        { generateAdCard: failingGenerator, identity },
      );

      expect(response).toEqual({
        status: "ERROR",
        code: "AI_GENERATION_FAILED",
        message:
          "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
      });

      // Confirm in real DB that draft was untouched
      const fetched = await getOfferDraft(createdDraft.id);
      expect(fetched?.aiGenerationCount).toBe(0);
      expect(fetched?.previewCardImageUrl).toBeNull();
    });
  });
});
