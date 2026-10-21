import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS,
  DEFAULT_GEMINI_PROMPT_MODEL,
  buildAdaptiveEditPromptText,
  buildDeterministicCompositionBrief,
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
  resolveArtDirectionDirective,
  resolveRegenerationStyleInstructions,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
  RECOMPOSE_INTENT_REGEX,
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
      expect(DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS).toBe(8000);
      expect(ZERO_TEXT_OCCLUSION_DIRECTIVE).toContain(
        "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
      );
      expect(RECOMPOSE_INTENT_REGEX).toBeInstanceOf(RegExp);
      expect(typeof buildDeterministicCompositionBrief).toBe("function");
      expect(typeof buildReferenceDrivenArtDirective).toBe("function");
      expect(typeof resolveArtDirectionDirective).toBe("function");
    });
  });

  describe("Compilação Determinística (compileDeterministicCardPrompt / buildPromptText)", () => {
    it("deve compilar prompt em 4 camadas estruturadas com enquadramento full-bleed e ótica fotográfica", () => {
      const input = createSampleInput();
      const prompt = compileDeterministicCardPrompt(input);

      expect(prompt).toContain("--- DADOS DA OFERTA COMERCIAL ---");
      expect(prompt).toContain(
        "- Segmento do Negócio: Supermercado & Hortifrúti",
      );
      expect(prompt).toContain(
        "- Nome do Estabelecimento: Supermercado Compre Bem",
      );
      expect(prompt).toContain(
        "- Item ou Oferta Anunciada: Alface Americana Fresca",
      );
      expect(prompt).toContain("PREÇO PROMOCIONAL EM DESTAQUE MÁXIMO");
      expect(prompt).toContain("De R$ 5,99 Por R$ 3,99");
      expect(prompt).toContain(
        "--- ARQUITETURA DE COMPOSIÇÃO EM 4 CAMADAS (STEP-BY-STEP) ---",
      );
      expect(prompt).toContain("CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA");
      expect(prompt).toContain(
        "CAMADA 2 — SUJEITO HERO & ÓPTICA FOTOGRÁFICA COMERCIAL",
      );
      expect(prompt).toContain(
        "CAMADA 3 — GEOMETRIA DE GRID, SAFE ZONE & TIPOGRAFIA DESCRITIVA",
      );
      expect(prompt).toContain(
        "CAMADA 4 — ANCORAGEM DE PREÇO & RODAPÉ COMERCIAL",
      );
      expect(prompt).toContain("--- HIERARQUIA VISUAL OBRIGATÓRIA ---");
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
        "extraídos 100% com fidelidade da IMAGEM DE REFERÊNCIA anexa",
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
    it("deve invocar o modelo rápido gemini-3.8-flash com brief estruturado e fundir no prompt final", async () => {
      const generateContentSpy = vi.fn().mockResolvedValue({
        text: JSON.stringify({
          subjectAnatomy:
            "Pessoa e modelo em pé no canto esquerdo olhando para a frente.",
          safeTypographyZone: "Quadrante superior direito com respiro limpo.",
          antiOcclusionStrategy:
            "Título renderizado em faixa sólida à direita em 1º plano.",
          layoutAdaptation:
            "Layout assimétrico com sujeito à esquerda e conteúdo comercial à direita.",
        }),
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

      // Verifica que o planejamento dinâmico foi incorporado
      expect(compiledPrompt).toContain(
        "--- PLANEJAMENTO DE COMPOSIÇÃO DINÂMICA (ETAPA 1 - AI-DYNAMIC) ---",
      );
      expect(compiledPrompt).toContain(
        "Pessoa e modelo em pé no canto esquerdo",
      );
      expect(compiledPrompt).toContain(
        "Quadrante superior direito com respiro limpo",
      );
      expect(compiledPrompt).toContain(
        "Título renderizado em faixa sólida à direita em 1º plano",
      );

      // Verifica que os guardrails determinísticos e Zero Oclusão continuam presentes
      expect(compiledPrompt).toContain(
        "ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY",
      );
      expect(compiledPrompt).toContain(
        "CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA",
      );
    });

    it("deve aplicar fallback transparente quando client não for fornecido ou não tiver generateContent", async () => {
      const input = createSampleInput();
      const brief = await planDynamicCompositionBrief(input);

      expect(brief.source).toBe("deterministic-fallback");
      expect(brief.subjectAnatomy).toContain("Sujeito comercial");
      expect(brief.antiOcclusionStrategy).toContain("100% de primeiro plano");

      const compiled = await compileDynamicCardPrompt(input);
      expect(compiled).toContain(
        "PLANEJAMENTO DE COMPOSIÇÃO DINÂMICA (ETAPA 1 - DETERMINISTIC-FALLBACK)",
      );
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
  });

  describe("Edição Pós-Pagamento Adaptativa (SURGICAL vs RECOMPOSE)", () => {
    describe("detectEditIntentMode", () => {
      it("deve classificar como SURGICAL quando o ajuste for pontual de dados ou texto", () => {
        expect(
          detectEditIntentMode({
            customStyleInstructions: "Mudar o telefone para (11) 98888-7777",
          }),
        ).toBe("SURGICAL");

        expect(
          detectEditIntentMode({
            customStyleInstructions: "Corrigir preço de R$ 5,00 para R$ 4,50",
          }),
        ).toBe("SURGICAL");

        expect(
          detectEditIntentMode({
            customStyleInstructions: "Mudar a cor da logo para azul escuro",
          }),
        ).toBe("SURGICAL");
      });

      it("deve classificar como RECOMPOSE quando presetChanged for true", () => {
        expect(
          detectEditIntentMode({
            presetChanged: true,
            customStyleInstructions: "Ajustar texto",
          }),
        ).toBe("RECOMPOSE");
      });

      it("deve classificar como RECOMPOSE quando houver termos de desobstrução, personagem ou espacial", () => {
        const recomposePhrases = [
          "não colocar o texto atrás do personagem",
          "mover o título para baixo",
          "o texto ficou coberto pelo modelo",
          "reorganizar o layout para dar mais respiro",
          "trocar o fundo por algo mais clean",
          "mudar o estilo para premium",
          "colocar o preço em primeiro plano",
          "afastar o título da pessoa",
          "o texto está escondido atrás do hambúrguer",
        ];

        for (const phrase of recomposePhrases) {
          expect(
            detectEditIntentMode({ customStyleInstructions: phrase }),
            `Falhou para a frase: "${phrase}"`,
          ).toBe("RECOMPOSE");
        }
      });
    });

    describe("buildAdaptiveEditPromptText em Modo SURGICAL", () => {
      it("deve gerar prompt com marcadores estritos de preservação e proibição de reinventar", () => {
        const input = createSampleInput({
          baseCardImageDataUrl: SAMPLE_BASE64_PNG,
          customStyleInstructions: "Mudar telefone para (11) 91111-2222",
        });

        const prompt = buildAdaptiveEditPromptText(input, { mode: "SURGICAL" });

        expect(prompt).toContain("EDIÇÃO CIRÚRGICA DE IMAGEM EXISTENTE");
        expect(prompt).toContain(
          "--- DIRETRIZ FUNDAMENTAL: PRESERVAÇÃO ESTRITA ---",
        );
        expect(prompt).toContain(
          "1. PRESERVAÇÃO TOTAL DO DESIGN: Mantenha 100% da estrutura, cenário, iluminação, produto anunciado, acompanhamentos, paleta de cores, tipografia, fontes, faixas e posições da IMAGEM BASE rigorosamente inalterados.",
        );
        expect(prompt).toContain("2. PROIBIDO REINVENTAR");
        expect(prompt).toContain("3. AJUSTE CIRÚRGICO SOLICITADO");
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
      it("deve destrancar posições, autorizar reestruturação e aplicar novo estilo", () => {
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
          "RECOMPOSIÇÃO VISUAL E REESTRUTURAÇÃO DE LAYOUT DE CARD EXISTENTE (MODO RECOMPOSE)",
        );
        expect(prompt).toContain(
          "--- DIRETRIZ FUNDAMENTAL: DESTRAVAMENTO ESPACIAL E REESTRUTURAÇÃO DE LAYOUT ---",
        );
        expect(prompt).toContain(
          "1. DESTRAVAMENTO ESPACIAL E DE ESTILO: Você está AUTORIZADO E OBRIGADO a alterar posições",
        );
        expect(prompt).toContain(
          "2. REPOSICIONAMENTO DE ELEMENTOS: Reposicione livremente o sujeito, o título, o preço e os selos",
        );

        // Trava estrita NÃO deve existir no modo RECOMPOSE
        expect(prompt).not.toContain(
          "Mantenha 100% da estrutura, cenário, iluminação, produto anunciado, acompanhamentos, paleta de cores, tipografia, fontes, faixas e posições da IMAGEM BASE rigorosamente inalterados",
        );

        // Deve incluir a diretriz do novo preset market-fresh
        expect(prompt).toContain(
          'DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Feira & Hortifrúti Natural"',
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
      expect(parts[0]).toContain("EDIÇÃO CIRÚRGICA DE IMAGEM EXISTENTE");
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
            text: JSON.stringify({
              subjectAnatomy: "Sujeito planejado dinamicamente.",
              safeTypographyZone: "Topo e centro livres.",
              antiOcclusionStrategy: "Foreground 100%.",
              layoutAdaptation: "Layout harmônico.",
            }),
          }),
        },
      };

      const input = createSampleInput();
      const parts = await buildMultimodalPromptPartsAsync(input, {
        client: fakeClient,
      });

      expect(typeof parts[0]).toBe("string");
      expect(parts[0]).toContain("Sujeito planejado dinamicamente.");
      expect(parts[0]).toContain("ZERO OCLUSÃO TIPOGRÁFICA");
    });
  });
});
