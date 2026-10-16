import { describe, it, expect } from "vitest";
import { saveOfferDraft, getOfferDraft } from "./drafts.service";
import { saveOfferDraftSchema } from "../../data/offer-brief.schema";

describe("Drafts Service (Deep Domain Module)", () => {
  describe("Input validation schemas", () => {
    it("saveOfferDraftSchema validates valid briefing payload", () => {
      const parsed = saveOfferDraftSchema.safeParse({
        businessSegment: "pizzeria",
        businessName: "Pizzaria Da Mamma",
        offerTitle: "Pizza Margherita",
        promoPrice: "R$ 42,00",
      });
      expect(parsed.success).toBe(true);
    });

    it("saveOfferDraftSchema rejects invalid segments", () => {
      const parsed = saveOfferDraftSchema.safeParse({
        businessSegment: "invalid-segment",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("saveOfferDraft & getOfferDraft (Atomic PostgreSQL Upsert)", () => {
    it("creates a new draft with generated ID and default values", async () => {
      const result = await saveOfferDraft({
        businessSegment: "supermarket",
        businessName: "Super Compre Bem",
        offerTitle: "Picanha Resfriada 1kg",
        promoPrice: "R$ 49,90",
        originalPrice: "R$ 69,90",
        callToAction: "Peça já!",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.businessSegment).toBe("supermarket");
      expect(result.businessName).toBe("Super Compre Bem");
      expect(result.offerTitle).toBe("Picanha Resfriada 1kg");
      expect(result.promoPrice).toBe("R$ 49,90");
      expect(result.originalPrice).toBe("R$ 69,90");
      expect(result.callToAction).toBe("Peça já!");
      expect(result.aiGenerationCount).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("updates an existing draft atomically on ID conflict without losing createdAt or aiGenerationCount", async () => {
      const initial = await saveOfferDraft({
        businessSegment: "pizzeria",
        businessName: "Pizzaria Bella",
        offerTitle: "Pizza Calabresa",
        promoPrice: "R$ 39,90",
      });

      const updated = await saveOfferDraft({
        id: initial.id,
        businessSegment: "pizzeria",
        businessName: "Pizzaria Bella Napoli",
        offerTitle: "Pizza Calabresa Especial + Refri",
        promoPrice: "R$ 49,90",
        stylePresetId: "pizza-rustic-wood",
      });

      expect(updated.id).toBe(initial.id);
      expect(updated.businessName).toBe("Pizzaria Bella Napoli");
      expect(updated.offerTitle).toBe("Pizza Calabresa Especial + Refri");
      expect(updated.promoPrice).toBe("R$ 49,90");
      expect(updated.stylePresetId).toBe("pizza-rustic-wood");
      expect(updated.aiGenerationCount).toBe(0);
      expect(updated.createdAt.getTime()).toBe(initial.createdAt.getTime());
    });

    it("persists visual images and instructions correctly", async () => {
      const pngData =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const saved = await saveOfferDraft({
        businessSegment: "beauty-salon",
        businessName: "Studio Glam",
        offerTitle: "Escova Modelada",
        promoPrice: "R$ 80,00",
        productImageDataUrl: pngData,
        referenceImageDataUrl: pngData,
        customStyleInstructions: "Iluminação de estúdio suave",
      });

      expect(saved.productImageDataUrl).toBe(pngData);
      expect(saved.referenceImageDataUrl).toBe(pngData);
      expect(saved.customStyleInstructions).toBe("Iluminação de estúdio suave");
    });

    it("retrieves saved draft by ID with getOfferDraft", async () => {
      const created = await saveOfferDraft({
        businessSegment: "burger-shop",
        businessName: "Smash Burger",
        offerTitle: "Duplo Bacon",
        promoPrice: "R$ 29,90",
      });

      const fetched = await getOfferDraft(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.businessName).toBe("Smash Burger");
      expect(fetched?.businessSegment).toBe("burger-shop");
    });

    it("returns null when draft does not exist or empty ID is provided", async () => {
      const emptyResult = await getOfferDraft("");
      expect(emptyResult).toBeNull();

      const nonExistent = await getOfferDraft("non-existent-uuid-12345");
      expect(nonExistent).toBeNull();
    });
  });
});
