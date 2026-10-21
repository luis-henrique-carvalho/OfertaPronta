import { describe, it, expect, beforeEach } from "vitest";
import {
  saveOfferDraft,
  getOfferDraft,
  updateDraftPreviewCard,
} from "./drafts.service";
import { saveOfferDraftSchema } from "../../data/offer-brief.schema";
import { db } from "../../../../server/db";
import { drafts } from "../../../../server/db/schema/promotions";
import { eq } from "drizzle-orm";
import {
  InMemoryStorageDriver,
  setStorageServiceForTesting,
} from "../../../../server/storage";

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
      expect(result.targetAspectRatio).toBe("feed");
      expect(result.aiGenerationCount).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("persists targetAspectRatio correctly when defined as story and updates on modification", async () => {
      const created = await saveOfferDraft({
        businessSegment: "burger-shop",
        targetAspectRatio: "story",
        businessName: "Burger House",
        offerTitle: "Combo Story",
        promoPrice: "R$ 39,90",
      });

      expect(created.targetAspectRatio).toBe("story");

      const fetched = await getOfferDraft(created.id);
      expect(fetched?.targetAspectRatio).toBe("story");

      const updated = await saveOfferDraft({
        id: created.id,
        businessSegment: "burger-shop",
        targetAspectRatio: "feed",
        businessName: "Burger House",
        offerTitle: "Combo Story",
        promoPrice: "R$ 39,90",
      });

      expect(updated.targetAspectRatio).toBe("feed");
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

    it("persists cardIntent, customIntentText and logoImageDataUrl correctly", async () => {
      const pngData =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const created = await saveOfferDraft({
        businessSegment: "fashion",
        businessName: "Boutique Flor de Lis",
        offerTitle: "Vestido Longo Seda Pura",
        promoPrice: "R$ 199,90",
        cardIntent: "new-arrival",
        customIntentText: "Chegaram as novidades da estação",
        logoImageDataUrl: pngData,
      });

      expect(created.cardIntent).toBe("new-arrival");
      expect(created.customIntentText).toBe("Chegaram as novidades da estação");
      expect(created.logoImageDataUrl).toBe(pngData);

      const fetched = await getOfferDraft(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.cardIntent).toBe("new-arrival");
      expect(fetched?.customIntentText).toBe(
        "Chegaram as novidades da estação",
      );
      expect(fetched?.logoImageDataUrl).toBe(pngData);
    });

    it("defaults cardIntent to promo and nullable fields to null when not provided", async () => {
      const created = await saveOfferDraft({
        businessSegment: "pizzeria",
        businessName: "Pizzaria Napoli",
        offerTitle: "Pizza Calabresa",
        promoPrice: "R$ 45,00",
      });

      expect(created.cardIntent).toBe("promo");
      expect(created.customIntentText).toBeNull();
      expect(created.logoImageDataUrl).toBeNull();

      const fetched = await getOfferDraft(created.id);
      expect(fetched?.cardIntent).toBe("promo");
      expect(fetched?.customIntentText).toBeNull();
      expect(fetched?.logoImageDataUrl).toBeNull();
    });

    it("updates cardIntent, customIntentText and logoImageDataUrl on conflict", async () => {
      const pngLogo1 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const pngLogo2 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

      const initial = await saveOfferDraft({
        businessSegment: "fashion",
        businessName: "Loja A",
        offerTitle: "Promoção",
        promoPrice: "R$ 50,00",
        cardIntent: "promo",
        logoImageDataUrl: pngLogo1,
      });

      const updated = await saveOfferDraft({
        id: initial.id,
        businessSegment: "fashion",
        businessName: "Loja A",
        offerTitle: "Novidade Exclusiva",
        promoPrice: "R$ 80,00",
        cardIntent: "custom",
        customIntentText: "Comemoração de 5 anos da loja",
        logoImageDataUrl: pngLogo2,
      });

      expect(updated.id).toBe(initial.id);
      expect(updated.cardIntent).toBe("custom");
      expect(updated.customIntentText).toBe("Comemoração de 5 anos da loja");
      expect(updated.logoImageDataUrl).toBe(pngLogo2);

      const fetched = await getOfferDraft(initial.id);
      expect(fetched?.cardIntent).toBe("custom");
      expect(fetched?.customIntentText).toBe("Comemoração de 5 anos da loja");
      expect(fetched?.logoImageDataUrl).toBe(pngLogo2);
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

  describe("updateDraftPreviewCard (Atomic Quota & Watermark Persistence)", () => {
    it("atomically sets previewCardImageUrl and increments aiGenerationCount to 1", async () => {
      const created = await saveOfferDraft({
        businessSegment: "restaurant",
        businessName: "Bistrô do Chef",
        offerTitle: "Prato do Dia",
        promoPrice: "R$ 35,00",
      });

      expect(created.aiGenerationCount).toBe(0);
      expect(created.previewCardImageUrl).toBeNull();

      const previewUrl = "data:image/webp;base64,mockWatermarkPreviewUrl";
      const updated = await updateDraftPreviewCard(created.id, previewUrl);

      expect(updated).not.toBeNull();
      expect(updated?.id).toBe(created.id);
      expect(updated?.previewCardImageUrl).toBe(previewUrl);
      expect(updated?.aiGenerationCount).toBe(1);

      // Verify persistence in subsequent fetch
      const fetched = await getOfferDraft(created.id);
      expect(fetched?.previewCardImageUrl).toBe(previewUrl);
      expect(fetched?.aiGenerationCount).toBe(1);
    });

    it("returns null and refuses to update when aiGenerationCount is already >= 1", async () => {
      const created = await saveOfferDraft({
        businessSegment: "restaurant",
        businessName: "Bistrô do Chef",
        offerTitle: "Prato do Dia",
        promoPrice: "R$ 35,00",
      });

      const firstUrl = "data:image/webp;base64,firstPreviewUrl";
      const firstUpdate = await updateDraftPreviewCard(created.id, firstUrl);
      expect(firstUpdate).not.toBeNull();
      expect(firstUpdate?.aiGenerationCount).toBe(1);

      // Attempt second update on the same draft
      const secondUrl = "data:image/webp;base64,secondPreviewUrl";
      const secondUpdate = await updateDraftPreviewCard(created.id, secondUrl);

      expect(secondUpdate).toBeNull();

      // Ensure original preview and count remain untouched
      const fetched = await getOfferDraft(created.id);
      expect(fetched?.previewCardImageUrl).toBe(firstUrl);
      expect(fetched?.aiGenerationCount).toBe(1);
    });

    it("persists cleanMasterImageDataUrl when updating preview card", async () => {
      const created = await saveOfferDraft({
        businessSegment: "supermarket",
        businessName: "Super Box",
        offerTitle: "Café Torrado 500g",
        promoPrice: "R$ 14,90",
      });

      const previewUrl = "data:image/webp;base64,watermarkedPreview";
      const cleanUrl = "data:image/png;base64,cleanMasterImage";

      const updated = await updateDraftPreviewCard(
        created.id,
        previewUrl,
        undefined,
        cleanUrl,
      );

      expect(updated).not.toBeNull();
      expect(updated?.previewCardImageUrl).toBe(previewUrl);
      expect(updated?.cleanMasterImageDataUrl).toBe(cleanUrl);

      const fetched = await getOfferDraft(created.id);
      expect(fetched?.cleanMasterImageDataUrl).toBe(cleanUrl);
    });
  });

  describe("Drafts Intake & StorageService Decoupling (TOAST Bloat Elimination)", () => {
    let storageDriver: InMemoryStorageDriver;

    beforeEach(() => {
      storageDriver = new InMemoryStorageDriver({
        publicUrlBase: "https://pub-test.r2.dev",
      });
      setStorageServiceForTesting(storageDriver);
    });

    it("uploads Base64 images to StorageService, saves asset keys in PostgreSQL, and sets base64 columns to null", async () => {
      const pngData =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const saved = await saveOfferDraft({
        businessSegment: "fashion",
        businessName: "Loja Teste",
        offerTitle: "Vestido Elegante",
        promoPrice: "R$ 99,90",
        productImageDataUrl: pngData,
        referenceImageDataUrl: pngData,
        logoImageDataUrl: pngData,
      });

      // 1. Asset keys gravados no PostgreSQL
      expect(saved.productAssetKey).toBe(`inputs/${saved.id}/product.png`);
      expect(saved.referenceAssetKey).toBe(`inputs/${saved.id}/reference.png`);
      expect(saved.logoAssetKey).toBe(`inputs/${saved.id}/logo.png`);

      // 2. Coluna no banco PostgreSQL mantida como NULL para eliminar TOAST bloat
      const [dbRow] = await db
        .select()
        .from(drafts)
        .where(eq(drafts.id, saved.id));

      expect(dbRow.productImageDataUrl).toBeNull();
      expect(dbRow.referenceImageDataUrl).toBeNull();
      expect(dbRow.logoImageDataUrl).toBeNull();
      expect(dbRow.productAssetKey).toBe(`inputs/${saved.id}/product.png`);

      // 3. Binários gravados no storage sob inputs/{draftId}/...
      const storedProduct = await storageDriver.getAsset(
        dbRow.productAssetKey!,
      );
      expect(storedProduct).not.toBeNull();
      expect(storedProduct?.contentType).toBe("image/png");

      // 4. getOfferDraft resolve a URL pública para transparência completa do frontend
      const fetched = await getOfferDraft(saved.id);
      expect(fetched?.productImageDataUrl).toBe(
        `https://pub-test.r2.dev/inputs/${saved.id}/product.png`,
      );
      expect(fetched?.referenceImageDataUrl).toBe(
        `https://pub-test.r2.dev/inputs/${saved.id}/reference.png`,
      );
      expect(fetched?.logoImageDataUrl).toBe(
        `https://pub-test.r2.dev/inputs/${saved.id}/logo.png`,
      );
    });

    it("deletes asset from storage and sets asset key to null when user passes null (image removal)", async () => {
      const pngData =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const initial = await saveOfferDraft({
        businessSegment: "fashion",
        businessName: "Loja Teste",
        offerTitle: "Vestido",
        promoPrice: "R$ 99,90",
        productImageDataUrl: pngData,
      });

      const initialAssetKey = initial.productAssetKey!;
      expect(await storageDriver.getAsset(initialAssetKey)).not.toBeNull();

      // Usuário remove a foto passando null
      const updated = await saveOfferDraft({
        id: initial.id,
        businessSegment: "fashion",
        businessName: "Loja Teste",
        offerTitle: "Vestido",
        promoPrice: "R$ 99,90",
        productImageDataUrl: null,
      });

      expect(updated.productAssetKey).toBeNull();
      expect(updated.productImageDataUrl).toBeNull();

      // Asset deve ter sido removido do storage
      expect(await storageDriver.getAsset(initialAssetKey)).toBeNull();

      const [dbRow] = await db
        .select()
        .from(drafts)
        .where(eq(drafts.id, initial.id));
      expect(dbRow.productAssetKey).toBeNull();
      expect(dbRow.productImageDataUrl).toBeNull();
    });

    it("preserves legacy drafts containing Base64 without re-upload", async () => {
      const legacyId = crypto.randomUUID();
      const legacyData =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      // Inserção direta simulando registro legado pré-migração
      await db.insert(drafts).values({
        id: legacyId,
        businessSegment: "fashion",
        businessName: "Legado",
        offerTitle: "Item Legado",
        promoPrice: "R$ 10,00",
        productImageDataUrl: legacyData,
        productAssetKey: null,
      });

      const fetched = await getOfferDraft(legacyId);
      expect(fetched?.productImageDataUrl).toBe(legacyData);
      expect(fetched?.productAssetKey).toBeNull();
    });
  });
});
