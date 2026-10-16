import { describe, expect, it, vi } from "vitest";
import {
  generateAdCardImage,
  AdCardGenerationError,
  type GenerateAdCardInput,
  type GoogleGenAIClient,
} from "./ai-card-generator.service";
import { BUSINESS_SEGMENTS } from "../../data/offer-brief.schema";

describe("AdCardGenerator Deep Module (ai-card-generator.service)", () => {
  const fakeBase64Png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  function createFakeGeminiClient(overrides?: {
    generateContentResult?: {
      candidates?: Array<{
        finishReason?: string;
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: {
              mimeType?: string;
              data?: string;
            };
          }>;
        };
      }>;
    };
    generateContentError?: Error;
  }): GoogleGenAIClient & { generateContentSpy: ReturnType<typeof vi.fn> } {
    const defaultResponse = {
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: fakeBase64Png,
                },
              },
            ],
          },
        },
      ],
    };

    const spy = vi.fn().mockImplementation(async () => {
      if (overrides?.generateContentError) {
        throw overrides.generateContentError;
      }
      return overrides?.generateContentResult ?? defaultResponse;
    });

    return {
      models: {
        generateContent: spy,
      },
      generateContentSpy: spy,
    };
  }

  const baseInput: GenerateAdCardInput = {
    businessSegment: "supermarket",
    businessName: "Supermercado Compre Bem",
    offerTitle: "Picanha Bovina Fatiada 1kg",
    promoPrice: "R$ 49,90",
    originalPrice: "R$ 69,90",
    callToAction: "Aproveite hoje mesmo!",
    whatsapp: "(11) 98888-7777",
  };

  it("deve gerar card com sucesso chamando o modelo multimodal com proporção 4:5", async () => {
    const fakeClient = createFakeGeminiClient();
    const result = await generateAdCardImage(baseInput, fakeClient);

    expect(result.rawImageBuffer).toBeInstanceOf(Buffer);
    expect(result.rawImageBuffer.length).toBeGreaterThan(0);
    expect(result.mimeType).toBe("image/png");

    expect(fakeClient.generateContentSpy).toHaveBeenCalledTimes(1);
    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];

    expect(callArgs.config?.responseModalities).toEqual(["image"]);
    expect(callArgs.config?.responseFormat?.image?.aspectRatio).toBe("4:5");

    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;
    expect(promptText).toContain("Supermercado Compre Bem");
    expect(promptText).toContain("Picanha Bovina Fatiada 1kg");
    expect(promptText).toContain("R$ 49,90");
    expect(promptText).toContain("R$ 69,90");
    expect(promptText).toContain("4:5");
  });

  it("deve gerar card com sucesso chamando o modelo multimodal com proporção 9:16 e safe zone quando targetAspectRatio for story", async () => {
    const fakeClient = createFakeGeminiClient();
    const input: GenerateAdCardInput = {
      ...baseInput,
      targetAspectRatio: "story",
    };
    const result = await generateAdCardImage(input, fakeClient);

    expect(result.rawImageBuffer).toBeInstanceOf(Buffer);
    expect(result.rawImageBuffer.length).toBeGreaterThan(0);
    expect(result.mimeType).toBe("image/png");

    expect(fakeClient.generateContentSpy).toHaveBeenCalledTimes(1);
    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];

    expect(callArgs.config?.responseModalities).toEqual(["image"]);
    expect(callArgs.config?.responseFormat?.image?.aspectRatio).toBe("9:16");

    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;
    expect(promptText).toContain("Supermercado Compre Bem");
    expect(promptText).toContain("9:16");
    expect(promptText).toContain("SAFE ZONE OBRIGATÓRIA");
    expect(promptText).toContain("15% da altura no topo e 15% na base");
  });

  it("deve suportar geração para todos os 6 segmentos comerciais", async () => {
    for (const segment of BUSINESS_SEGMENTS) {
      const fakeClient = createFakeGeminiClient();
      const input: GenerateAdCardInput = {
        ...baseInput,
        businessSegment: segment,
      };

      const result = await generateAdCardImage(input, fakeClient);
      expect(result.rawImageBuffer).toBeInstanceOf(Buffer);

      const promptText = fakeClient.generateContentSpy.mock.calls[0][0]
        .contents[0] as string;
      expect(typeof promptText).toBe("string");
      expect(promptText.length).toBeGreaterThan(50);
    }
  });

  it("deve incluir inlineData e diretrizes quando houver foto do produto", async () => {
    const fakeClient = createFakeGeminiClient();
    const inputWithProduct: GenerateAdCardInput = {
      ...baseInput,
      productImageDataUrl: `data:image/png;base64,${fakeBase64Png}`,
    };

    await generateAdCardImage(inputWithProduct, fakeClient);

    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
    const inlinePart = callArgs.contents.find(
      (c: unknown) =>
        typeof c === "object" &&
        c !== null &&
        "inlineData" in c &&
        (c as { inlineData: { data: string } }).inlineData.data ===
          fakeBase64Png,
    );

    expect(inlinePart).toBeDefined();

    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;
    expect(promptText.toLowerCase()).toContain("produto");
  });

  it("deve incluir inlineData e diretrizes quando houver imagem de referência", async () => {
    const fakeClient = createFakeGeminiClient();
    const inputWithRef: GenerateAdCardInput = {
      ...baseInput,
      referenceImageDataUrl: `data:image/jpeg;base64,${fakeBase64Png}`,
    };

    await generateAdCardImage(inputWithRef, fakeClient);

    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
    const refPart = callArgs.contents.find(
      (c: unknown) =>
        typeof c === "object" &&
        c !== null &&
        "inlineData" in c &&
        (c as { inlineData: { mimeType: string } }).inlineData.mimeType ===
          "image/jpeg",
    );

    expect(refPart).toBeDefined();

    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;
    expect(promptText.toLowerCase()).toContain("referência");
  });

  it("deve lançar AdCardGenerationError com SAFETY_BLOCK quando modelo sinalizar bloqueio de segurança", async () => {
    const fakeClient = createFakeGeminiClient({
      generateContentResult: {
        candidates: [
          {
            finishReason: "SAFETY",
            content: { parts: [] },
          },
        ],
      },
    });

    await expect(generateAdCardImage(baseInput, fakeClient)).rejects.toThrow(
      AdCardGenerationError,
    );

    try {
      await generateAdCardImage(baseInput, fakeClient);
    } catch (err) {
      expect((err as AdCardGenerationError).code).toBe("SAFETY_BLOCK");
    }
  });

  it("deve lançar AdCardGenerationError com NO_IMAGE_RETURNED quando resposta não tiver bytes", async () => {
    const fakeClient = createFakeGeminiClient({
      generateContentResult: {
        candidates: [
          {
            finishReason: "STOP",
            content: { parts: [{ text: "apenas texto sem imagem" }] },
          },
        ],
      },
    });

    await expect(generateAdCardImage(baseInput, fakeClient)).rejects.toThrow(
      AdCardGenerationError,
    );

    try {
      await generateAdCardImage(baseInput, fakeClient);
    } catch (err) {
      expect((err as AdCardGenerationError).code).toBe("NO_IMAGE_RETURNED");
    }
  });

  it("deve incluir diretrizes de stylePresetId e customStyleInstructions quando informados", async () => {
    const fakeClient = createFakeGeminiClient();
    const inputWithStyle: GenerateAdCardInput = {
      ...baseInput,
      stylePresetId: "market-fresh",
      customStyleInstructions: "Usar iluminação solar suave de manhã cedo.",
    };

    await generateAdCardImage(inputWithStyle, fakeClient);

    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;

    expect(promptText).toContain("Feira Fresca & Saudável");
    expect(promptText).toContain("Usar iluminação solar suave de manhã cedo.");
  });

  it("deve encapsular erro 429 como RATE_LIMIT com mensagem amigável", async () => {
    const fakeClient = createFakeGeminiClient({
      generateContentError: new Error("Resource has been exhausted (HTTP 429)"),
    });

    try {
      await generateAdCardImage(baseInput, fakeClient);
      expect.unreachable("Deveria ter lançado erro");
    } catch (err) {
      expect(err).toBeInstanceOf(AdCardGenerationError);
      expect((err as AdCardGenerationError).code).toBe("RATE_LIMIT");
    }
  });

  it("deve encapsular erro de timeout como TIMEOUT com mensagem amigável", async () => {
    const fakeClient = createFakeGeminiClient({
      generateContentError: new Error("The request timed out (ETIMEDOUT)"),
    });

    try {
      await generateAdCardImage(baseInput, fakeClient);
      expect.unreachable("Deveria ter lançado erro");
    } catch (err) {
      expect(err).toBeInstanceOf(AdCardGenerationError);
      expect((err as AdCardGenerationError).code).toBe("TIMEOUT");
    }
  });

  it("deve lançar erro de configuração CONFIG_ERROR quando cliente não for fornecido e não houver GEMINI_API_KEY", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      await expect(generateAdCardImage(baseInput)).rejects.toThrow(
        AdCardGenerationError,
      );
    } finally {
      if (prevKey) process.env.GEMINI_API_KEY = prevKey;
    }
  });
});
