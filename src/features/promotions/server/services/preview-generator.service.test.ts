import { describe, expect, it, vi } from "vitest";
import {
  isAllowedExternalImageUrl,
  fetchExternalImageWithGuard,
  resolveDraftVisualInputs,
} from "./preview-generator.service";
import { InMemoryStorageDriver } from "@/server/storage";
import { MOCK_SHOWCASE_IMAGE_DATA_URL } from "../../data/showcase-catalog";
import type { DraftRow } from "./drafts.service";

describe("PreviewGeneratorService - Security & Visual Inputs Resolution", () => {
  describe("isAllowedExternalImageUrl (SSRF Guard)", () => {
    it("permite domínios autorizados da CDN Cloudflare R2 e Unsplash", () => {
      expect(
        isAllowedExternalImageUrl(
          "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/supermarket/market-discount-encarte.png",
        ),
      ).toBe(true);
      expect(
        isAllowedExternalImageUrl(
          "https://custom-bucket.r2.dev/showcase/card.png",
        ),
      ).toBe(true);
      expect(
        isAllowedExternalImageUrl(
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1080",
        ),
      ).toBe(true);
    });

    it("rejeita URLs com protocolo inseguro (não-HTTPS)", () => {
      expect(
        isAllowedExternalImageUrl(
          "http://pub-ofertapronta.r2.dev/showcase/card.png",
        ),
      ).toBe(false);
      expect(isAllowedExternalImageUrl("file:///etc/passwd")).toBe(false);
      expect(
        isAllowedExternalImageUrl("ftp://pub-ofertapronta.r2.dev/a.png"),
      ).toBe(false);
    });

    it("bloqueia tentativas de SSRF para localhost, loopback e metadados de nuvem", () => {
      expect(isAllowedExternalImageUrl("https://localhost/image.png")).toBe(
        false,
      );
      expect(isAllowedExternalImageUrl("https://127.0.0.1/image.png")).toBe(
        false,
      );
      expect(isAllowedExternalImageUrl("https://127.0.1.1/image.png")).toBe(
        false,
      );
      expect(isAllowedExternalImageUrl("https://[::1]/image.png")).toBe(false);
      expect(
        isAllowedExternalImageUrl("https://169.254.169.254/latest/meta-data"),
      ).toBe(false);
    });

    it("bloqueia redes privadas RFC 1918 e sufixos internos", () => {
      expect(isAllowedExternalImageUrl("https://10.0.0.1/card.png")).toBe(
        false,
      );
      expect(isAllowedExternalImageUrl("https://192.168.1.1/card.png")).toBe(
        false,
      );
      expect(isAllowedExternalImageUrl("https://172.16.0.1/card.png")).toBe(
        false,
      );
      expect(isAllowedExternalImageUrl("https://172.31.255.255/card.png")).toBe(
        false,
      );
      expect(isAllowedExternalImageUrl("https://database.local/card.png")).toBe(
        false,
      );
      expect(
        isAllowedExternalImageUrl("https://internal-service.internal/card.png"),
      ).toBe(false);
    });

    it("bloqueia domínios externos não autorizados", () => {
      expect(
        isAllowedExternalImageUrl("https://malicious-site.com/evil.png"),
      ).toBe(false);
      expect(isAllowedExternalImageUrl("https://google.com/logo.png")).toBe(
        false,
      );
    });

    it("retorna false para strings que não são URLs válidas", () => {
      expect(isAllowedExternalImageUrl("")).toBe(false);
      expect(isAllowedExternalImageUrl("not-a-valid-url")).toBe(false);
    });
  });

  describe("fetchExternalImageWithGuard", () => {
    it("baixa com sucesso imagem permitida retornando buffer binário e contentType", async () => {
      const sampleBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "image/png" }),
        arrayBuffer: async () => sampleBytes.buffer,
      });

      const result = await fetchExternalImageWithGuard(
        "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/test.png",
        { fetchFn: mockFetch },
      );

      expect(result).not.toBeNull();
      expect(result?.contentType).toBe("image/png");
      expect(result?.buffer).toEqual(Buffer.from(sampleBytes));
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("rejeita URL bloqueada por SSRF sem realizar requisição HTTP", async () => {
      const mockFetch = vi.fn();

      const result = await fetchExternalImageWithGuard(
        "https://127.0.0.1/secret.png",
        { fetchFn: mockFetch },
      );

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("retorna null em resposta HTTP de erro (ex: 404 Not Found)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await fetchExternalImageWithGuard(
        "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/missing.png",
        { fetchFn: mockFetch },
      );

      expect(result).toBeNull();
    });

    it("retorna null quando o content-type retornado não for imagem suportada (ex: text/html)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      const result = await fetchExternalImageWithGuard(
        "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/not-image.html",
        { fetchFn: mockFetch },
      );

      expect(result).toBeNull();
    });

    it("retorna null quando o tamanho da imagem excede o limite máximo permitido (5MB)", async () => {
      const sixMb = 6 * 1024 * 1024;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "image/png" }),
        arrayBuffer: async () => new ArrayBuffer(sixMb),
      });

      const result = await fetchExternalImageWithGuard(
        "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/giant.png",
        { fetchFn: mockFetch },
      );

      expect(result).toBeNull();
    });

    it("aplica degradação graciosa (retorna null) em caso de timeout ou erro de rede", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error("Timeout após 5000ms"));

      const result = await fetchExternalImageWithGuard(
        "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/timeout.png",
        { fetchFn: mockFetch },
      );

      expect(result).toBeNull();
    });
  });

  describe("resolveDraftVisualInputs", () => {
    function createMockDraft(overrides?: Partial<DraftRow>): DraftRow {
      return {
        id: crypto.randomUUID(),
        businessSegment: "supermarket",
        targetAspectRatio: "feed",
        businessName: "Super Compre Bem",
        offerTitle: "Encarte Semanal",
        promoPrice: "R$ 19,90",
        originalPrice: null,
        callToAction: null,
        whatsapp: null,
        productImageDataUrl: null,
        referenceImageDataUrl: null,
        logoImageDataUrl: null,
        productAssetKey: null,
        referenceAssetKey: null,
        logoAssetKey: null,
        cleanMasterImageDataUrl: null,
        cleanMasterAssetKey: null,
        previewCardImageUrl: null,
        previewAssetKey: null,
        aiGenerationCount: 0,
        stylePresetId: "market-discount",
        customStyleInstructions: null,
        cardIntent: "promo",
        customIntentText: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    it("converte URL externa HTTPS em MOCK_SHOWCASE_IMAGE_DATA_URL em ambiente de teste", async () => {
      const storage = new InMemoryStorageDriver();
      const draft = createMockDraft({
        referenceImageDataUrl:
          "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/supermarket/market-discount-encarte.png",
      });

      const result = await resolveDraftVisualInputs(draft, storage);

      expect(result.referenceImageDataUrl).toBe(MOCK_SHOWCASE_IMAGE_DATA_URL);
    });

    it("baixa asset externo e converte em data URL base64 quando fetchFn customizado é injetado", async () => {
      const storage = new InMemoryStorageDriver();
      const sampleBytes = new Uint8Array([1, 2, 3, 4]);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "image/png" }),
        arrayBuffer: async () => sampleBytes.buffer,
      });

      const draft = createMockDraft({
        referenceImageDataUrl:
          "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/supermarket/market-discount-encarte.png",
      });

      const result = await resolveDraftVisualInputs(draft, storage, {
        fetchFn: mockFetch,
      });

      expect(result.referenceImageDataUrl).toBe(
        `data:image/png;base64,${Buffer.from(sampleBytes).toString("base64")}`,
      );
    });

    it("aplica degradação graciosa definindo referenceImageDataUrl como undefined quando download falha", async () => {
      const storage = new InMemoryStorageDriver();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const draft = createMockDraft({
        referenceImageDataUrl:
          "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/supermarket/market-discount-encarte.png",
      });

      const result = await resolveDraftVisualInputs(draft, storage, {
        fetchFn: mockFetch,
      });

      expect(result.referenceImageDataUrl).toBeUndefined();
    });

    it("resolve simultaneamente a foto do produto real e a referência da vitrine (Multimodalidade Dupla)", async () => {
      const storage = new InMemoryStorageDriver();
      const productBuffer = Buffer.from("fake-product-image");
      await storage.uploadAsset({
        key: "drafts/123/product.png",
        buffer: productBuffer,
        contentType: "image/png",
        isPublic: true,
      });

      const draft = createMockDraft({
        id: "123",
        productAssetKey: "drafts/123/product.png",
        referenceImageDataUrl:
          "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/supermarket/market-discount-encarte.png",
      });

      const result = await resolveDraftVisualInputs(draft, storage);

      expect(result.productImageDataUrl).toBe(
        `data:image/png;base64,${productBuffer.toString("base64")}`,
      );
      expect(result.referenceImageDataUrl).toBe(MOCK_SHOWCASE_IMAGE_DATA_URL);
    });
  });
});
