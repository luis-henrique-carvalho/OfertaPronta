import { describe, expect, it, vi } from "vitest";
import {
  generateAdCardImage,
  AdCardGenerationError,
  type GenerateAdCardInput,
  type GoogleGenAIClient,
} from "./ai-card-generator.service";
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

    expect(promptText).toContain(
      '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Feira & Hortifrúti Natural" ---',
    );
    expect(promptText).toContain("Verde esmeralda");
    expect(promptText).toContain("Luz natural difusa da manhã");
    expect(promptText).toContain("Usar iluminação solar suave de manhã cedo.");
  });

  it("deve injetar a seção estruturada de Direção de Arte de market-discount com amarelo e vermelho, selos de impacto e iluminação de varejo", async () => {
    const fakeClient = createFakeGeminiClient();
    const inputWithMarketDiscount: GenerateAdCardInput = {
      ...baseInput,
      businessSegment: "supermarket",
      stylePresetId: "market-discount",
    };

    await generateAdCardImage(inputWithMarketDiscount, fakeClient);

    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;

    expect(promptText).toContain(
      '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Super Encarte Amarelo & Vermelho" ---',
    );
    expect(promptText).toContain("Vermelho primário vibrante");
    expect(promptText).toContain("Amarelo ouro");
    expect(promptText).toContain("selos explosivos");
    expect(promptText).toContain("Iluminação de estúdio comercial");
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

    // Deve aplicar o fallback do primeiro preset de pizzaria: "Forno a Lenha Rústico"
    expect(promptText).toContain(
      '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Forno a Lenha Rústico" ---',
    );
    expect(promptText).toContain("Terracota queimado");
    expect(promptText).toContain(
      "Luz quente dourada emanando de forno a lenha",
    );
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

  it("deve incluir baseCardImageDataUrl e ativar modo de edição cirúrgica estrita quando imagem base for fornecida", async () => {
    const fakeClient = createFakeGeminiClient();
    const inputWithBaseCard: GenerateAdCardInput = {
      ...baseInput,
      baseCardImageDataUrl: `data:image/png;base64,${fakeBase64Png}`,
      customStyleInstructions: "Mudar a logo para verde",
    };

    await generateAdCardImage(inputWithBaseCard, fakeClient);

    const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];

    // Verifica se usou o modelo Nano Banana 2.1
    expect(callArgs.model).toBe("gemini-nano-banana-2.1");

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

    // Verifica diretrizes de preservação estrita no prompt
    const promptText = callArgs.contents.find(
      (c: unknown) => typeof c === "string",
    ) as string;

    expect(promptText).toContain("EDIÇÃO CIRÚRGICA DE IMAGEM EXISTENTE");
    expect(promptText).toContain("PRESERVAÇÃO ESTRITA");
    expect(promptText).toContain("Mudar a logo para verde");
    expect(promptText).toContain("PROIBIDO REINVENTAR");
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

      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;
      expect(promptText).toContain("LOGOTIPO DA LOJA FORNECIDO");
      expect(promptText).toMatch(/topo|canto superior|rodapé/i);
      expect(promptText).toMatch(/fidelidade|legibilidade/i);
      expect(promptText).toMatch(/distorç/i);
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

      expect(promptText).toContain(
        "ESTE É UM CARD INSTITUCIONAL / INFORMATIVO: Não exiba nenhum preço ou valor monetário na arte gráfica. É expressamente proibido inserir 'R$ 0,00' ou valores inventados.",
      );
      expect(promptText).not.toContain("PREÇO PROMOCIONAL (");
      expect(promptText).not.toContain('Exibir ""');
      expect(promptText).not.toContain('Exibir "null"');
      expect(promptText).not.toContain('Exibir "undefined"');
      expect(promptText).not.toContain('Exibir "R$ 0,00"');
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

      expect(promptText).toContain(
        "ESTE É UM CARD INSTITUCIONAL / INFORMATIVO: Não exiba nenhum preço ou valor monetário na arte gráfica. É expressamente proibido inserir 'R$ 0,00' ou valores inventados.",
      );
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

      expect(promptText).toContain("Moda & Roupas");
      expect(promptText).toContain("vitrine de boutique ou lookbook de moda");
      expect(promptText).toContain("Iluminação suave de estúdio fotográfico");
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
});
