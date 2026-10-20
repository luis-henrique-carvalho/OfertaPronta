import { describe, it, expect } from "vitest";
import {
  BUSINESS_SEGMENTS,
  CARD_INTENTS,
  CARD_ASPECT_RATIOS,
  SEGMENT_CATALOG,
  imageDataUrlSchema,
  offerBriefSchema,
  saveOfferDraftSchema,
  deriveVisualInputMode,
  type CardIntent,
} from "./offer-brief.schema";

describe("offer-brief.schema", () => {
  describe("BUSINESS_SEGMENTS and SEGMENT_CATALOG", () => {
    it("should define the 7 expected business segments including fashion", () => {
      expect(BUSINESS_SEGMENTS).toEqual([
        "fashion",
        "supermarket",
        "beauty-salon",
        "pizzeria",
        "burger-shop",
        "restaurant",
        "local-retail",
      ]);
    });

    it("should define the 2 expected card aspect ratios (feed and story)", () => {
      expect(CARD_ASPECT_RATIOS).toEqual(["feed", "story"]);
    });

    it("should have catalog metadata and 4 style presets for each segment", () => {
      for (const segment of BUSINESS_SEGMENTS) {
        const item = SEGMENT_CATALOG[segment];
        expect(item).toBeDefined();
        expect(item.id).toBe(segment);
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.shortDescription.length).toBeGreaterThan(0);
        expect(item.placeholders).toBeDefined();
        expect(item.placeholders.businessName).toBeDefined();
        expect(item.placeholders.offerTitle).toBeDefined();
        expect(item.placeholders.promoPrice).toBeDefined();
        expect(item.exampleOffers.length).toBeGreaterThan(0);
        expect(item.stylePresets).toHaveLength(4);
        for (const preset of item.stylePresets) {
          expect(preset.id).toBeDefined();
          expect(preset.label).toBeDefined();
          expect(preset.description).toBeDefined();
          expect(preset.previewBadgeColor).toBeDefined();
        }
      }
    });
  });

  describe("imageDataUrlSchema", () => {
    it("accepts valid jpeg, png and webp base64 data URLs", () => {
      const validPng =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const validJpeg =
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
      const validWebp =
        "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";

      expect(imageDataUrlSchema.safeParse(validPng).success).toBe(true);
      expect(imageDataUrlSchema.safeParse(validJpeg).success).toBe(true);
      expect(imageDataUrlSchema.safeParse(validWebp).success).toBe(true);
    });

    it("rejects invalid image data URLs and non-image MIME types", () => {
      expect(
        imageDataUrlSchema.safeParse("https://example.com/image.png").success,
      ).toBe(false);
      expect(
        imageDataUrlSchema.safeParse("data:text/plain;base64,SGVsbG8=").success,
      ).toBe(false);
      expect(imageDataUrlSchema.safeParse("not-a-url").success).toBe(false);
    });

    it("rejects data URLs exceeding 4MB limit", () => {
      // 4MB = 4 * 1024 * 1024 = 4,194,304 bytes. In base64 data url, length is roughly bytes * 1.37.
      // Max allowed string length is 4 * 1024 * 1024 * 1.37 + header ~= 5.75MB
      const hugeString = "data:image/png;base64," + "A".repeat(6 * 1024 * 1024);
      expect(imageDataUrlSchema.safeParse(hugeString).success).toBe(false);
    });
  });

  describe("deriveVisualInputMode", () => {
    it("derives product_and_reference when both images are provided", () => {
      const mode = deriveVisualInputMode({
        hasProductImage: true,
        hasReferenceImage: true,
        hasStylePreset: false,
      });
      expect(mode).toBe("product_and_reference");
    });

    it("derives product_only when only product image is provided", () => {
      const mode = deriveVisualInputMode({
        hasProductImage: true,
        hasReferenceImage: false,
        hasStylePreset: true,
      });
      expect(mode).toBe("product_only");
    });

    it("derives reference_only when only reference image is provided", () => {
      const mode = deriveVisualInputMode({
        hasProductImage: false,
        hasReferenceImage: true,
        hasStylePreset: false,
      });
      expect(mode).toBe("reference_only");
    });

    it("derives preset_only when no images are provided but a style preset is chosen", () => {
      const mode = deriveVisualInputMode({
        hasProductImage: false,
        hasReferenceImage: false,
        hasStylePreset: true,
      });
      expect(mode).toBe("preset_only");
    });

    it("derives free_style when neither images nor preset are provided", () => {
      const mode = deriveVisualInputMode({
        hasProductImage: false,
        hasReferenceImage: false,
        hasStylePreset: false,
      });
      expect(mode).toBe("free_style");
    });
  });

  describe("offerBriefSchema and saveOfferDraftSchema", () => {
    const validDraftInput = {
      businessSegment: "supermarket",
      businessName: "Supermercado Bom Preço",
      offerTitle: "Picanha Bovina Fatiada 1kg",
      promoPrice: "R$ 49,90",
      originalPrice: "R$ 69,90",
      callToAction: "Peça no WhatsApp!",
      whatsapp: "11999999999",
      stylePresetId: "market-fresh",
      customStyleInstructions: "Fundo vibrante amarelo e vermelho",
    };

    it("validates a complete valid offer brief", () => {
      const result = offerBriefSchema.safeParse(validDraftInput);
      expect(result.success).toBe(true);
    });

    it("fails when businessName or offerTitle or promoPrice is missing", () => {
      const missingName = { ...validDraftInput, businessName: "" };
      expect(offerBriefSchema.safeParse(missingName).success).toBe(false);

      const missingOffer = { ...validDraftInput, offerTitle: "" };
      expect(offerBriefSchema.safeParse(missingOffer).success).toBe(false);

      const missingPrice = { ...validDraftInput, promoPrice: "" };
      expect(offerBriefSchema.safeParse(missingPrice).success).toBe(false);
    });

    it("saveOfferDraftSchema allows optional draftId and partial fields for drafts", () => {
      const draftResult = saveOfferDraftSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        businessSegment: "pizzeria",
        businessName: "Pizzaria Bella",
        offerTitle: "Pizza Calabresa",
        promoPrice: "R$ 39,90",
      });
      expect(draftResult.success).toBe(true);
    });

    it("validates CARD_ASPECT_RATIOS and defaults targetAspectRatio to feed", () => {
      const parsedBrief = offerBriefSchema.parse(validDraftInput);
      expect(parsedBrief.targetAspectRatio).toBe("feed");

      const parsedStory = offerBriefSchema.parse({
        ...validDraftInput,
        targetAspectRatio: "story",
      });
      expect(parsedStory.targetAspectRatio).toBe("story");

      const invalidAspect = offerBriefSchema.safeParse({
        ...validDraftInput,
        targetAspectRatio: "square",
      });
      expect(invalidAspect.success).toBe(false);

      const parsedDraft = saveOfferDraftSchema.parse({
        businessSegment: "pizzeria",
      });
      expect(parsedDraft.targetAspectRatio).toBe("feed");

      const parsedDraftStory = saveOfferDraftSchema.parse({
        businessSegment: "pizzeria",
        targetAspectRatio: "story",
      });
      expect(parsedDraftStory.targetAspectRatio).toBe("story");
    });

    it("should export CARD_INTENTS with all 6 commercial goals", () => {
      expect(CARD_INTENTS).toEqual([
        "promo",
        "new-arrival",
        "special-date",
        "announcement",
        "schedule",
        "custom",
      ]);
    });

    it("saveOfferDraftSchema supports cardIntent, customIntentText and logoImageDataUrl", () => {
      const validPng =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const parsed = saveOfferDraftSchema.parse({
        businessSegment: "fashion",
        businessName: "Boutique Elegance",
        offerTitle: "Vestido Midi Canelado",
        cardIntent: "new-arrival",
        customIntentText: "Chegou a nova coleção de outono",
        logoImageDataUrl: validPng,
      });

      expect(parsed.businessSegment).toBe("fashion");
      expect(parsed.cardIntent).toBe("new-arrival");
      expect(parsed.customIntentText).toBe("Chegou a nova coleção de outono");
      expect(parsed.logoImageDataUrl).toBe(validPng);
    });

    it("saveOfferDraftSchema defaults cardIntent to promo", () => {
      const parsed = saveOfferDraftSchema.parse({
        businessSegment: "fashion",
      });
      expect(parsed.cardIntent).toBe("promo");
    });

    describe("Conditional Price Validation in offerBriefSchema", () => {
      const baseValid = {
        businessSegment: "fashion" as const,
        businessName: "Boutique Chic",
        offerTitle: "Coleção Outono Inverno",
      };

      it("requires promoPrice when cardIntent is 'promo' (default)", () => {
        const withoutPrice = {
          ...baseValid,
          cardIntent: "promo" as const,
          promoPrice: "",
        };
        const res = offerBriefSchema.safeParse(withoutPrice);
        expect(res.success).toBe(false);
        if (!res.success) {
          const priceIssue = res.error.issues.find((i) =>
            i.path.includes("promoPrice"),
          );
          expect(priceIssue).toBeDefined();
          expect(priceIssue?.message).toContain(
            "Preço promocional é obrigatório",
          );
        }

        const withPrice = {
          ...baseValid,
          cardIntent: "promo" as const,
          promoPrice: "R$ 99,90",
        };
        expect(offerBriefSchema.safeParse(withPrice).success).toBe(true);
      });

      it("makes promoPrice optional for non-promotional intents (new-arrival, special-date, announcement, schedule)", () => {
        const nonPromoIntents: CardIntent[] = [
          "new-arrival",
          "special-date",
          "announcement",
          "schedule",
        ];

        for (const intent of nonPromoIntents) {
          // Without promoPrice
          const resWithoutPrice = offerBriefSchema.safeParse({
            ...baseValid,
            cardIntent: intent,
          });
          expect(resWithoutPrice.success).toBe(true);

          // With empty promoPrice
          const resWithEmptyPrice = offerBriefSchema.safeParse({
            ...baseValid,
            cardIntent: intent,
            promoPrice: "",
          });
          expect(resWithEmptyPrice.success).toBe(true);
        }
      });

      it("makes promoPrice optional for 'custom' intent, but requires customIntentText", () => {
        // Custom without customIntentText -> should fail
        const missingCustomText = offerBriefSchema.safeParse({
          ...baseValid,
          cardIntent: "custom" as const,
        });
        expect(missingCustomText.success).toBe(false);
        if (!missingCustomText.success) {
          const customIssue = missingCustomText.error.issues.find((i) =>
            i.path.includes("customIntentText"),
          );
          expect(customIssue).toBeDefined();
          expect(customIssue?.message).toContain("Descreva o tipo de card");
        }

        // Custom with whitespace customIntentText -> should fail
        const whitespaceCustomText = offerBriefSchema.safeParse({
          ...baseValid,
          cardIntent: "custom" as const,
          customIntentText: "   ",
        });
        expect(whitespaceCustomText.success).toBe(false);

        // Custom with valid customIntentText and no promoPrice -> should pass
        const validCustom = offerBriefSchema.safeParse({
          ...baseValid,
          cardIntent: "custom" as const,
          customIntentText: "Anúncio especial de workshop de estilo",
        });
        expect(validCustom.success).toBe(true);

        // Custom with valid customIntentText and promoPrice -> should pass
        const validCustomWithPrice = offerBriefSchema.safeParse({
          ...baseValid,
          cardIntent: "custom" as const,
          customIntentText: "Anúncio especial de workshop de estilo",
          promoPrice: "R$ 150,00",
        });
        expect(validCustomWithPrice.success).toBe(true);
      });

      it("accepts logoImageDataUrl and validates 4MB limit", () => {
        const validPng =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        const res = offerBriefSchema.safeParse({
          ...baseValid,
          cardIntent: "announcement" as const,
          logoImageDataUrl: validPng,
        });
        expect(res.success).toBe(true);

        const invalidLogo = offerBriefSchema.safeParse({
          ...baseValid,
          cardIntent: "announcement" as const,
          logoImageDataUrl: "invalid-not-base64",
        });
        expect(invalidLogo.success).toBe(false);
      });
    });
  });
});
