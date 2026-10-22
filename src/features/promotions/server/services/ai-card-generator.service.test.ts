import { describe, expect, it, vi } from "vitest";
import {
  generateAdCardImage,
  AdCardGenerationError,
  isReferenceDrivenMode,
  buildPromptText,
  REFERENCE_STYLE_PRESET_ID,
  type GenerateAdCardInput,
  type GoogleGenAIClient,
  type PromptPlannerClient,
} from "./ai-card-generator.service";
import { serverEnv } from "@/config/server-env";
import {
  BUSINESS_SEGMENTS,
  CARD_INTENTS,
  type CardIntent,
} from "../../data/offer-brief.schema";
import { buildAdCardInput } from "./preview-generator.service";
import type { OfferDraft } from "./drafts.service";

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
    expect(callArgs.config?.imageConfig).toEqual({
      aspectRatio: "4:5",
      imageSize: "1K",
    });

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
    expect(callArgs.config?.imageConfig).toEqual({
      aspectRatio: "9:16",
      imageSize: "1K",
    });

    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;
    expect(promptText).toContain("Supermercado Compre Bem");
    expect(promptText).toContain("9:16");
    expect(promptText).toContain(
      "preserva rigorosamente 15% no topo e 15% na base totalmente livres de textos",
    );
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

    expect(promptText).toContain("Supermercado Compre Bem");
    expect(promptText).toContain("Usar iluminação solar suave de manhã cedo.");
  });

  it("deve gerar card com sucesso quando stylePresetId for market-discount", async () => {
    const fakeClient = createFakeGeminiClient();
    const inputWithMarketDiscount: GenerateAdCardInput = {
      ...baseInput,
      businessSegment: "supermarket",
      stylePresetId: "market-discount",
    };

    const result = await generateAdCardImage(
      inputWithMarketDiscount,
      fakeClient,
    );
    expect(result.rawImageBuffer).toBeInstanceOf(Buffer);

    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;

    expect(promptText).toContain("Supermercado Compre Bem");
    expect(promptText).toContain("Picanha Bovina Fatiada 1kg");
  });

  it("deve utilizar o fallback de direção de arte do segmento quando presetId for inválido ou inexistente sem lançar erro", async () => {
    const fakeClient = createFakeGeminiClient();
    const inputWithInvalidPreset: GenerateAdCardInput = {
      ...baseInput,
      businessSegment: "pizzeria",
      stylePresetId: "estilo-pizza-fantasma",
    };

    const result = await generateAdCardImage(
      inputWithInvalidPreset,
      fakeClient,
    );
    expect(result.rawImageBuffer).toBeInstanceOf(Buffer);

    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;

    expect(promptText).toContain("pizzaria artesanal");
    expect(promptText).toContain("Picanha Bovina Fatiada 1kg");
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

  it("deve incluir baseCardImageDataUrl e [IMAGEM BASE DO CARD] quando imagem base for fornecida sem instruções customizadas", async () => {
    const fakeClient = createFakeGeminiClient();
    const inputWithBaseCard: GenerateAdCardInput = {
      ...baseInput,
      baseCardImageDataUrl: `data:image/png;base64,${fakeBase64Png}`,
    };

    await generateAdCardImage(inputWithBaseCard, fakeClient);

    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];

    // Verifica se a imagem base foi enviada como inlineData prioritário
    const baseCardPart = callArgs.contents.find(
      (c: unknown) =>
        typeof c === "object" &&
        c !== null &&
        "inlineData" in c &&
        (c as { inlineData: { data: string } }).inlineData.data ===
          fakeBase64Png,
    );
    expect(baseCardPart).toBeDefined();

    expect(callArgs.contents).toContain(
      "[IMAGEM BASE DO CARD: Preservar estrutura e aplicar os ajustes solicitados]",
    );
  });

  describe("Épico 6: Logotipo Multimodal, Objetivos de Anúncio e Preço Opcional", () => {
    it("deve incluir logotipo como InlineDataPart e instruções de posicionamento sem distorção quando logoImageDataUrl for fornecido", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputWithLogo: GenerateAdCardInput = {
        ...baseInput,
        logoImageDataUrl: `data:image/png;base64,${fakeBase64Png}`,
      };

      await generateAdCardImage(inputWithLogo, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const logoPart = callArgs.contents.find(
        (c: unknown) =>
          typeof c === "object" &&
          c !== null &&
          "inlineData" in c &&
          (c as { inlineData: { data: string } }).inlineData.data ===
            fakeBase64Png,
      );

      expect(logoPart).toBeDefined();

      const stringsInContents = callArgs.contents.filter(
        (c: unknown): c is string => typeof c === "string",
      );

      expect(
        stringsInContents.some((s: string) => s.includes("LOGOTIPO OFICIAL")),
      ).toBe(true);
    });

    it("deve injetar diretriz textual de objetivo específica para cada um dos 6 cardIntent", async () => {
      const intentExpectations: Record<CardIntent, string[]> = {
        promo: ["apelo promocional marcante", "alto contraste no preço"],
        "new-arrival": ["sofisticação", "novidade"],
        "special-date": ["ambientação temática", "data comemorativa"],
        announcement: ["clareza institucional", "inauguração"],
        schedule: ["legibilidade", "horário de atendimento"],
        custom: ["Festival de Inverno com Rodízio", "personalizada"],
      };

      for (const intent of CARD_INTENTS) {
        const fakeClient = createFakeGeminiClient();
        const input: GenerateAdCardInput = {
          ...baseInput,
          cardIntent: intent,
          customIntentText:
            intent === "custom" ? "Festival de Inverno com Rodízio" : undefined,
        };

        await generateAdCardImage(input, fakeClient);

        const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
        const promptText = callArgs.contents.find(
          (c: unknown) => typeof c === "string",
        ) as string;

        for (const expectedPhrase of intentExpectations[intent]) {
          expect(promptText.toLowerCase()).toContain(
            expectedPhrase.toLowerCase(),
          );
        }
      }
    });

    it("deve tratar ausência ou vazio de promoPrice com supressão estrita de preço proibindo 'R$ 0,00'", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputWithoutPrice: GenerateAdCardInput = {
        ...baseInput,
        promoPrice: "",
        originalPrice: null,
      };

      await generateAdCardImage(inputWithoutPrice, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain("peça institucional");
      expect(promptText).not.toContain("R$ 0,00");
      expect(promptText).not.toContain("preço promocional");
    });

    it("deve suportar geração com promoPrice undefined ou null", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputWithoutPrice: GenerateAdCardInput = {
        ...baseInput,
        promoPrice: undefined,
        originalPrice: undefined,
      };

      await generateAdCardImage(inputWithoutPrice, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain("peça institucional");
      expect(promptText).not.toContain("R$ 0,00");
    });

    it("deve aplicar diretrizes de boutique e iluminação suave para o segmento fashion", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputFashion: GenerateAdCardInput = {
        ...baseInput,
        businessSegment: "fashion",
        offerTitle: "Coleção Outono/Inverno",
      };

      await generateAdCardImage(inputFashion, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText.toLowerCase()).toContain(
        "boutique contemporânea de moda feminina",
      );
      expect(promptText).toContain(
        "Luz suave e difusa de janela de estúdio fotográfico",
      );
    });

    it("deve repassar logoImageDataUrl, cardIntent e customIntentText do draft para o AdCardInput em buildAdCardInput", () => {
      const draft: OfferDraft = {
        id: "draft-test-1",
        businessSegment: "fashion",
        targetAspectRatio: "feed",
        businessName: "Boutique Elegance",
        offerTitle: "Nova Coleção Primavera",
        promoPrice: "",
        originalPrice: null,
        callToAction: "Visite nossa loja",
        whatsapp: "(11) 99999-0000",
        productImageDataUrl: null,
        referenceImageDataUrl: null,
        stylePresetId: "fashion-minimal-boutique",
        customStyleInstructions: null,
        cleanMasterImageDataUrl: null,
        previewCardImageUrl: null,
        previewAssetKey: null,
        cleanMasterAssetKey: null,
        productAssetKey: null,
        referenceAssetKey: null,
        logoAssetKey: null,
        cardIntent: "new-arrival",
        customIntentText: "Coleção exclusiva",
        logoImageDataUrl: "data:image/png;base64,mockLogoBase64",
        aiGenerationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cardInput = buildAdCardInput(draft);

      expect(cardInput.businessSegment).toBe("fashion");
      expect(cardInput.cardIntent).toBe("new-arrival");
      expect(cardInput.customIntentText).toBe("Coleção exclusiva");
      expect(cardInput.logoImageDataUrl).toBe(
        "data:image/png;base64,mockLogoBase64",
      );
      expect(cardInput.promoPrice).toBe("");
    });
  });

  describe("Modo REFERENCE_DRIVEN e Eliminação de Attention Bleeding (Ticket 01)", () => {
    const fakeDataUrl = `data:image/jpeg;base64,${fakeBase64Png}`;

    describe("isReferenceDrivenMode helper", () => {
      it("deve retornar true quando referenceImageDataUrl estiver presente e stylePresetId for REFERENCE_STYLE_PRESET_ID", () => {
        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: fakeDataUrl,
            stylePresetId: REFERENCE_STYLE_PRESET_ID,
          }),
        ).toBe(true);
      });

      it("deve retornar true quando referenceImageDataUrl estiver presente e stylePresetId for null, undefined, vazio ou espaços", () => {
        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: fakeDataUrl,
            stylePresetId: undefined,
          }),
        ).toBe(true);

        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: fakeDataUrl,
            stylePresetId: null,
          }),
        ).toBe(true);

        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: fakeDataUrl,
            stylePresetId: "",
          }),
        ).toBe(true);

        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: fakeDataUrl,
            stylePresetId: "   ",
          }),
        ).toBe(true);
      });

      it("deve retornar false quando referenceImageDataUrl estiver ausente, mesmo com stylePresetId reference-style", () => {
        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: undefined,
            stylePresetId: REFERENCE_STYLE_PRESET_ID,
          }),
        ).toBe(false);

        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: null,
            stylePresetId: REFERENCE_STYLE_PRESET_ID,
          }),
        ).toBe(false);

        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: "",
            stylePresetId: REFERENCE_STYLE_PRESET_ID,
          }),
        ).toBe(false);

        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: "   ",
            stylePresetId: REFERENCE_STYLE_PRESET_ID,
          }),
        ).toBe(false);
      });

      it("deve retornar false quando referenceImageDataUrl estiver presente mas stylePresetId for um preset de catálogo explícito", () => {
        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: fakeDataUrl,
            stylePresetId: "burger-dark-bold",
          }),
        ).toBe(false);

        expect(
          isReferenceDrivenMode({
            referenceImageDataUrl: fakeDataUrl,
            stylePresetId: "fashion-boutique",
          }),
        ).toBe(false);
      });
    });

    describe("Compilação de Prompt no Modo REFERENCE_DRIVEN (buildPromptText)", () => {
      const referenceDrivenInput: GenerateAdCardInput = {
        businessSegment: "burger-shop",
        businessName: "Burger Artesanal da Vila",
        offerTitle: "Smash Burger Duplo com Fritas",
        promoPrice: "R$ 32,90",
        originalPrice: "R$ 42,90",
        callToAction: "Peça pelo WhatsApp!",
        whatsapp: "(11) 97777-6666",
        referenceImageDataUrl: fakeDataUrl,
        stylePresetId: REFERENCE_STYLE_PRESET_ID,
      };

      it("deve compilar prompt de 4 parágrafos incorporando a referência anexa", () => {
        const promptText = buildPromptText(referenceDrivenInput);

        const paragraphs = promptText.split("\n\n");
        expect(paragraphs.length).toBe(4);
        expect(promptText).toContain("Burger Artesanal da Vila");
        expect(promptText).toContain("Smash Burger Duplo com Fritas");
        expect(promptText).toContain("R$ 32,90");
        expect(promptText).toContain(
          "A atmosfera e paleta de iluminação absorvem a referência estética anexa",
        );
      });

      it("deve eliminar estritamente o attention bleeding: ZERO códigos HEX e ZERO diretrizes legadas", () => {
        const promptText = buildPromptText(referenceDrivenInput);

        // Zero códigos HEX
        expect(promptText).not.toMatch(/#[0-9A-Fa-f]{3,6}\b/);
        expect(promptText).not.toContain(
          "DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL:",
        );
        expect(promptText).not.toContain("ZERO OCLUSÃO TIPOGRÁFICA");
        expect(promptText).not.toContain("--- REGRA");
      });

      it("deve operar com referência quando stylePresetId for undefined ou null com referenceImageDataUrl", () => {
        const inputUndefined: GenerateAdCardInput = {
          ...referenceDrivenInput,
          stylePresetId: undefined,
        };
        const promptText = buildPromptText(inputUndefined);

        expect(promptText).toContain("Smash Burger Duplo com Fritas");
        expect(promptText).not.toMatch(/#[0-9A-Fa-f]{3,6}\b/);
      });

      it("deve aplicar safe zone de 15% no topo e base quando targetAspectRatio for story", () => {
        const inputStory: GenerateAdCardInput = {
          ...referenceDrivenInput,
          targetAspectRatio: "story",
        };
        const promptText = buildPromptText(inputStory);

        expect(promptText).toContain("9:16");
        expect(promptText).toContain(
          "preserva rigorosamente 15% no topo e 15% na base totalmente livres de textos",
        );
      });

      it("deve gerar card com sucesso via generateAdCardImage no modo com referência", async () => {
        const fakeClient = createFakeGeminiClient();
        const result = await generateAdCardImage(
          referenceDrivenInput,
          fakeClient,
        );

        expect(result.rawImageBuffer).toBeInstanceOf(Buffer);
        const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
        const promptText = callArgs.contents.find(
          (c: unknown) => typeof c === "string",
        ) as string;

        expect(promptText).toContain("Smash Burger Duplo com Fritas");
        expect(promptText).not.toMatch(/#[0-9A-Fa-f]{3,6}\b/);
      });
    });

    describe("Modo Híbrido e Catálogo", () => {
      it("deve compilar prompt de 4 parágrafos preservando oferta e marca", () => {
        const hybridInput: GenerateAdCardInput = {
          businessSegment: "burger-shop",
          businessName: "Burger Artesanal da Vila",
          offerTitle: "Smash Burger Duplo",
          promoPrice: "R$ 32,90",
          referenceImageDataUrl: fakeDataUrl,
          stylePresetId: "burger-dark-bold",
        };

        const promptText = buildPromptText(hybridInput);
        const paragraphs = promptText.split("\n\n");
        expect(paragraphs.length).toBe(4);
        expect(promptText).toContain("Smash Burger Duplo");
        expect(promptText).toContain("Burger Artesanal da Vila");
      });

      it("deve compilar prompt limpo sem códigos HEX quando não houver referenceImageDataUrl", () => {
        const catalogInput: GenerateAdCardInput = {
          businessSegment: "burger-shop",
          businessName: "Burger Artesanal da Vila",
          offerTitle: "Smash Burger Duplo",
          promoPrice: "R$ 32,90",
          stylePresetId: "burger-dark-bold",
        };

        const promptText = buildPromptText(catalogInput);
        expect(promptText).toContain("Smash Burger Duplo");
        expect(promptText).not.toMatch(/#[0-9A-Fa-f]{3,6}\b/);
      });
    });
  });

  describe("Ticket 01: Integração com PromptEngine v2 e Edição Conversacional Inteligente", () => {
    it("deve executar o pipeline híbrido em 2 etapas com sucesso quando enableDynamicPlanner for true", async () => {
      const fakeImageClient = createFakeGeminiClient();
      const mockPlannerGenerateContent = vi.fn().mockResolvedValue({
        text: "Fotografia publicitária comercial em proporção 4:5 apresentando burger monumental.\n\nIluminação cinematográfica 85mm com rim light e zona limpa.\n\nTipografia com Monster Smash Burger e Duplo Cheddar.\n\nMicro-copy sensorial e badge de preço chamativo.",
      });
      const mockPlannerClient: PromptPlannerClient = {
        models: {
          generateContent: mockPlannerGenerateContent,
        },
      };

      const result = await generateAdCardImage(baseInput, fakeImageClient, {
        enableDynamicPlanner: true,
        plannerClient: mockPlannerClient,
      });

      expect(result.rawImageBuffer).toBeInstanceOf(Buffer);
      expect(mockPlannerGenerateContent).toHaveBeenCalledTimes(1);
      const plannerCallArgs = mockPlannerGenerateContent.mock.calls[0][0];
      expect(plannerCallArgs.model).toBe("gemini-3.8-flash");

      expect(fakeImageClient.generateContentSpy).toHaveBeenCalledTimes(1);
      const imageCallArgs = fakeImageClient.generateContentSpy.mock.calls[0][0];
      expect(imageCallArgs.model).toBe(serverEnv.GEMINI_IMAGE_MODEL);

      const promptText = imageCallArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "Fotografia publicitária comercial em proporção 4:5 apresentando burger monumental.",
      );
      expect(promptText).not.toContain("ZERO OCLUSÃO TIPOGRÁFICA");
    });

    it("deve realizar fallback gracioso quando o planner falhar na Etapa 1 sem abortar a geração de imagem", async () => {
      const fakeImageClient = createFakeGeminiClient();
      const failingPlannerClient: PromptPlannerClient = {
        models: {
          generateContent: vi
            .fn()
            .mockRejectedValue(
              new Error("Timeout de comunicação com gemini-3.8-flash"),
            ),
        },
      };

      const result = await generateAdCardImage(baseInput, fakeImageClient, {
        enableDynamicPlanner: true,
        plannerClient: failingPlannerClient,
      });

      expect(result.rawImageBuffer).toBeInstanceOf(Buffer);
      expect(fakeImageClient.generateContentSpy).toHaveBeenCalledTimes(1);

      const imageCallArgs = fakeImageClient.generateContentSpy.mock.calls[0][0];
      const promptText = imageCallArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain("Fotografia publicitária comercial");
      expect(promptText).toContain("Supermercado Compre Bem");
    });

    it("deve desbloquear pixels em RECOMPOSE_LAYOUT omitindo [IMAGEM BASE DO CARD]", async () => {
      const fakeImageClient = createFakeGeminiClient();
      const mockPlannerClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              editStrategy: "RECOMPOSE_LAYOUT",
              masterPrompt:
                "Fotografia comercial com novo arranjo.\n\nIluminação lateral.\n\nTítulo no topo.\n\nSelo de preço.",
            }),
          }),
        },
      };

      const inputSpatialEdit: GenerateAdCardInput = {
        ...baseInput,
        baseCardImageDataUrl: `data:image/png;base64,${fakeBase64Png}`,
        customStyleInstructions:
          "quero dividir o layout na horizontal com o produto embaixo e o texto em cima",
      };

      await generateAdCardImage(inputSpatialEdit, fakeImageClient, {
        enableDynamicPlanner: true,
        plannerClient: mockPlannerClient,
      });

      const callArgs = fakeImageClient.generateContentSpy.mock.calls[0][0];
      const contents = callArgs.contents;

      // DESBLOQUEIO DE PIXELS:
      // A [IMAGEM BASE DO CARD] NÃO DEVE estar nas contents enviadas ao modelo de imagem
      expect(
        contents.some(
          (c: unknown) =>
            typeof c === "string" && c.includes("IMAGEM BASE DO CARD"),
        ),
      ).toBe(false);

      const promptText = contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;
      expect(promptText).toContain("Fotografia comercial com novo arranjo.");
    });
  });
});
