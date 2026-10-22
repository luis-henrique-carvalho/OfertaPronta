import { describe, expect, it, vi } from "vitest";
import {
  compileAdCardPrompt,
  buildMultimodalPromptPartsAsync,
  buildMultimodalPromptParts,
  buildFallbackMasterPrompt,
  buildPromptText,
  resolveRegenerationStyleInstructions,
  isReferenceDrivenMode,
  parseDataUrl,
  GOLDEN_FEW_SHOT_MASTER_PROMPT,
  UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION,
  CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION,
  DEFAULT_GEMINI_PROMPT_MODEL,
  DEFAULT_GEMINI_IMAGE_MODEL,
  DEFAULT_PROMPT_ENGINE_TIMEOUT_MS,
  REFERENCE_STYLE_PRESET_ID,
  editPlanSchema,
  editStrategySchema,
  type PromptEngineInput,
  type PromptPlannerClient,
} from "./index";

const SAMPLE_BASE64_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const SAMPLE_LOGO_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function createSampleInput(
  overrides?: Partial<PromptEngineInput>,
): PromptEngineInput {
  return {
    businessSegment: "burger-shop",
    targetAspectRatio: "feed",
    businessName: "Monster Smash Burger",
    offerTitle: "Duplo Cheddar Bacon + Batata Frita",
    promoPrice: "R$ 34,90",
    originalPrice: "R$ 42,90",
    callToAction: "Peça antes que acabe!",
    whatsapp: "(11) 98765-4321",
    ...overrides,
  };
}

describe("PromptEngine v2 Deep Module", () => {
  describe("Constantes, Schemas e System Instructions", () => {
    it("deve exportar as constantes de modelo padrão e timeout", () => {
      expect(DEFAULT_GEMINI_PROMPT_MODEL).toBe("gemini-3.8-flash");
      expect(DEFAULT_GEMINI_IMAGE_MODEL).toBe("gemini-nano-banana-2.1");
      expect(DEFAULT_PROMPT_ENGINE_TIMEOUT_MS).toBe(25000);
      expect(REFERENCE_STYLE_PRESET_ID).toBe("reference-image");
    });

    it("deve validar o schema de estratégia de edição Zod", () => {
      expect(editStrategySchema.safeParse("IN_PLACE_EDIT").success).toBe(true);
      expect(editStrategySchema.safeParse("RECOMPOSE_LAYOUT").success).toBe(
        true,
      );
      expect(editStrategySchema.safeParse("SURGICAL").success).toBe(false);

      expect(
        editPlanSchema.safeParse({
          editStrategy: "IN_PLACE_EDIT",
          masterPrompt: "Um prompt longo de estúdio com mais de 20 caracteres",
        }).success,
      ).toBe(true);

      expect(
        editPlanSchema.safeParse({
          editStrategy: "INVALID_STRATEGY",
          masterPrompt: "curto",
        }).success,
      ).toBe(false);
    });

    it("deve conter os 4 parágrafos exatos no GOLDEN_FEW_SHOT_MASTER_PROMPT", () => {
      expect(GOLDEN_FEW_SHOT_MASTER_PROMPT).toContain(
        "Fotografia publicitária gastronômica comercial para social media em proporção vertical 4:5",
      );
      expect(GOLDEN_FEW_SHOT_MASTER_PROMPT).toContain(
        "No primeiro plano à esquerda, repousa uma porção transbordante de batatas rústicas douradas cortadas à mão",
      );
      expect(GOLDEN_FEW_SHOT_MASTER_PROMPT).toContain(
        'Integrado ao quadrante superior esquerdo, sobre a área escura sem interferir no produto, posiciona-se o conjunto gráfico e tipográfico publicitário artesanal e refinado. No topo, a assinatura da marca "Monster Smash Burger"',
      );
      expect(GOLDEN_FEW_SHOT_MASTER_PROMPT).toContain(
        'Abaixo do título da oferta, alinha-se uma linha elegante de micro-copy com os atributos sensoriais em caixa alta e espaçamento arejado: "ARTESANAL • SUCULENTO • CROCANTE"',
      );
    });

    it("UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION deve ensinar os 4 Pilares Universais e incluir o Golden Few-Shot", () => {
      expect(UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION).toContain(
        "1. ZONEAMENTO ESPACIAL ASSIMÉTRICO (Split Composition & Zero Colisão)",
      );
      expect(UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION).toContain(
        "2. DENSIDADE SENSORIAL, MATERIAIS FÍSICOS E ÓPTICA DE ESTÚDIO",
      );
      expect(UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION).toContain(
        "3. HIERARQUIA TIPOGRÁFICA MULTI-NÍVEL & COPYWRITING AUTÊNTICO (100% Verbatim em Português)",
      );
      expect(UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION).toContain(
        "ALINHAMENTO AO PROPÓSITO E STORYTELLING DE COPY",
      );
      expect(UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION).toContain(
        "4. SAÍDA VISUAL PURA (Zero Diluição de Prompt)",
      );
      expect(UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION).toContain(
        GOLDEN_FEW_SHOT_MASTER_PROMPT,
      );
      expect(UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION).toContain(
        "preservando 15% no topo e 15% na base totalmente livres de textos",
      );
    });

    it("CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION deve conter a Regra Inegociável Canvas vs. Layout Interno", () => {
      expect(CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION).toContain(
        "REGRA INEGOCIÁVEL: CANVAS VS. LAYOUT INTERNO",
      );
      expect(CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION).toContain(
        "O formato do canvas é fixo e vertical (4:5 para Feed ou 9:16 para Story)",
      );
      expect(CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION).toContain(
        "É TERMINANTEMENTE PROIBIDO alterar a proporção externa do card para widescreen 16:9",
      );
      expect(CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION).toContain("IN_PLACE_EDIT");
      expect(CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION).toContain(
        "RECOMPOSE_LAYOUT",
      );
    });
  });

  describe("Cenário 1: Geração de Prompt no Estágio 1 com os 4 Pilares Universais + Golden Few-Shot", () => {
    it("deve chamar o Estágio 1 com UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION e retornar parts[0] puramente visual", async () => {
      const input = createSampleInput({
        productImageDataUrl: SAMPLE_BASE64_PNG,
        logoImageDataUrl: SAMPLE_LOGO_PNG,
      });

      let capturedModel = "";
      let capturedSystemInstruction = "";
      let capturedContents: unknown[] = [];

      const mockClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockImplementation(async (params) => {
            capturedModel = params.model;
            capturedSystemInstruction =
              (params.config?.systemInstruction as string) || "";
            capturedContents = params.contents;

            return {
              text: GOLDEN_FEW_SHOT_MASTER_PROMPT,
            };
          }),
        },
      };

      const result = await compileAdCardPrompt(input, { client: mockClient });

      expect(result.source).toBe("ai-art-director");
      expect(capturedModel).toBe("gemini-3.8-flash");
      expect(capturedSystemInstruction).toBe(
        UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION,
      );
      expect(capturedContents.length).toBeGreaterThanOrEqual(3);

      // parts[0] deve ser estritamente o masterPrompt visual puro
      expect(result.parts[0]).toBe(GOLDEN_FEW_SHOT_MASTER_PROMPT);
      expect(result.parts[0]).not.toContain("--- REGRA INEGOCIÁVEL");
      expect(result.parts[0]).not.toContain("ZERO_TEXT_OCCLUSION");

      // Deve incluir partes multimodais de logo e produto
      expect(result.parts).toContainEqual({
        inlineData: {
          mimeType: "image/png",
          data: expect.any(String),
        },
      });
      expect(result.parts).toContain(
        "[LOGOTIPO OFICIAL: Aplicar em destaque no topo da arte]",
      );
      expect(result.parts).toContain(
        "[FOTO DO PRODUTO REAL: Manter fidelidade visual e integrar harmonicamente à cena]",
      );
    });

    it("deve repassar cardIntent e customIntentText de forma desacoplada no briefing do Estágio 1", async () => {
      const input = createSampleInput({
        cardIntent: "special-date",
        customIntentText: "Comemoração especial do Dia do Cliente",
      });

      let capturedBriefing = "";

      const mockClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockImplementation(async (params) => {
            capturedBriefing = params.contents[0] as string;
            return {
              text: GOLDEN_FEW_SHOT_MASTER_PROMPT,
            };
          }),
        },
      };

      await compileAdCardPrompt(input, { client: mockClient });

      expect(capturedBriefing).toContain(
        '- Propósito Comercial / Intenção do Card: "special-date" (Comemoração especial do Dia do Cliente)',
      );
    });
  });

  describe("Cenário 2: Edição Conversacional IN_PLACE_EDIT preserva [IMAGEM BASE DO CARD]", () => {
    it("deve manter [IMAGEM BASE DO CARD] em parts quando a estratégia for IN_PLACE_EDIT", async () => {
      const input = createSampleInput({
        baseCardImageDataUrl: SAMPLE_BASE64_PNG,
        productImageDataUrl: SAMPLE_BASE64_PNG,
        regenerationPrompt: "Mude a cor do texto principal para amarelo ouro",
      });

      const mockClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              editStrategy: "IN_PLACE_EDIT",
              masterPrompt: GOLDEN_FEW_SHOT_MASTER_PROMPT,
            }),
          }),
        },
      };

      const result = await compileAdCardPrompt(input, { client: mockClient });

      expect(result.editStrategy).toBe("IN_PLACE_EDIT");
      expect(result.source).toBe("ai-art-director");

      // Deve conter a imagem base nas parts para o Estágio 2
      expect(result.parts).toContain(
        "[IMAGEM BASE DO CARD: Preservar estrutura e aplicar os ajustes solicitados]",
      );
      expect(result.parts).toContain(
        "[FOTO DO PRODUTO REAL: Manter fidelidade visual e integrar harmonicamente à cena]",
      );
    });
  });

  describe("Cenário 3: Edição Conversacional RECOMPOSE_LAYOUT desbloqueia pixels omitindo [IMAGEM BASE DO CARD]", () => {
    it("deve OMITIR [IMAGEM BASE DO CARD] de parts quando a estratégia for RECOMPOSE_LAYOUT", async () => {
      const input = createSampleInput({
        baseCardImageDataUrl: SAMPLE_BASE64_PNG,
        productImageDataUrl: SAMPLE_BASE64_PNG,
        logoImageDataUrl: SAMPLE_LOGO_PNG,
        regenerationPrompt:
          "Quero dividir o layout na horizontal com o produto embaixo e o texto em cima",
      });

      let capturedSystemInstruction = "";
      const mockClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockImplementation(async (params) => {
            capturedSystemInstruction =
              (params.config?.systemInstruction as string) || "";
            return {
              text: `\`\`\`json
{
  "editStrategy": "RECOMPOSE_LAYOUT",
  "masterPrompt": "${GOLDEN_FEW_SHOT_MASTER_PROMPT.replace(/\n/g, "\\n").replace(/"/g, '\\"')}"
}
\`\`\``,
            };
          }),
        },
      };

      const result = await compileAdCardPrompt(input, { client: mockClient });

      expect(capturedSystemInstruction).toBe(
        CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION,
      );
      expect(result.editStrategy).toBe("RECOMPOSE_LAYOUT");
      expect(result.source).toBe("ai-art-director");

      // DESBLOQUEIO DE PIXELS:
      // A baseCardImageDataUrl e a tag [IMAGEM BASE DO CARD] NÃO DEVEM estar nas parts
      const partsAsStrings = result.parts.filter(
        (p): p is string => typeof p === "string",
      );
      expect(
        partsAsStrings.some((s) => s.includes("IMAGEM BASE DO CARD")),
      ).toBe(false);

      // Deve manter o logo e o produto real
      expect(partsAsStrings.some((s) => s.includes("LOGOTIPO OFICIAL"))).toBe(
        true,
      );
      expect(
        partsAsStrings.some((s) => s.includes("FOTO DO PRODUTO REAL")),
      ).toBe(true);
    });
  });

  describe("Cenário 4: Fallback Determinístico de 4 Parágrafos e Resiliência", () => {
    it("deve gerar 4 parágrafos densos sem meta-regras no fallback determinístico", () => {
      const input = createSampleInput({ targetAspectRatio: "feed" });
      const fallback = buildFallbackMasterPrompt(input);

      const paragraphs = fallback.split("\n\n");
      expect(paragraphs.length).toBe(4);
      expect(fallback).toContain("Fotografia publicitária comercial");
      expect(fallback).toContain("Monster Smash Burger");
      expect(fallback).toContain("Duplo Cheddar Bacon + Batata Frita");
      expect(fallback).toContain("R$ 34,90");
      expect(fallback).not.toContain("--- REGRA");
      expect(fallback).not.toContain("ZERO_TEXT_OCCLUSION");
    });

    it("alias buildPromptText deve ser idêntico a buildFallbackMasterPrompt", () => {
      const input = createSampleInput();
      expect(buildPromptText(input)).toBe(buildFallbackMasterPrompt(input));
    });

    it("deve aplicar margem de 15% no topo e base em Story 9:16", () => {
      const input = createSampleInput({ targetAspectRatio: "story" });
      const prompt = buildFallbackMasterPrompt(input);

      expect(prompt).toContain("9:16");
      expect(prompt).toContain(
        "preserva rigorosamente 15% no topo e 15% na base totalmente livres de textos",
      );
    });

    it("deve omitir valores monetários e nunca exibir 'R$ 0,00' quando promoPrice não for informado", () => {
      const input = createSampleInput({
        promoPrice: null,
        originalPrice: null,
      });

      const prompt = buildFallbackMasterPrompt(input);
      expect(prompt).toContain("peça institucional");
      expect(prompt).not.toContain("R$ 0,00");
      expect(prompt).not.toContain("R$ 0.00");
      expect(prompt).not.toContain("preço promocional");
    });

    it("deve acionar fallback determinístico caso o Estágio 1 sofra timeout ou retorne erro", async () => {
      const input = createSampleInput();
      const mockClient: PromptPlannerClient = {
        models: {
          generateContent: vi
            .fn()
            .mockRejectedValue(new Error("Network timeout")),
        },
      };

      const result = await compileAdCardPrompt(input, {
        client: mockClient,
        timeoutMs: 50,
      });

      expect(result.source).toBe("deterministic-fallback");
      expect(result.masterPrompt).toContain(
        "Fotografia publicitária comercial",
      );
      expect(result.parts[0]).toBe(result.masterPrompt);
    });

    it("deve acionar fallback determinístico caso o JSON de edição seja inválido", async () => {
      const input = createSampleInput({
        baseCardImageDataUrl: SAMPLE_BASE64_PNG,
      });
      const mockClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: "Não sou um JSON válido",
          }),
        },
      };

      const result = await compileAdCardPrompt(input, { client: mockClient });

      expect(result.source).toBe("deterministic-fallback");
      expect(result.editStrategy).toBe("IN_PLACE_EDIT");
      expect(result.parts).toContain(
        "[IMAGEM BASE DO CARD: Preservar estrutura e aplicar os ajustes solicitados]",
      );
    });
  });

  describe("Utilitários do Deep Module", () => {
    it("isReferenceDrivenMode deve ser true somente quando há referência estética e não há foto do produto", () => {
      expect(
        isReferenceDrivenMode(
          createSampleInput({
            referenceImageDataUrl: SAMPLE_BASE64_PNG,
            productImageDataUrl: null,
          }),
        ),
      ).toBe(true);

      expect(
        isReferenceDrivenMode(
          createSampleInput({
            referenceImageDataUrl: SAMPLE_BASE64_PNG,
            productImageDataUrl: SAMPLE_BASE64_PNG,
          }),
        ),
      ).toBe(false);

      expect(
        isReferenceDrivenMode(
          createSampleInput({
            referenceImageDataUrl: null,
            productImageDataUrl: SAMPLE_BASE64_PNG,
          }),
        ),
      ).toBe(false);
    });

    it("parseDataUrl deve extrair mimeType e base64 corretamente", () => {
      const parsed = parseDataUrl(SAMPLE_BASE64_PNG);
      expect(parsed).not.toBeNull();
      expect(parsed?.inlineData.mimeType).toBe("image/png");
      expect(parsed?.inlineData.data).toContain("iVBORw0KGgo");

      expect(parseDataUrl("not-a-data-url")).toBeNull();
      expect(parseDataUrl(null)).toBeNull();
      expect(parseDataUrl(undefined)).toBeNull();
    });

    it("resolveRegenerationStyleInstructions deve lidar com preset alterado e novos ajustes", () => {
      const resolved = resolveRegenerationStyleInstructions(
        "Instrução antiga",
        "Mudar para iluminação neon",
        {
          presetChanged: true,
          newStylePresetId: "cyberpunk",
          colorPalette: "Azul e Rosa",
        },
      );

      expect(resolved).toContain(
        "Reestruturar layout e estilo visual aplicando integralmente o novo preset selecionado",
      );
      expect(resolved).toContain("Paleta de cores: Azul e Rosa");
      expect(resolved).toContain("Mudar para iluminação neon");
    });

    it("buildMultimodalPromptPartsAsync deve retornar as partes montadas", async () => {
      const input = createSampleInput({
        productImageDataUrl: SAMPLE_BASE64_PNG,
      });

      const parts = await buildMultimodalPromptPartsAsync(input);
      expect(parts.length).toBeGreaterThan(1);
      expect(typeof parts[0]).toBe("string");
    });

    it("buildMultimodalPromptParts síncrono deve retornar partes válidas", () => {
      const input = createSampleInput({
        logoImageDataUrl: SAMPLE_LOGO_PNG,
        productImageDataUrl: SAMPLE_BASE64_PNG,
      });

      const parts = buildMultimodalPromptParts(input);
      expect(parts.length).toBeGreaterThanOrEqual(4);
      expect(parts).toContain(
        "[LOGOTIPO OFICIAL: Aplicar em destaque no topo da arte]",
      );
      expect(parts).toContain(
        "[FOTO DO PRODUTO REAL: Manter fidelidade visual e integrar harmonicamente à cena]",
      );
    });
  });
});
