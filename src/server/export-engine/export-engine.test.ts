import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  applyWatermark,
  applyCobrandingSignature,
  formatFeedCard,
  formatStoryCard,
  type WatermarkOptions,
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
});
