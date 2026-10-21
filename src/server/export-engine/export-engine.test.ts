import { describe, expect, it, beforeEach, afterEach } from "vitest";
import sharp from "sharp";
import type { InMemoryStorageDriver } from "../storage/memory-driver";
import {
  applyWatermark,
  applyCobrandingSignature,
  formatFeedCard,
  formatStoryCard,
  type WatermarkOptions,
  type ExportEngine,
  getExportEngine,
  setExportEngineForTesting,
} from "./index";

describe("ExportEngine Deep Module", () => {
  // Helper para criar buffer de teste em memória
  async function createTestImage(width = 1080, height = 1350): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 230, g: 80, b: 40, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  }

  describe("formatFeedCard", () => {
    it("deve redimensionar e formatar uma imagem para exatamente 1080x1350", async () => {
      const sourceBuffer = await createTestImage(500, 500);
      const feedBuffer = await formatFeedCard(sourceBuffer);

      const metadata = await sharp(feedBuffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
      expect(metadata.format).toBeDefined();
    });

    it("deve preservar proporção e gerar 1080x1350 quando a imagem já tem proporção 4:5", async () => {
      const sourceBuffer = await createTestImage(720, 900);
      const feedBuffer = await formatFeedCard(sourceBuffer);

      const metadata = await sharp(feedBuffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
    });

    it("deve compor com fundo harmônico lateral sem cortar elementos quando receber imagem 9:16 (Story)", async () => {
      const storyBuffer = await createTestImage(1080, 1920);
      const feedBuffer = await formatFeedCard(storyBuffer);

      const metadata = await sharp(feedBuffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
    });
  });

  describe("formatStoryCard", () => {
    it("deve redimensionar nativamente para 1080x1920 quando a imagem já tem proporção 9:16 (Story)", async () => {
      const nativeStoryBuffer = await createTestImage(720, 1280);
      const storyBuffer = await formatStoryCard(nativeStoryBuffer);

      const metadata = await sharp(storyBuffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1920);
    });

    it("deve derivar card no formato Story (1080x1920) com barras harmônicas desfocadas", async () => {
      const feedBuffer = await createTestImage(1080, 1350);
      const storyBuffer = await formatStoryCard(feedBuffer);

      const metadata = await sharp(storyBuffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1920);
    });

    it("deve aceitar imagem de qualquer dimensão e gerar 1080x1920", async () => {
      const arbitraryBuffer = await createTestImage(600, 800);
      const storyBuffer = await formatStoryCard(arbitraryBuffer);

      const metadata = await sharp(storyBuffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1920);
    });
  });

  describe("applyWatermark", () => {
    it("deve aplicar marca d'água e retornar buffer, dataUrl e dimensões", async () => {
      const originalBuffer = await createTestImage(1080, 1350);
      const result = await applyWatermark(originalBuffer);

      expect(result.width).toBe(1080);
      expect(result.height).toBe(1350);
      expect(result.watermarkedBuffer).toBeInstanceOf(Buffer);
      expect(result.dataUrl).toMatch(/^data:image\/[a-z]+;base64,/);

      // O buffer alterado deve ser válido no Sharp
      const metadata = await sharp(result.watermarkedBuffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);

      // Os buffers devem ser diferentes (marca d'água altera os pixels)
      expect(result.watermarkedBuffer.equals(originalBuffer)).toBe(false);
    });

    it("deve aceitar opções customizadas de texto na marca d'água", async () => {
      const originalBuffer = await createTestImage(1080, 1350);
      const customOptions: WatermarkOptions = {
        watermarkText: "AMOSTRA GRÁTIS",
        subText: "PAGAMENTO PENDENTE",
      };

      const result = await applyWatermark(originalBuffer, customOptions);
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1350);
      expect(result.dataUrl).toContain(";base64,");
    });

    it("deve aplicar marca d'água dinamicamente preservando dimensões 9:16 Story (1080x1920)", async () => {
      const storyBuffer = await createTestImage(1080, 1920);
      const result = await applyWatermark(storyBuffer);

      expect(result.width).toBe(1080);
      expect(result.height).toBe(1920);
      expect(result.watermarkedBuffer).toBeInstanceOf(Buffer);

      const metadata = await sharp(result.watermarkedBuffer).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1920);
    });

    it("deve lançar erro descritivo quando receber buffer inválido", async () => {
      const corruptBuffer = Buffer.from("isto-nao-e-uma-imagem");
      await expect(applyWatermark(corruptBuffer)).rejects.toThrow();
    });
  });

  describe("applyCobrandingSignature", () => {
    it("deve renderizar a assinatura vetorial em formato Feed (1080x1350) com dimensões preservadas", async () => {
      const feedBuffer = await createTestImage(1080, 1350);
      const result = await applyCobrandingSignature(feedBuffer, {
        creditText: "Design por @ofertapronta",
        aspectRatio: "feed",
      });

      expect(result).toBeInstanceOf(Buffer);
      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
      expect(metadata.format).toBe("png");
      expect(result.equals(feedBuffer)).toBe(false);
    });

    it("deve renderizar a assinatura vetorial em formato Story (1080x1920) com dimensões preservadas", async () => {
      const storyBuffer = await createTestImage(1080, 1920);
      const result = await applyCobrandingSignature(storyBuffer, {
        creditText: "Design por @ofertapronta",
        aspectRatio: "story",
      });

      expect(result).toBeInstanceOf(Buffer);
      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1920);
      expect(metadata.format).toBe("png");
      expect(result.equals(storyBuffer)).toBe(false);
    });

    it("deve usar o texto de crédito padrão quando creditText não for informado", async () => {
      const feedBuffer = await createTestImage(1080, 1350);
      const result = await applyCobrandingSignature(feedBuffer);

      expect(result).toBeInstanceOf(Buffer);
      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
    });

    it("deve escapar caracteres especiais de XML para prevenir injeção ou quebra do SVG", async () => {
      const feedBuffer = await createTestImage(1080, 1350);
      const result = await applyCobrandingSignature(feedBuffer, {
        creditText: "Design <Oferta & Pronta> 'Test'",
      });

      expect(result).toBeInstanceOf(Buffer);
      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1350);
    });

    it("deve detectar aspect ratio Story automaticamente quando height > 1600", async () => {
      const tallBuffer = await createTestImage(1080, 1920);
      const result = await applyCobrandingSignature(tallBuffer);

      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(1080);
      expect(metadata.height).toBe(1920);
    });
  });

  describe("ExportEngine Deep Module High-Level Interface", () => {
    let memoryStorage: InMemoryStorageDriver;
    let exportEngine: ExportEngine;

    beforeEach(async () => {
      const { InMemoryStorageDriver } =
        await import("../storage/memory-driver");
      setExportEngineForTesting(null);
      memoryStorage = new InMemoryStorageDriver({
        publicUrlBase: "https://assets.ofertapronta.com.br",
      });
      exportEngine = getExportEngine({ storageService: memoryStorage });
    });

    afterEach(() => {
      setExportEngineForTesting(null);
    });

    it("exportPreviewCard deve gerar e armazenar prévia com marca d'água e mestre limpa privada", async () => {
      const rawImage = await createTestImage(1080, 1350);
      const result = await exportEngine.exportPreviewCard({
        draftId: "draft-abc",
        rawImageBuffer: rawImage,
      });

      expect(result.previewAssetKey).toBe("drafts/draft-abc/preview.webp");
      expect(result.cleanMasterAssetKey).toMatch(
        /^drafts\/draft-abc\/private-master-\d+\.png$/,
      );
      expect(result.previewUrl).toBe(
        "https://assets.ofertapronta.com.br/drafts/draft-abc/preview.webp",
      );
      expect(result.watermarkedBuffer).toBeInstanceOf(Buffer);

      const previewAsset = await memoryStorage.getAsset(result.previewAssetKey);
      expect(previewAsset).not.toBeNull();
      expect(previewAsset?.contentType).toBe("image/webp");

      const masterAsset = await memoryStorage.getAsset(
        result.cleanMasterAssetKey,
      );
      expect(masterAsset).not.toBeNull();
      expect(masterAsset?.contentType).toBe("image/png");
      expect(masterAsset?.buffer.equals(rawImage)).toBe(true);
    });

    it("exportFinalCampaign deve formatar Feed (1080x1350), Story (1080x1920), aplicar co-branding e anexar ?v={timestamp}", async () => {
      const masterBuffer = await createTestImage(1080, 1350);
      const result = await exportEngine.exportFinalCampaign({
        orderId: "order-xyz",
        masterBuffer,
        cobranding: {
          accepted: true,
          creditText: "Design por @ofertapronta",
        },
      });

      expect(result.feedAssetKey).toBe("orders/order-xyz/feed.png");
      expect(result.storyAssetKey).toBe("orders/order-xyz/story.png");
      expect(result.feedUrl).toMatch(
        /^https:\/\/assets\.ofertapronta\.com\.br\/orders\/order-xyz\/feed\.png\?v=\d+$/,
      );
      expect(result.storyUrl).toMatch(
        /^https:\/\/assets\.ofertapronta\.com\.br\/orders\/order-xyz\/story\.png\?v=\d+$/,
      );

      const feedMeta = await sharp(result.feedBuffer).metadata();
      expect(feedMeta.width).toBe(1080);
      expect(feedMeta.height).toBe(1350);

      const storyMeta = await sharp(result.storyBuffer).metadata();
      expect(storyMeta.width).toBe(1080);
      expect(storyMeta.height).toBe(1920);

      const storedFeed = await memoryStorage.getAsset(
        "orders/order-xyz/feed.png",
      );
      const storedStory = await memoryStorage.getAsset(
        "orders/order-xyz/story.png",
      );
      expect(storedFeed).not.toBeNull();
      expect(storedStory).not.toBeNull();
    });

    it("saveCleanMaster deve salvar arte mestre sob chave canônica {prefix}/{ownerId}/private-master-{timestamp}.png", async () => {
      const masterBuffer = await createTestImage(1080, 1350);
      const result = await exportEngine.saveCleanMaster({
        ownerId: "order-xyz",
        buffer: masterBuffer,
        prefix: "orders",
      });

      expect(result.key).toMatch(
        /^orders\/order-xyz\/private-master-\d+\.png$/,
      );
      expect(result.url).toContain(
        "https://assets.ofertapronta.com.br/orders/order-xyz/private-master-",
      );

      const stored = await memoryStorage.getAsset(result.key);
      expect(stored).not.toBeNull();
      expect(stored?.contentType).toBe("image/png");
    });

    it("getExportEngine deve retornar singleton e permitir override para testes via setExportEngineForTesting", () => {
      setExportEngineForTesting(null);

      const engine1 = getExportEngine();
      const engine2 = getExportEngine();
      expect(engine1).toBe(engine2);

      const mockEngine: ExportEngine = {
        exportPreviewCard: async () => ({
          previewUrl: "mock-url",
          previewAssetKey: "mock-key",
          cleanMasterAssetKey: "mock-master-key",
          watermarkedBuffer: Buffer.from(""),
        }),
        exportFinalCampaign: async () => ({
          feedUrl: "mock-feed",
          feedAssetKey: "mock-feed-key",
          storyUrl: "mock-story",
          storyAssetKey: "mock-story-key",
          feedBuffer: Buffer.from(""),
          storyBuffer: Buffer.from(""),
        }),
        saveCleanMaster: async () => ({
          key: "mock-key",
          url: "mock-url",
        }),
      };

      setExportEngineForTesting(mockEngine);
      expect(getExportEngine()).toBe(mockEngine);
    });
  });
});
