import { describe, expect, it, vi } from "vitest";
import {
  generateAdCardImage,
  AdCardGenerationError,
  isReferenceDrivenMode,
  buildPromptText,
  REFERENCE_STYLE_PRESET_ID,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
  type GenerateAdCardInput,
  type GoogleGenAIClient,
  type PromptPlannerClient,
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
    expect(promptText).toContain("Luz natural difusa matinal suave");
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
    expect(promptText).toContain("Madeira escura queimada");
    expect(promptText).toContain(
      "Luz lateral dourada e quente proveniente do fogo do forno",
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
        previewAssetKey: null,
        cleanMasterAssetKey: null,
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

  describe("Compilador Narrativo de 4 Camadas e Blueprints Fotográficos (Ticket 02)", () => {
    it("deve compilar as 4 camadas narrativas estruturadas no prompt com enquadramento full-bleed e setup óptico", async () => {
      const fakeClient = createFakeGeminiClient();
      const input: GenerateAdCardInput = {
        ...baseInput,
        businessSegment: "supermarket",
        stylePresetId: "market-discount",
      };

      await generateAdCardImage(input, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      expect(callArgs.config?.imageConfig).toEqual({
        aspectRatio: "4:5",
        imageSize: "1K",
      });

      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "--- ARQUITETURA DE COMPOSIÇÃO EM 4 CAMADAS (STEP-BY-STEP) ---",
      );

      // Camada 1: Full-bleed e paleta HEX
      expect(promptText).toContain("CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA:");
      expect(promptText).toContain(
        "full-bleed edge-to-edge preenchendo 100% do canvas até as 4 extremidades sem bordas ou margens externas vazias",
      );
      expect(promptText).toContain("Paleta cromática do preset (HEX):");
      expect(promptText).toContain("#EF4444");
      expect(promptText).toContain("#FBBF24");

      // Camada 2: Óptica fotográfica e iluminação
      expect(promptText).toContain(
        "CAMADA 2 — SUJEITO HERO & ÓPTICA FOTOGRÁFICA COMERCIAL:",
      );
      expect(promptText).toContain("50mm f/4");
      expect(promptText).toContain("Iluminação de estúdio 3 pontos");
      expect(promptText).toContain("sombras de contato realistas");
      expect(promptText).toContain("Picanha Bovina Fatiada 1kg");

      // Camada 3: Geometria de grid e tipografia descritiva
      expect(promptText).toContain(
        "CAMADA 3 — GEOMETRIA DE GRID, SAFE ZONE & TIPOGRAFIA DESCRITIVA:",
      );
      expect(promptText).toContain("Cabeçalho vibrante em faixa superior");
      expect(promptText).toContain(
        "Sans-serif geométrica condensada ultra-bold",
      );
      expect(promptText).toContain("Supermercado Compre Bem");

      // Camada 4: Ancoragem de preço e rodapé
      expect(promptText).toContain(
        "CAMADA 4 — ANCORAGEM DE PREÇO & RODAPÉ COMERCIAL:",
      );
      expect(promptText).toContain(
        "Container de preço promocional em destaque",
      );
      expect(promptText).toContain(
        "Selo estrelado ou circular de alto impacto",
      );
      expect(promptText).toContain("R$ 49,90");
      expect(promptText).toContain("De R$ 69,90");
      expect(promptText).toContain("Aproveite hoje mesmo!");
      expect(promptText).toContain("(11) 98888-7777");
    });

    it("deve aplicar safe zone de 15% na Camada 3 e aspect ratio 9:16 quando targetAspectRatio for story", async () => {
      const fakeClient = createFakeGeminiClient();
      const input: GenerateAdCardInput = {
        ...baseInput,
        targetAspectRatio: "story",
        stylePresetId: "market-discount",
      };

      await generateAdCardImage(input, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      expect(callArgs.config?.imageConfig).toEqual({
        aspectRatio: "9:16",
        imageSize: "1K",
      });

      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "CAMADA 3 — GEOMETRIA DE GRID, SAFE ZONE & TIPOGRAFIA DESCRITIVA:",
      );
      expect(promptText).toContain("SAFE ZONE OBRIGATÓRIA");
      expect(promptText).toContain("15% da altura no topo e 15% na base");
    });

    it("deve aplicar prioridade cromática na Camada 1 quando referenceImageDataUrl estiver presente", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputWithRef: GenerateAdCardInput = {
        ...baseInput,
        referenceImageDataUrl: `data:image/jpeg;base64,${fakeBase64Png}`,
        stylePresetId: "market-discount",
      };

      await generateAdCardImage(inputWithRef, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain("CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA:");
      expect(promptText).toContain(
        "Prioridade cromática: adaptar e priorizar a paleta de cores da Imagem de Referência ou Paleta Personalizada indicada pelo cliente",
      );
      expect(promptText).not.toContain("Paleta cromática do preset (HEX):");
    });

    it("deve aplicar prioridade cromática na Camada 1 quando customStyleInstructions estiver presente", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputWithCustomInstructions: GenerateAdCardInput = {
        ...baseInput,
        customStyleInstructions: "Tons de verde oliva e dourado metálico",
        stylePresetId: "market-discount",
      };

      await generateAdCardImage(inputWithCustomInstructions, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain("CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA:");
      expect(promptText).toContain(
        "Prioridade cromática: adaptar e priorizar a paleta de cores da Imagem de Referência ou Paleta Personalizada indicada pelo cliente",
      );
    });

    it("deve incluir fidelidade visual da foto do produto na Camada 2 quando productImageDataUrl for fornecida", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputWithProduct: GenerateAdCardInput = {
        ...baseInput,
        productImageDataUrl: `data:image/png;base64,${fakeBase64Png}`,
      };

      await generateAdCardImage(inputWithProduct, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "CAMADA 2 — SUJEITO HERO & ÓPTICA FOTOGRÁFICA COMERCIAL:",
      );
      expect(promptText).toContain(
        "Preservar e destacar com máxima fidelidade visual a FOTO DO PRODUTO FORNECIDA",
      );
    });

    it("deve aplicar diretriz estrita de card institucional sem container de preço na Camada 4 quando promoPrice for vazio", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputInstitutional: GenerateAdCardInput = {
        ...baseInput,
        promoPrice: "",
        originalPrice: null,
      };

      await generateAdCardImage(inputInstitutional, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "CAMADA 4 — ANCORAGEM DE PREÇO & RODAPÉ COMERCIAL:",
      );
      expect(promptText).toContain(
        'Diretriz de card institucional sem nenhum container de preço e proibindo expressamente "R$ 0,00" ou valores monetários.',
      );
      expect(promptText).not.toContain(
        "Container de preço promocional em destaque",
      );
    });

    it("deve incluir setup fotográfico gastronômico (macro 85mm f/2.8) e tipografia slab-serif para o preset rustic-wood da pizzaria", async () => {
      const fakeClient = createFakeGeminiClient();
      const inputPizza: GenerateAdCardInput = {
        ...baseInput,
        businessSegment: "pizzeria",
        stylePresetId: "pizza-rustic-wood",
        offerTitle: "Pizza Margherita Especial",
      };

      await generateAdCardImage(inputPizza, fakeClient);

      const callArgs = fakeClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "CAMADA 2 — SUJEITO HERO & ÓPTICA FOTOGRÁFICA COMERCIAL:",
      );
      expect(promptText).toContain(
        "Lente macro gastronômica 85mm f/2.8 em ângulo elevado de 45°",
      );

      expect(promptText).toContain(
        "CAMADA 3 — GEOMETRIA DE GRID, SAFE ZONE & TIPOGRAFIA DESCRITIVA:",
      );
      expect(promptText).toContain(
        "Slab-serif robusta de inspiração artesanal",
      );

      expect(promptText).toContain(
        "CAMADA 4 — ANCORAGEM DE PREÇO & RODAPÉ COMERCIAL:",
      );
      expect(promptText).toContain(
        "Selo circular tipo carimbo artesanal ou etiqueta rústica preenchida na cor de acento com alto contraste.",
      );
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

      it("deve injetar a diretriz autoritativa de replicação estética da imagem de referência", () => {
        const promptText = buildPromptText(referenceDrivenInput);

        expect(promptText).toContain(
          "--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---",
        );
        expect(promptText).toContain(
          "Papel do Modelo: Atue como diretor de arte e designer gráfico sênior encarregado de reproduzir com maestria a identidade visual do print de referência anexo.",
        );
        expect(promptText).toContain(
          "Estilo, Composição e Grid: Analise detalhadamente a IMAGEM DE REFERÊNCIA anexa e reproduza sua distribuição espacial, enquadramento, proporções relativas, alinhamentos, formas geométricas e padrão de respiro/bordas.",
        );
        expect(promptText).toContain(
          "Paleta Cromática Dominante: Extraia com fidelidade as cores de fundo, contrastes, gradientes e tons de acento presentes na IMAGEM DE REFERÊNCIA, aplicando-os à composição do anúncio sem recorrer a paletas externas genéricas.",
        );
        expect(promptText).toContain(
          "Tipografia e Hierarquia: Emule o estilo visual, peso das fontes (bold, condensed, elegante, etc.) e disposição de títulos e chamadas observados na IMAGEM DE REFERÊNCIA.",
        );
        expect(promptText).toContain(
          "Iluminação e Atmosfera: Replique o clima luminoso (luz suave, iluminação comercial, contraste dramático, estética clean ou vibrante) e as texturas da IMAGEM DE REFERÊNCIA.",
        );
        expect(promptText).toContain(
          "Adaptação ao Conteúdo: Combine toda essa estética do print com os dados da oferta comercial anunciada",
        );
      });

      it("deve estruturar as 4 camadas narrativas derivadas 100% da imagem de referência anexa", () => {
        const promptText = buildPromptText(referenceDrivenInput);

        expect(promptText).toContain(
          "CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA: Enquadramento positivo full-bleed edge-to-edge preenchendo 100% do canvas até as 4 extremidades sem bordas ou margens externas vazias. Paleta cromática dominante, texturas de fundo, gradientes e atmosfera visual extraídos 100% com fidelidade da IMAGEM DE REFERÊNCIA anexa sem recorrer a paletas ou cores de presets externos.",
        );
        expect(promptText).toContain(
          'CAMADA 2 — SUJEITO HERO & ÓPTICA FOTOGRÁFICA COMERCIAL: Tratamento óptico, ângulo de câmera e iluminação inspirados diretamente no acabamento estético da IMAGEM DE REFERÊNCIA anexa, com iluminação de estúdio comercial e sombras de contato naturais. Destaque central para "Smash Burger Duplo com Fritas". Renderizar "Smash Burger Duplo com Fritas" com iluminação comercial atraente e acabamento realista impecável inspirado no tratamento visual da IMAGEM DE REFERÊNCIA anexa.',
        );
        expect(promptText).toContain(
          'CAMADA 3 — GEOMETRIA DE GRID, SAFE ZONE & TIPOGRAFIA DESCRITIVA: Distribuição espacial, grid de diagramação e proporções espelhando a composição da IMAGEM DE REFERÊNCIA anexa. Família tipográfica e hierarquia de títulos emulando o peso visual e estilo observados na referência. Renderização de título legível para "Smash Burger Duplo com Fritas" e estabelecimento "Burger Artesanal da Vila".',
        );
        expect(promptText).toContain(
          'CAMADA 4 — ANCORAGEM DE PREÇO & RODAPÉ COMERCIAL: Container e destaque de preço promocional harmonizados com a linguagem visual e selos da IMAGEM DE REFERÊNCIA anexa, com originalPrice tachado ("De R$ 42,90") e valor promocional "R$ 32,90" em destaque.',
        );
      });

      it("deve eliminar estritamente o attention bleeding: ZERO nomes de presets, ZERO códigos HEX e ZERO blueprints de catálogo", () => {
        const promptText = buildPromptText(referenceDrivenInput);

        // 1. Zero nomes de presets de catálogo de qualquer segmento
        expect(promptText).not.toContain("Dark Burger & Fumaça");
        expect(promptText).not.toContain("Smash Burger Fire & Cheddar");
        expect(promptText).not.toContain("Classic Diner & Neon Americano");
        expect(promptText).not.toContain("Artesanal Madeira & Tabua Rústica");
        expect(promptText).not.toContain("Boutique Minimalista");
        expect(promptText).not.toContain("Super Encarte Amarelo & Vermelho");
        expect(promptText).not.toContain("Forno a Lenha Rústico");
        expect(promptText).not.toContain(
          "DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL:",
        );

        // 2. Zero códigos HEX (#111111, #DC2626, #E11D48, etc.)
        expect(promptText).not.toMatch(/#[0-9A-Fa-f]{3,6}\b/);
        expect(promptText).not.toContain("#111111");
        expect(promptText).not.toContain("#DC2626");
        expect(promptText).not.toContain("#E11D48");
        expect(promptText).not.toContain("#000000");

        // 3. Zero blueprints ou LayoutVariants concorrentes
        expect(promptText).not.toContain("retail-burst");
        expect(promptText).not.toContain("dark-luxury");
        expect(promptText).not.toContain("50mm f/4");
        expect(promptText).not.toContain("Macro gastronômica");
        expect(promptText).not.toContain("Sans-serif geométrica condensada");
        expect(promptText).not.toContain("Didone editorial clássica");
        expect(promptText).not.toContain(
          "Selo estrelado ou circular de alto impacto",
        );
      });

      it("deve operar em modo REFERENCE_DRIVEN também quando stylePresetId for undefined ou null com referenceImageDataUrl", () => {
        const inputUndefined: GenerateAdCardInput = {
          ...referenceDrivenInput,
          stylePresetId: undefined,
        };
        const promptText = buildPromptText(inputUndefined);

        expect(promptText).toContain(
          "--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---",
        );
        expect(promptText).not.toContain("Dark Burger & Fumaça");
        expect(promptText).not.toMatch(/#[0-9A-Fa-f]{3,6}\b/);
      });

      it("deve aplicar safe zone de 15% na Camada 3 no modo REFERENCE_DRIVEN quando targetAspectRatio for story", () => {
        const inputStory: GenerateAdCardInput = {
          ...referenceDrivenInput,
          targetAspectRatio: "story",
        };
        const promptText = buildPromptText(inputStory);

        expect(promptText).toContain("SAFE ZONE OBRIGATÓRIA");
        expect(promptText).toContain("15% da altura no topo e 15% na base");
      });

      it("deve gerar card com sucesso via generateAdCardImage no modo REFERENCE_DRIVEN", async () => {
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

        expect(promptText).toContain(
          "--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---",
        );
        expect(promptText).not.toContain("Dark Burger & Fumaça");
        expect(promptText).not.toMatch(/#[0-9A-Fa-f]{3,6}\b/);
      });
    });

    describe("Modo Híbrido: Referência + Preset de Catálogo Explícito", () => {
      it("deve adotar estratégia híbrida quando o usuário escolher conscientemente um preset de catálogo tendo uma referência", () => {
        const hybridInput: GenerateAdCardInput = {
          businessSegment: "burger-shop",
          businessName: "Burger Artesanal da Vila",
          offerTitle: "Smash Burger Duplo",
          promoPrice: "R$ 32,90",
          referenceImageDataUrl: fakeDataUrl,
          stylePresetId: "burger-dark-bold",
        };

        expect(isReferenceDrivenMode(hybridInput)).toBe(false);

        const promptText = buildPromptText(hybridInput);

        // Contém a diretriz de direção de arte do preset selecionado
        expect(promptText).toContain(
          '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Dark Burger & Fumaça" ---',
        );
        // Contém adaptação cromática priorizando a referência
        expect(promptText).toContain(
          "Prioridade cromática: adaptar e priorizar a paleta de cores da Imagem de Referência",
        );
        // Não contém a diretriz de pura replicação estética de referência
        expect(promptText).not.toContain(
          "--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---",
        );
      });
    });

    describe("Modo Catálogo Padrão (Sem Referência)", () => {
      it("deve manter comportamento canônico 100% inalterado quando não houver referenceImageDataUrl", () => {
        const catalogInput: GenerateAdCardInput = {
          businessSegment: "burger-shop",
          businessName: "Burger Artesanal da Vila",
          offerTitle: "Smash Burger Duplo",
          promoPrice: "R$ 32,90",
          stylePresetId: "burger-dark-bold",
        };

        expect(isReferenceDrivenMode(catalogInput)).toBe(false);

        const promptText = buildPromptText(catalogInput);

        expect(promptText).toContain(
          '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Dark Burger & Fumaça" ---',
        );
        expect(promptText).toContain("Paleta cromática do preset (HEX):");
        expect(promptText).toContain("#111827");
        expect(promptText).toContain("#DC2626");
        expect(promptText).not.toContain(
          "--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---",
        );
      });
    });
  });

  describe("Ticket 02: Integração com PromptEngine, DynamicPlanner e Edição Adaptativa", () => {
    it("deve executar o pipeline híbrido em 2 etapas com sucesso quando enableDynamicPlanner for true", async () => {
      const fakeImageClient = createFakeGeminiClient();
      const mockPlannerGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          subjectAnatomy: "Pessoa e produto no centro",
          safeTypographyZone: "Zona superior limpa",
          antiOcclusionStrategy: "Texto em primeiro plano absoluto",
          layoutAdaptation: "Composição balanceada 4:5",
        }),
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
      expect(imageCallArgs.model).toBe("gemini-nano-banana-2.1");

      const promptText = imageCallArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "PLANEJAMENTO DE COMPOSIÇÃO DINÂMICA (ETAPA 1 - AI-DYNAMIC)",
      );
      expect(promptText).toContain("Pessoa e produto no centro");
      expect(promptText).toContain("Zona superior limpa");
      expect(promptText).toContain(ZERO_TEXT_OCCLUSION_DIRECTIVE);
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

      expect(promptText).toContain("DETERMINISTIC-FALLBACK");
      expect(promptText).toContain(ZERO_TEXT_OCCLUSION_DIRECTIVE);
    });

    it("deve sempre incluir ZERO_TEXT_OCCLUSION_DIRECTIVE nas diretrizes enviadas ao modelo de imagem", async () => {
      const fakeImageClient = createFakeGeminiClient();
      await generateAdCardImage(baseInput, fakeImageClient);

      const callArgs = fakeImageClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
      );
      expect(promptText).toContain(
        "PROIBIÇÃO DE TEXTO ATRÁS DO PERSONAGEM OU PRODUTO (NO TEXT BEHIND SUBJECT)",
      );
    });

    it("deve ativar o modo RECOMPOSE na edição adaptativa quando customStyleInstructions contiver termos espaciais ou de personagem", async () => {
      const fakeImageClient = createFakeGeminiClient();
      const inputSpatialEdit: GenerateAdCardInput = {
        ...baseInput,
        baseCardImageDataUrl: `data:image/png;base64,${fakeBase64Png}`,
        customStyleInstructions:
          "não botar o texto atrás do personagem, mover o título para o topo",
      };

      await generateAdCardImage(inputSpatialEdit, fakeImageClient);

      const callArgs = fakeImageClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain(
        "RECOMPOSIÇÃO VISUAL E REESTRUTURAÇÃO DE LAYOUT DE CARD EXISTENTE (MODO RECOMPOSE)",
      );
      expect(promptText).toContain("DESTRAVAMENTO ESPACIAL E DE ESTILO");
      expect(promptText).toContain("não botar o texto atrás do personagem");
      expect(promptText).not.toContain("PRESERVAÇÃO ESTRITA");
      expect(promptText).not.toContain("PROIBIDO REINVENTAR");
      expect(promptText).toContain(ZERO_TEXT_OCCLUSION_DIRECTIVE);
    });

    it("deve manter o modo SURGICAL na edição adaptativa para ajustes pontuais de texto ou preço sem termos espaciais", async () => {
      const fakeImageClient = createFakeGeminiClient();
      const inputSurgicalEdit: GenerateAdCardInput = {
        ...baseInput,
        baseCardImageDataUrl: `data:image/png;base64,${fakeBase64Png}`,
        customStyleInstructions:
          "Atualizar preço promocional para R$ 39,90 e WhatsApp para (11) 91234-5678",
      };

      await generateAdCardImage(inputSurgicalEdit, fakeImageClient);

      const callArgs = fakeImageClient.generateContentSpy.mock.calls[0][0];
      const promptText = callArgs.contents.find(
        (c: unknown) => typeof c === "string",
      ) as string;

      expect(promptText).toContain("EDIÇÃO CIRÚRGICA DE IMAGEM EXISTENTE");
      expect(promptText).toContain("PRESERVAÇÃO ESTRITA");
      expect(promptText).toContain("PROIBIDO REINVENTAR");
      expect(promptText).toContain(
        "Atualizar preço promocional para R$ 39,90 e WhatsApp para (11) 91234-5678",
      );
      expect(promptText).toContain(ZERO_TEXT_OCCLUSION_DIRECTIVE);
    });
  });
});
