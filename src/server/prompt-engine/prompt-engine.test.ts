import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS,
  DEFAULT_MASTER_PROMPT_TIMEOUT_MS,
  DEFAULT_GEMINI_PROMPT_MODEL,
  buildAdaptiveEditPromptText,
  buildDeterministicCompositionBrief,
  buildMasterPromptAuthorContents,
  buildMasterEditPromptAuthorContents,
  buildMultimodalPromptParts,
  buildMultimodalPromptPartsAsync,
  buildPromptText,
  buildReferenceDrivenArtDirective,
  buildSurgicalEditPromptText,
  compileDeterministicCardPrompt,
  compileDynamicCardPrompt,
  detectEditIntentMode,
  isReferenceDrivenMode,
  planDynamicCompositionBrief,
  planDynamicEditIntent,
  resolveArtDirectionDirective,
  resolveRegenerationStyleInstructions,
  assembleAuthoredMasterPrompt,
  AUTHENTIC_PHOTOGRAPHY_DIRECTIVE,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
  type PromptEngineInput,
  type PromptPlannerClient,
} from "./index";

const SAMPLE_BASE64_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function createSampleInput(
  overrides?: Partial<PromptEngineInput>,
): PromptEngineInput {
  return {
    businessSegment: "supermarket",
    targetAspectRatio: "feed",
    businessName: "Supermercado Compre Bem",
    offerTitle: "Alface Americana Fresca",
    promoPrice: "R$ 3,99",
    originalPrice: "R$ 5,99",
    callToAction: "Aproveite hoje mesmo",
    whatsapp: "(11) 99999-8888",
    ...overrides,
  };
}

describe("PromptEngine Deep Module", () => {
  describe("Superfície Pública e Constantes", () => {
    it("deve exportar as constantes canônicas de modelo e timeout", () => {
      expect(DEFAULT_GEMINI_PROMPT_MODEL).toBe("gemini-3.8-flash");
      expect(DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS).toBe(25000);
      expect(ZERO_TEXT_OCCLUSION_DIRECTIVE).toContain(
        "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
      );
      expect(typeof buildDeterministicCompositionBrief).toBe("function");
      expect(typeof buildReferenceDrivenArtDirective).toBe("function");
      expect(typeof resolveArtDirectionDirective).toBe("function");
    });
  });

  describe("Compilação Determinística (compileDeterministicCardPrompt / buildPromptText)", () => {
    it("deve compilar prompt determinístico estruturado com dados comerciais e guardrails", () => {
      const input = createSampleInput();
      const prompt = compileDeterministicCardPrompt(input);

      expect(prompt).toContain("--- DADOS DA OFERTA COMERCIAL ---");
      expect(prompt).toContain("- Segmento: Supermercado & Hortifrúti");
      expect(prompt).toContain('- Estabelecimento: "Supermercado Compre Bem"');
      expect(prompt).toContain('- Item ou Oferta: "Alface Americana Fresca"');
      expect(prompt).toContain("PREÇO PROMOCIONAL EM DESTAQUE MÁXIMO");
      expect(prompt).toContain("De R$ 5,99 Por R$ 3,99");
      expect(prompt).toContain("ZERO OCLUSÃO TIPOGRÁFICA");
      expect(prompt).toContain(
        "--- DIRETIVA MANDATÓRIA DE AUTENTICIDADE FOTOGRÁFICA (ANTI-GENERIC AI LOOK) ---",
      );
    });

    it("deve aplicar safe zone de 15% e aspect ratio 9:16 quando targetAspectRatio for story", () => {
      const input = createSampleInput({ targetAspectRatio: "story" });
      const prompt = compileDeterministicCardPrompt(input);

      expect(prompt).toContain(
        "9:16 vertical (master 1080x1920 para Stories e WhatsApp Status)",
      );
      expect(prompt).toContain(
        "SAFE ZONE OBRIGATÓRIA (Margem de Segurança para Stories/Status)",
      );
      expect(prompt).toContain(
        "Deixar 15% da altura no topo e 15% na base totalmente livres",
      );
    });

    it("deve aplicar supressão estrita de preço proibindo 'R$ 0,00' quando promoPrice for nulo ou vazio", () => {
      const input = createSampleInput({
        promoPrice: null,
        originalPrice: null,
      });
      const prompt = compileDeterministicCardPrompt(input);

      expect(prompt).toContain("ESTE É UM CARD INSTITUCIONAL / INFORMATIVO");
      expect(prompt).toContain(
        "É expressamente proibido inserir 'R$ 0,00' ou valores inventados",
      );
      expect(prompt).not.toContain("R$ 3,99");
    });

    it("deve injetar a diretriz inegociável de Zero Oclusão Tipográfica", () => {
      const input = createSampleInput();
      const prompt = compileDeterministicCardPrompt(input);

      expect(prompt).toContain(
        "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
      );
      expect(prompt).toContain(
        "PROIBIÇÃO DE TEXTO ATRÁS DO PERSONAGEM OU PRODUTO (NO TEXT BEHIND SUBJECT)",
      );
      expect(prompt).toContain(
        "PRIORIDADE ABSOLUTA DE 1º PLANO (TOP Z-INDEX / FOREGROUND LAYER)",
      );
    });

    it("buildPromptText deve ser idêntico a compileDeterministicCardPrompt", () => {
      const input = createSampleInput();
      expect(buildPromptText(input)).toBe(
        compileDeterministicCardPrompt(input),
      );
    });
  });

  describe("Modo REFERENCE_DRIVEN e Isolamento Estrito Zero-HEX", () => {
    it("isReferenceDrivenMode deve identificar corretamente o modo orientado à referência", () => {
      expect(
        isReferenceDrivenMode({
          referenceImageDataUrl: SAMPLE_BASE64_PNG,
          stylePresetId: "reference-style",
        }),
      ).toBe(true);

      expect(
        isReferenceDrivenMode({
          referenceImageDataUrl: SAMPLE_BASE64_PNG,
          stylePresetId: null,
        }),
      ).toBe(true);

      expect(
        isReferenceDrivenMode({
          referenceImageDataUrl: SAMPLE_BASE64_PNG,
          stylePresetId: "market-discount",
        }),
      ).toBe(false);

      expect(
        isReferenceDrivenMode({
          referenceImageDataUrl: null,
          stylePresetId: "reference-style",
        }),
      ).toBe(false);
    });

    it("deve compilar prompt sem códigos HEX e sem nomes de presets externos no modo reference-driven", () => {
      const input = createSampleInput({
        referenceImageDataUrl: SAMPLE_BASE64_PNG,
        stylePresetId: "reference-style",
      });
      const prompt = compileDeterministicCardPrompt(input);

      expect(prompt).toContain(
        "--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---",
      );
      expect(prompt).toContain(
        "Extraia com fidelidade as cores de fundo, contrastes, gradientes",
      );

      // Garantia de Zero Attention Bleeding:
      expect(prompt).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(prompt).not.toContain("market-discount");
      expect(prompt).not.toContain("retail-burst");

      // Zero oclusão deve estar presente sem introduzir HEX
      expect(prompt).toContain("ZERO OCLUSÃO TIPOGRÁFICA");
      expect(prompt).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    });
  });

  describe("Etapa 1: Planejador Dinâmico Híbrido (dynamic-planner.ts & compileDynamicCardPrompt)", () => {
    it("deve invocar o modelo rápido gemini-3.8-flash como autor do master prompt e fundir guardrails", async () => {
      const sampleMasterPrompt =
        "Cena publicitária imersiva de corte nobre com iluminação de estúdio comercial...";
      const generateContentSpy = vi.fn().mockResolvedValue({
        text: sampleMasterPrompt,
      });

      const fakeClient: PromptPlannerClient = {
        models: {
          generateContent: generateContentSpy,
        },
      };

      const input = createSampleInput({
        businessSegment: "beauty-salon",
        offerTitle: "Inauguração com Corte & Escova",
      });

      const compiledPrompt = await compileDynamicCardPrompt(input, {
        client: fakeClient,
      });

      expect(generateContentSpy).toHaveBeenCalledTimes(1);
      const callArgs = generateContentSpy.mock.calls[0][0];
      expect(callArgs.model).toBe("gemini-3.8-flash");

      expect(compiledPrompt).toContain(sampleMasterPrompt);
      expect(compiledPrompt).toContain(
        "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
      );
    });

    it("deve aplicar fallback transparente quando client não for fornecido ou não tiver generateContent", async () => {
      const input = createSampleInput();
      const brief = await planDynamicCompositionBrief(input);

      expect(brief.source).toBe("deterministic-fallback");
      expect(brief.subjectAnatomy).toContain("Sujeito comercial");
      expect(brief.antiOcclusionStrategy).toContain("100% de primeiro plano");

      const compiled = await compileDynamicCardPrompt(input);
      expect(compiled).toContain("--- DADOS DA OFERTA COMERCIAL ---");
      expect(compiled).toContain("ZERO OCLUSÃO TIPOGRÁFICA");
    });

    it("deve aplicar fallback transparente quando a chamada à IA sofrer timeout", async () => {
      const hangingClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(
                  () =>
                    resolve({
                      text: "tarde demais",
                    }),
                  500,
                );
              }),
          ),
        },
      };

      const input = createSampleInput();
      const brief = await planDynamicCompositionBrief(input, {
        client: hangingClient,
        timeoutMs: 50, // Timeout bem curto para testar a resiliência
      });

      expect(brief.source).toBe("deterministic-fallback");
    });

    it("deve aplicar fallback transparente quando o modelo lançar erro de rede ou 429", async () => {
      const failingClient: PromptPlannerClient = {
        models: {
          generateContent: vi
            .fn()
            .mockRejectedValue(new Error("429 Too Many Requests")),
        },
      };

      const input = createSampleInput();
      const brief = await planDynamicCompositionBrief(input, {
        client: failingClient,
      });

      expect(brief.source).toBe("deterministic-fallback");
    });

    it("deve aplicar fallback transparente quando a resposta não contiver texto (ex.: resposta com binário de imagem)", async () => {
      const imageOnlyClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            candidates: [
              {
                finishReason: "STOP",
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: "iVBORw0KGgo...",
                      },
                    },
                  ],
                },
              },
            ],
          }),
        },
      };

      const input = createSampleInput();
      const brief = await planDynamicCompositionBrief(input, {
        client: imageOnlyClient,
      });

      expect(brief.source).toBe("deterministic-fallback");
    });

    it("compileDynamicCardPrompt deve interpretar pedido de ajuste com Gemini 3.8 Flash na edição de card existente", async () => {
      const generateContentSpy = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          mode: "RECOMPOSE",
          reason: "Cliente solicitou reposicionar o produto no centro.",
          compositionArchetype: "center-showcase",
        }),
      });

      const fakeClient: PromptPlannerClient = {
        models: {
          generateContent: generateContentSpy,
        },
      };

      const input = createSampleInput({
        baseCardImageDataUrl: SAMPLE_BASE64_PNG,
        customStyleInstructions: "Dar mais impacto geral à apresentação",
      });

      const prompt = await compileDynamicCardPrompt(input, {
        client: fakeClient,
      });

      expect(generateContentSpy).toHaveBeenCalledTimes(1);
      expect(prompt).toContain(
        "--- RECOMPOSIÇÃO DE LAYOUT DE CARD EXISTENTE (MODO RECOMPOSE) ---",
      );
    });

    it("compileDynamicCardPrompt deve aplicar fallback gracioso para regex quando o modelo dinâmico falhar na edição", async () => {
      const fakeClient: PromptPlannerClient = {
        models: {
          generateContent: vi
            .fn()
            .mockRejectedValue(new Error("Network timeout")),
        },
      };

      const input = createSampleInput({
        baseCardImageDataUrl: SAMPLE_BASE64_PNG,
        customStyleInstructions: "Mudar apenas o preço para R$ 50,00",
      });

      const prompt = await compileDynamicCardPrompt(input, {
        client: fakeClient,
      });

      expect(prompt).toContain(
        "--- RECOMPOSIÇÃO DE LAYOUT DE CARD EXISTENTE (MODO RECOMPOSE) ---",
      );
    });

    it("buildMultimodalPromptPartsAsync deve usar planejamento dinâmico na edição quando client for fornecido", async () => {
      const generateContentSpy = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          mode: "RECOMPOSE",
          reason: "Repensar layout e foco visual.",
        }),
      });

      const fakeClient: PromptPlannerClient = {
        models: {
          generateContent: generateContentSpy,
        },
      };

      const input = createSampleInput({
        baseCardImageDataUrl: SAMPLE_BASE64_PNG,
        customStyleInstructions: "Dar mais destaque e centralizar a foto",
      });

      const parts = await buildMultimodalPromptPartsAsync(input, {
        client: fakeClient,
      });

      expect(generateContentSpy).toHaveBeenCalledTimes(1);
      expect(parts[0]).toContain(
        "--- RECOMPOSIÇÃO DE LAYOUT DE CARD EXISTENTE (MODO RECOMPOSE) ---",
      );
    });
  });

  describe("Edição Pós-Pagamento Adaptativa (SURGICAL vs RECOMPOSE)", () => {
    describe("detectEditIntentMode", () => {
      it("deve classificar como SURGICAL apenas quando não houver instruções de ajuste", () => {
        expect(
          detectEditIntentMode({
            customStyleInstructions: undefined,
          }),
        ).toBe("SURGICAL");

        expect(
          detectEditIntentMode({
            customStyleInstructions: "",
          }),
        ).toBe("SURGICAL");

        expect(
          detectEditIntentMode({
            customStyleInstructions: "   ",
          }),
        ).toBe("SURGICAL");
      });

      it("deve classificar como RECOMPOSE quando presetChanged for true", () => {
        expect(
          detectEditIntentMode({
            presetChanged: true,
          }),
        ).toBe("RECOMPOSE");
      });

      it("deve classificar como RECOMPOSE para qualquer instrução de ajuste do cliente", () => {
        const phrases = [
          "Mudar o telefone para (11) 98888-7777",
          "Corrigir preço de R$ 5,00 para R$ 4,50",
          "Mudar a cor da logo para azul escuro",
          "não colocar o texto atrás do personagem",
          "mover o título para baixo",
          "Dar mais destaque para a foto do produto no centro",
          "quero mudar a fonte do titulo principal para outra tipografia",
        ];

        for (const phrase of phrases) {
          expect(
            detectEditIntentMode({ customStyleInstructions: phrase }),
            `Falhou para a frase: "${phrase}"`,
          ).toBe("RECOMPOSE");
        }
      });
    });

    describe("buildAdaptiveEditPromptText em Modo SURGICAL", () => {
      it("deve gerar prompt com marcadores estritos de preservação da imagem base", () => {
        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: "Mudar telefone para (11) 91111-2222",
        });

        const prompt = buildAdaptiveEditPromptText(input, { mode: "SURGICAL" });

        expect(prompt).toContain(
          "--- EDIÇÃO DE CARD EXISTENTE (MODO CIRÚRGICO) ---",
        );
        expect(prompt).toContain(
          "preservando estritamente toda a composição, cenário, iluminação e identidade do produto",
        );
        expect(prompt).toContain("Mudar telefone para (11) 91111-2222");
        expect(prompt).toContain(
          "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
        );
      });

      it("buildSurgicalEditPromptText deve ser atalho direto para o modo cirúrgico", () => {
        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: "Mudar telefone",
        });

        expect(buildSurgicalEditPromptText(input)).toBe(
          buildAdaptiveEditPromptText(input, { mode: "SURGICAL" }),
        );
      });
    });

    describe("buildAdaptiveEditPromptText em Modo RECOMPOSE", () => {
      it("deve autorizar reposicionamento mantendo a identidade do produto", () => {
        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions:
            "não colocar o texto atrás do personagem e mover título para baixo",
          stylePresetId: "market-fresh",
        });

        const prompt = buildAdaptiveEditPromptText(input, {
          mode: "RECOMPOSE",
          presetChanged: true,
          newStylePresetId: "market-fresh",
        });

        expect(prompt).toContain(
          "--- RECOMPOSIÇÃO DE LAYOUT DE CARD EXISTENTE (MODO RECOMPOSE) ---",
        );
        expect(prompt).toContain(
          "Reposicione os elementos e reestruture o layout da IMAGEM BASE anexa",
        );
        expect(prompt).toContain(
          "mantendo rigorosamente a mesma identidade visual e características do produto/sujeito",
        );

        // Trava estrita cirúrgica NÃO deve existir no modo RECOMPOSE
        expect(prompt).not.toContain(
          "preservando estritamente toda a composição, cenário, iluminação e identidade do produto",
        );

        expect(prompt).toContain(
          "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
        );
      });
    });

    describe("resolveRegenerationStyleInstructions", () => {
      it("deve preservar formato original quando presetChanged for false ou omitido (compatibilidade legada)", () => {
        const result = resolveRegenerationStyleInstructions(
          "Instrução original",
          "Mudar telefone",
          "Azul e Branco",
        );

        expect(result).toBe(
          "Instrução original. Ajuste solicitado pelo cliente: Paleta de cores: Azul e Branco. Mudar telefone",
        );
      });

      it("deve anexar marcador de recomposição quando presetChanged for true", () => {
        const result = resolveRegenerationStyleInstructions(
          "Instrução original",
          "Foco nos verdes",
          {
            presetChanged: true,
            colorPalette: "Verde e Dourado",
          },
        );

        expect(result).toBe(
          "Instrução original. Ajuste solicitado pelo cliente: Paleta de cores: Verde e Dourado. Reestruturar layout e estilo visual aplicando integralmente o novo preset selecionado. Foco nos verdes",
        );
      });
    });
  });

  describe("Montagem de Partes Multimodais (buildMultimodalPromptParts & buildMultimodalPromptPartsAsync)", () => {
    it("deve montar partes multimodais com baseCard quando for edição", () => {
      const input = createSampleInput({
        baseCardImageDataUrl: SAMPLE_BASE64_PNG,
        logoImageDataUrl: SAMPLE_BASE64_PNG,
        productImageDataUrl: SAMPLE_BASE64_PNG,
      });

      const parts = buildMultimodalPromptParts(input);
      expect(typeof parts[0]).toBe("string");
      expect(parts[0]).toContain(
        "--- EDIÇÃO DE CARD EXISTENTE (MODO CIRÚRGICO) ---",
      );
      expect(parts.length).toBeGreaterThan(1);
    });

    it("deve montar partes multimodais na geração inicial com fotos anexas", () => {
      const input = createSampleInput({
        productImageDataUrl: SAMPLE_BASE64_PNG,
        referenceImageDataUrl: SAMPLE_BASE64_PNG,
        logoImageDataUrl: SAMPLE_BASE64_PNG,
      });

      const parts = buildMultimodalPromptParts(input);
      expect(typeof parts[0]).toBe("string");
      expect(parts[0]).toContain("--- DADOS DA OFERTA COMERCIAL ---");
      expect(
        parts.some(
          (p) =>
            typeof p === "string" && p.includes("LOGOTIPO DA LOJA FORNECIDO"),
        ),
      ).toBe(true);
      expect(
        parts.some(
          (p) =>
            typeof p === "string" &&
            p.includes("FOTO DO PRODUTO REAL FORNECIDA"),
        ),
      ).toBe(true);
      expect(
        parts.some(
          (p) =>
            typeof p === "string" &&
            p.includes("IMAGEM DE REFERÊNCIA ESTÉTICA"),
        ),
      ).toBe(true);
    });

    it("buildMultimodalPromptPartsAsync deve orquestrar o compilador dinâmico assíncrono", async () => {
      const fakeClient: PromptPlannerClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: "Sujeito planejado dinamicamente em cena fotográfica profissional de alta conversão.",
          }),
        },
      };

      const input = createSampleInput();
      const parts = await buildMultimodalPromptPartsAsync(input, {
        client: fakeClient,
      });

      expect(typeof parts[0]).toBe("string");
      expect(parts[0]).toContain(
        "Sujeito planejado dinamicamente em cena fotográfica",
      );
      expect(parts[0]).toContain("ZERO OCLUSÃO TIPOGRÁFICA");
    });
  });

  describe("Autenticidade Fotográfica e Diversificação de Hierarquia Visual", () => {
    it("deve exportar AUTHENTIC_PHOTOGRAPHY_DIRECTIVE e conter guardrails anti-CGI e contexto brasileiro", () => {
      expect(AUTHENTIC_PHOTOGRAPHY_DIRECTIVE).toContain(
        "AUTENTICIDADE FOTOGRÁFICA (ANTI-GENERIC AI LOOK)",
      );
      expect(AUTHENTIC_PHOTOGRAPHY_DIRECTIVE).toContain(
        "fotografia comercial profissional de câmera full-frame",
      );
      expect(AUTHENTIC_PHOTOGRAPHY_DIRECTIVE).toContain("ANTI-CLICHÊ DE IA");
      expect(AUTHENTIC_PHOTOGRAPHY_DIRECTIVE).toContain(
        "comércio local real do Brasil",
      );
    });

    it("deve injetar a diretriz de autenticidade fotográfica no prompt de geração inicial e no recompose", () => {
      const input = createSampleInput();
      const prompt = compileDeterministicCardPrompt(input);

      expect(prompt).toContain(
        "--- DIRETIVA MANDATÓRIA DE AUTENTICIDADE FOTOGRÁFICA (ANTI-GENERIC AI LOOK) ---",
      );

      const recomposePrompt = buildAdaptiveEditPromptText(
        {
          ...input,
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: "afastar elementos e recompor",
        },
        { mode: "RECOMPOSE" },
      );

      expect(recomposePrompt).toContain(
        "--- DIRETIVA MANDATÓRIA DE AUTENTICIDADE FOTOGRÁFICA (ANTI-GENERIC AI LOOK) ---",
      );
    });
  });

  describe("Autoria Integral do Prompt Final pelo Gemini 3.8 Flash (Ticket 01)", () => {
    it("deve exportar DEFAULT_MASTER_PROMPT_TIMEOUT_MS com valor canônico de 25000ms", () => {
      expect(DEFAULT_MASTER_PROMPT_TIMEOUT_MS).toBe(25000);
      expect(DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS).toBe(25000);
    });

    describe("buildMasterPromptAuthorContents", () => {
      const segments = [
        "burger-shop",
        "pizzeria",
        "restaurant",
        "supermarket",
        "fashion",
        "beauty-salon",
        "local-retail",
      ] as const;

      it.each(segments)(
        "deve instruir o modelo a atuar como Diretor de Arte Sênior de Agência para o segmento %s",
        (segment) => {
          const input = createSampleInput({
            businessSegment: segment,
            offerTitle: "Oferta Especial do Segmento",
          });
          const parts = buildMasterPromptAuthorContents(input);
          const promptText = parts.find((p) => typeof p === "string") as string;

          expect(promptText).toContain(
            "Você é um Diretor de Arte Publicitário Sênior de Agência",
          );
          expect(promptText).toContain(
            "CENA ÚNICA TRIDIMENSIONAL CONTÍNUA (FULL-BLEED, PROIBIDO DIVISÃO 50/50 CHAPADA)",
          );
          expect(promptText).toContain(
            "É TERMINANTEMENTE PROIBIDO criar divisão 50/50 chapada por linha reta artificial",
          );
          expect(promptText).toContain(
            "DETALHAMENTO SENSORIAL E PRODUCT/FOOD STYLING HIPER-REALISTA",
          );
          expect(promptText).toContain("lente 85mm f/2.0");
          expect(promptText).toContain("rim light");
          expect(promptText).toContain(
            "TIPOGRAFIA PUBLICITÁRIA EXPRESSIVA MULTI-ESTILO",
          );
          expect(promptText).toContain("Assinatura da Loja no Topo");
          expect(promptText).toContain("fonte display condensada robusta");
          expect(promptText).toContain("lettering brush script");
          expect(promptText).toContain("Micro-copy de Atributos Sensoriais");
          expect(promptText).toContain("Selo de Chamada / CTA");
          expect(promptText).toContain("grunge brush stroke");
        },
      );

      it("deve destacar preço promocional e original quando informados", () => {
        const input = createSampleInput({
          promoPrice: "R$ 49,90",
          originalPrice: "R$ 69,90",
        });
        const parts = buildMasterPromptAuthorContents(input);
        const promptText = parts.find((p) => typeof p === "string") as string;

        expect(promptText).toContain("De R$ 69,90 Por R$ 49,90");
        expect(promptText).toContain("R$ 49,90");
      });

      it("deve aplicar supressão estrita de valores monetários / R$ mantendo 100% da agressividade promocional quando sem preço", () => {
        const input = createSampleInput({
          promoPrice: null,
          originalPrice: null,
        });
        const parts = buildMasterPromptAuthorContents(input);
        const promptText = parts.find((p) => typeof p === "string") as string;

        expect(promptText).toContain(
          "INVARIANTE CRÍTICA DE ANÚNCIO SEM PREÇO (SUPRESSÃO ESTRITA DE VALORES MONETÁRIOS)",
        );
        expect(promptText).toContain(
          'É TERMINANTEMENTE PROIBIDO inventar valores numéricos, inserir "R$ 0,00", cifras ou símbolos "R$"',
        );
        expect(promptText).toContain(
          "MANTENHA 100% DA AGRESSIVIDADE E DO APELO PROMOCIONAL",
        );
      });

      it("deve configurar modo reference-driven com Zero-HEX e sem presets no prompt de sistema", () => {
        const input = createSampleInput({
          referenceImageDataUrl: SAMPLE_BASE64_PNG,
          stylePresetId: "reference-style",
        });
        const parts = buildMasterPromptAuthorContents(input);
        const promptText = parts.find((p) => typeof p === "string") as string;

        expect(promptText).toContain("MODO REFERENCE-DRIVEN");
        expect(promptText).toContain(
          "Extraia 100% da paleta cromática, iluminação, composição espacial",
        );
        expect(promptText).toContain("PROIBIÇÃO ABSOLUTA DE CÓDIGOS HEX");
        expect(promptText).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      });

      it("deve anexar produto, referência e logotipo como inlineData quando fornecidos", () => {
        const input = createSampleInput({
          productImageDataUrl: SAMPLE_BASE64_PNG,
          referenceImageDataUrl: SAMPLE_BASE64_PNG,
          logoImageDataUrl: SAMPLE_BASE64_PNG,
        });
        const parts = buildMasterPromptAuthorContents(input);

        const inlineParts = parts.filter(
          (p) => typeof p === "object" && p !== null && "inlineData" in p,
        );
        expect(inlineParts.length).toBe(3);
      });
    });

    describe("planDynamicCompositionBrief & compileDynamicCardPrompt com Master Prompt Integral", () => {
      it("deve invocar gemini-3.8-flash com maxOutputTokens: 4096, temp: 0.4 e timeout de 25000ms", async () => {
        const naturalLanguagePrompt = `
Fotografia comercial publicitária épica de hambúrguer artesanal triplo na chapa, destacando a reação de Maillard intensa na crosta da carne farta, queijo cheddar inglês derretendo dramaticamente pelas laterais e sementes de gergelim douradas sobre pão brioche macio. Iluminação lateral suave com óptica 85mm f/2.0 e rim light dourada nos contornos da carne.

No topo, emblema artesanal da marca "Supermercado Compre Bem" com insígnia clássica. O título "Alface Americana Fresca" ocupa posição superior imponente, combinando fonte display robusta condensada em branco com lettering brush script expressivo em amarelo mostarda vibrante. Abaixo do título, micro-copy refinado com atributos "FRESCO • CROCANTE • SELECIONADO".

Badge de alto impacto gráfico exibindo "De R$ 5,99 Por R$ 3,99" no canto inferior direito, acompanhado de selo de CTA estilizado como carimbo artesanal dizendo "Aproveite hoje mesmo". Todos os textos e elementos gráficos em primeiro plano absoluto sobre zona de penumbra limpa.
`.trim();

        const generateContentSpy = vi.fn().mockResolvedValue({
          text: naturalLanguagePrompt,
        });

        const fakeClient: PromptPlannerClient = {
          models: {
            generateContent: generateContentSpy,
          },
        };

        const input = createSampleInput();
        const brief = await planDynamicCompositionBrief(input, {
          client: fakeClient,
        });

        expect(generateContentSpy).toHaveBeenCalledTimes(1);
        const callArgs = generateContentSpy.mock.calls[0][0];
        expect(callArgs.model).toBe("gemini-3.8-flash");
        expect(callArgs.config?.maxOutputTokens).toBe(4096);
        expect(callArgs.config?.temperature).toBe(0.4);
        expect(callArgs.config?.thinkingConfig).toEqual({
          thinkingLevel: "low",
        });

        expect(brief.source).toBe("ai-dynamic");
        expect(brief.authoredMasterPrompt).toBe(naturalLanguagePrompt);

        // Ao compilar o card dinâmico, deve retornar o prompt autoral acompanhado de metadados garantidos
        const compiled = await compileDynamicCardPrompt(input, {
          client: fakeClient,
        });

        expect(compiled).toContain(naturalLanguagePrompt);
        expect(compiled).toContain("- Proporção Obrigatória: 4:5 vertical");
        expect(compiled).toContain(
          "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
        );
        // Não deve empilhar as 4 camadas estáticas legadas
        expect(compiled).not.toContain(
          "--- ARQUITETURA DE COMPOSIÇÃO EM 4 CAMADAS (STEP-BY-STEP) ---",
        );
        expect(compiled).not.toContain("CAMADA 1 — FUNDO FULL-BLEED");
      });

      it("deve injetar Safe Zone obrigatória de 15% quando formato for Story", async () => {
        const fakeClient: PromptPlannerClient = {
          models: {
            generateContent: vi.fn().mockResolvedValue({
              text: "Master prompt para Story com narrativa autoral completa.",
            }),
          },
        };

        const input = createSampleInput({ targetAspectRatio: "story" });
        const compiled = await compileDynamicCardPrompt(input, {
          client: fakeClient,
        });

        expect(compiled).toContain(
          "Master prompt para Story com narrativa autoral completa.",
        );
        expect(compiled).toContain("9:16 vertical");
        expect(compiled).toContain("SAFE ZONE OBRIGATÓRIA");
        expect(compiled).toContain(
          "Deixar 15% da altura no topo e 15% na base totalmente livres",
        );
        expect(compiled).toContain(ZERO_TEXT_OCCLUSION_DIRECTIVE);
      });

      it("assembleAuthoredMasterPrompt deve montar prompt com diretrizes de anexos e proporção", () => {
        const input = createSampleInput({
          logoImageDataUrl: SAMPLE_BASE64_PNG,
          productImageDataUrl: SAMPLE_BASE64_PNG,
          referenceImageDataUrl: SAMPLE_BASE64_PNG,
        });

        const assembled = assembleAuthoredMasterPrompt({
          authoredMasterPrompt: "Prompt autoral direto.",
          input,
          isStory: false,
          proportionDirectives: "- Proporção Obrigatória: 4:5 vertical",
        });

        expect(assembled).toContain("Prompt autoral direto.");
        expect(assembled).toContain("- Proporção Obrigatória: 4:5 vertical");
        expect(assembled).toContain(ZERO_TEXT_OCCLUSION_DIRECTIVE);
      });
    });

    describe("Preservação do Sujeito e Identidade Visual no Modo RECOMPOSE", () => {
      it("deve sempre anexar baseCardImageDataUrl como inlineData em modo RECOMPOSE com diretriz de consistência", async () => {
        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          productImageDataUrl: SAMPLE_BASE64_PNG,
          logoImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions:
            "Dar mais destaque para a foto do produto no centro",
        });

        // 1. Modo síncrono
        const syncParts = buildMultimodalPromptParts(input);
        const syncInlineImages = syncParts.filter(
          (p) => typeof p === "object" && p !== null && "inlineData" in p,
        );
        // Deve conter BaseCard + Produto + Logo = 3 imagens inline
        expect(syncInlineImages.length).toBe(3);
        expect(
          syncParts.some(
            (p) => typeof p === "string" && p.includes("[IMAGEM BASE DO CARD]"),
          ),
        ).toBe(true);

        // 2. Modo assíncrono com mock de planejamento
        const fakeClient: PromptPlannerClient = {
          models: {
            generateContent: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                mode: "RECOMPOSE",
                reason: "Centralizar o produto e quebrar divisão anterior.",
              }),
            }),
          },
        };

        const asyncParts = await buildMultimodalPromptPartsAsync(input, {
          client: fakeClient,
        });
        const asyncInlineImages = asyncParts.filter(
          (p) => typeof p === "object" && p !== null && "inlineData" in p,
        );
        // Deve conter BaseCard + Produto + Logo = 3 imagens inline
        expect(asyncInlineImages.length).toBe(3);
        expect(
          asyncParts.some(
            (p) => typeof p === "string" && p.includes("[IMAGEM BASE DO CARD]"),
          ),
        ).toBe(true);
      });

      it("deve continuar anexando baseCardImageDataUrl como inlineData em modo SURGICAL para preservação estrita", () => {
        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          productImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: undefined,
        });

        const parts = buildMultimodalPromptParts(input);
        const inlineImages = parts.filter(
          (p) => typeof p === "object" && p !== null && "inlineData" in p,
        );
        // BaseCard + Produto = 2 imagens inline
        expect(inlineImages.length).toBe(2);
        expect(
          parts.some(
            (p) => typeof p === "string" && p.includes("[IMAGEM BASE DO CARD]"),
          ),
        ).toBe(true);
      });
    });

    describe("Autoria do Master Prompt na Edição Adaptativa pelo Gemini 3.8 Flash (Ticket 01)", () => {
      it("buildMasterEditPromptAuthorContents deve gerar instruções de autoria, classificação e anexar imagem base", () => {
        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          productImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: "Centralizar o hambúrguer no meio da imagem",
        });

        const parts = buildMasterEditPromptAuthorContents(input);
        const textPart = parts.find((p) => typeof p === "string") as string;

        expect(textPart).toContain(
          "Você é um Diretor de Arte Sênior e Especialista em Design Gráfico Publicitário",
        );
        expect(textPart).toContain("DADOS DO CARD ATUAL");
        expect(textPart).toContain("AJUSTE SOLICITADO PELO CLIENTE");
        expect(textPart).toContain(
          "Centralizar o hambúrguer no meio da imagem",
        );
        expect(textPart).toContain("INSTRUÇÕES CRÍTICAS DE CLASSIFICAÇÃO");
        expect(textPart).toContain('"RECOMPOSE"');
        expect(textPart).toContain('"SURGICAL"');
        expect(textPart).toContain("DIRETRIZ DE AUTORIA DO MASTER PROMPT");
        expect(textPart).toContain("authoredMasterPrompt");

        // Deve conter imagem base e produto como inlineData
        const inlineParts = parts.filter(
          (p) => typeof p === "object" && p !== null && "inlineData" in p,
        );
        expect(inlineParts.length).toBe(2);
      });

      it("planDynamicEditIntent deve extrair authoredMasterPrompt retornado pelo Gemini 3.8 Flash", async () => {
        const authoredPrompt =
          "Fotografia publicitária renovada com o produto posicionado exatamente no centro do card sobre bancada rústica iluminada, atmosfera envolvente e tipografia de alto impacto em primeiro plano absoluto.";

        const fakeClient: PromptPlannerClient = {
          models: {
            generateContent: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                mode: "RECOMPOSE",
                reason: "Reestruturação do layout com foco no centro.",
                compositionArchetype: "center-showcase",
                authoredMasterPrompt: authoredPrompt,
              }),
            }),
          },
        };

        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: "Centralizar o produto e recompor",
        });

        const result = await planDynamicEditIntent(input, {
          client: fakeClient,
        });

        expect(result.mode).toBe("RECOMPOSE");
        expect(result.source).toBe("ai-dynamic");
        expect(result.compositionArchetype).toBe("center-showcase");
        expect(result.authoredMasterPrompt).toBe(authoredPrompt);
      });

      it("compileDynamicCardPrompt deve utilizar authoredMasterPrompt diretamente via assembleAuthoredMasterPrompt na edição", async () => {
        const authoredPrompt =
          "Master prompt de edição autoral redigido pelo Gemini 3.8 Flash para recompor a cena comercial.";

        const fakeClient: PromptPlannerClient = {
          models: {
            generateContent: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                mode: "RECOMPOSE",
                reason: "Mudança estrutural requerida.",
                authoredMasterPrompt: authoredPrompt,
              }),
            }),
          },
        };

        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: "Reorganizar elementos e dar mais respiro",
          targetAspectRatio: "story",
        });

        const prompt = await compileDynamicCardPrompt(input, {
          client: fakeClient,
        });

        expect(prompt).toContain(authoredPrompt);
        expect(prompt).toContain("SAFE ZONE OBRIGATÓRIA");
        expect(prompt).toContain(ZERO_TEXT_OCCLUSION_DIRECTIVE);
        // Não deve usar o template estático genérico quando houver autoria
        expect(prompt).not.toContain(
          "--- DIRETRIZ FUNDAMENTAL: DESTRAVAMENTO ESPACIAL E REESTRUTURAÇÃO DE LAYOUT ---",
        );
      });

      it("buildMultimodalPromptPartsAsync deve usar authoredMasterPrompt e anexar baseCardImageDataUrl em modo RECOMPOSE", async () => {
        const authoredPrompt =
          "Master prompt com recomposição total dos elementos para destravar pixels.";

        const fakeClient: PromptPlannerClient = {
          models: {
            generateContent: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                mode: "RECOMPOSE",
                reason: "Centralizar o produto mantendo a identidade visual.",
                authoredMasterPrompt: authoredPrompt,
              }),
            }),
          },
        };

        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          productImageDataUrl: SAMPLE_BASE64_PNG,
          logoImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: "Mudar totalmente o layout para o centro",
        });

        const parts = await buildMultimodalPromptPartsAsync(input, {
          client: fakeClient,
        });

        // Primeiro elemento é o prompt montado com authoredMasterPrompt
        expect(parts[0]).toContain(authoredPrompt);
        expect(parts[0]).toContain(ZERO_TEXT_OCCLUSION_DIRECTIVE);

        // Deve conter BaseCard + Produto + Logotipo = 3 imagens inline
        const inlineImages = parts.filter(
          (p) => typeof p === "object" && p !== null && "inlineData" in p,
        );
        expect(inlineImages.length).toBe(3);
        expect(
          parts.some(
            (p) => typeof p === "string" && p.includes("[IMAGEM BASE DO CARD]"),
          ),
        ).toBe(true);
      });
    });
  });
});
