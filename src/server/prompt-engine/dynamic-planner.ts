import { serverEnv } from "@/config/server-env";
import {
  DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS,
  DEFAULT_GEMINI_PROMPT_MODEL,
  type DynamicCompositionBrief,
  type DynamicPromptCompileOptions,
  type InlineDataPart,
  type PromptEngineInput,
  type PromptPlannerGenerateResponse,
} from "./types";
import {
  isReferenceDrivenMode,
  parseDataUrl,
  SEGMENT_ART_DIRECTIVES,
} from "./art-direction-blueprints";
import { createServerLogger } from "@/server/logger";

const log = createServerLogger("prompt-engine.dynamic-planner");

async function callWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = "DYNAMIC_PLANNER_TIMEOUT",
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function buildDeterministicCompositionBrief(
  input: PromptEngineInput,
): DynamicCompositionBrief {
  const isStory = input.targetAspectRatio === "story";
  const hasProduct = Boolean(input.productImageDataUrl);
  const hasRef = isReferenceDrivenMode(input);

  const subjectAnatomy = hasProduct
    ? "Produto hero fornecido posicionado em destaque com proporções realistas e acabamento comercial impecável."
    : "Sujeito comercial centralizado com proporções harmônicas e respiro balanceado.";

  const safeTypographyZone = isStory
    ? "Faixa central segura mantendo 15% de margem no topo e 15% na base rigorosamente livres para interface de Stories."
    : "Área de leitura limpa em quadrantes livres mantendo alto contraste em 1º plano absoluto.";

  const antiOcclusionStrategy =
    "Prioridade 100% de primeiro plano para todos os textos. Proibido colocar texto atrás de personagem, rosto, cabelo ou produto.";

  const layoutAdaptation = hasRef
    ? "Composição edge-to-edge inspirada na distribuição geométrica e respiros da imagem de referência anexa."
    : "Composição full-bleed edge-to-edge respeitando a arquitetura visual do segmento comercial.";

  return {
    subjectAnatomy,
    safeTypographyZone,
    antiOcclusionStrategy,
    layoutAdaptation,
    source: "deterministic-fallback",
  };
}

function extractTextFromResponse(
  response?: PromptPlannerGenerateResponse,
): string {
  if (!response) return "";

  if (typeof response.text === "string" && response.text.trim().length > 0) {
    return response.text.trim();
  }

  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) return "";

  const textParts = candidate.content.parts
    .map((part) => (typeof part.text === "string" ? part.text.trim() : ""))
    .filter(Boolean);

  return textParts.join("\n").trim();
}

function sanitizeTextForReferenceMode(text: string): string {
  return text
    .replace(/#([0-9a-fA-F]{3,8})\b/g, "")
    .replace(
      /\b(market-discount|market-fresh|market-premium|fashion-boutique|fashion-modern|fashion-vibrant|salon-glamour|barber-vintage|pizza-rustic|pizza-modern|burger-craft|burger-smash)\b/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseOrExtractBrief(
  rawText: string,
  input: PromptEngineInput,
): DynamicCompositionBrief {
  const isRefDriven = isReferenceDrivenMode(input);
  const cleanedText = isRefDriven
    ? sanitizeTextForReferenceMode(rawText)
    : rawText.trim();

  // Tenta extrair JSON delimitado
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      if (
        typeof parsed.subjectAnatomy === "string" ||
        typeof parsed.safeTypographyZone === "string" ||
        typeof parsed.antiOcclusionStrategy === "string" ||
        typeof parsed.layoutAdaptation === "string"
      ) {
        const fallback = buildDeterministicCompositionBrief(input);
        return {
          subjectAnatomy:
            typeof parsed.subjectAnatomy === "string" &&
            parsed.subjectAnatomy.trim()
              ? parsed.subjectAnatomy.trim().slice(0, 300)
              : fallback.subjectAnatomy,
          safeTypographyZone:
            typeof parsed.safeTypographyZone === "string" &&
            parsed.safeTypographyZone.trim()
              ? parsed.safeTypographyZone.trim().slice(0, 300)
              : fallback.safeTypographyZone,
          antiOcclusionStrategy:
            typeof parsed.antiOcclusionStrategy === "string" &&
            parsed.antiOcclusionStrategy.trim()
              ? parsed.antiOcclusionStrategy.trim().slice(0, 300)
              : fallback.antiOcclusionStrategy,
          layoutAdaptation:
            typeof parsed.layoutAdaptation === "string" &&
            parsed.layoutAdaptation.trim()
              ? parsed.layoutAdaptation.trim().slice(0, 300)
              : fallback.layoutAdaptation,
          source: "ai-dynamic",
        };
      }
    } catch {
      // JSON parse falhou, prossegue para síntese textual
    }
  }

  // Se não foi JSON estruturado, utiliza o texto gerado como adaptação com fallback nos demais
  const fallback = buildDeterministicCompositionBrief(input);
  const truncatedSummary = cleanedText.replace(/[\r\n]+/g, " ").slice(0, 350);

  return {
    subjectAnatomy: fallback.subjectAnatomy,
    safeTypographyZone: fallback.safeTypographyZone,
    antiOcclusionStrategy: fallback.antiOcclusionStrategy,
    layoutAdaptation: truncatedSummary || fallback.layoutAdaptation,
    source: "ai-dynamic",
  };
}

function buildPlannerPromptContents(
  input: PromptEngineInput,
): Array<string | InlineDataPart> {
  const segmentConfig =
    SEGMENT_ART_DIRECTIVES[input.businessSegment] ??
    SEGMENT_ART_DIRECTIVES.supermarket;

  const isStory = input.targetAspectRatio === "story";
  const formatStr = isStory
    ? "Story / Status 9:16 vertical"
    : "Feed 4:5 vertical";

  const instructions = `
Você é um Diretor de Arte Especialista em Layout e Tipografia Publicitária.
Sua missão é atuar como Planejador Criativo (Etapa 1) para diagnosticar a anatomia visual e determinar a zona segura onde os textos serão posicionados em 1º PLANO ABSOLUTO sem serem cobertos por personagens ou produtos.

DADOS DA OFERTA:
- Segmento: ${segmentConfig.segmentTitle}
- Estabelecimento: "${input.businessName}"
- Título da Oferta: "${input.offerTitle}"
- Preço: "${input.promoPrice || "Institucional sem preço"}"
- Formato: ${formatStr}
- Possui Foto do Produto: ${input.productImageDataUrl ? "Sim" : "Não"}
- Possui Imagem de Referência: ${input.referenceImageDataUrl ? "Sim" : "Não"}

INVARIANTE CRÍTICA:
Jamais permita que texto ou títulos fiquem posicionados atrás do rosto, cabeça, ombros ou corpo de personagens ou produtos.
Determine onde o sujeito ficará e onde o texto terá respiro livre e 100% visível em 1º plano.

Retorne EXCLUSIVAMENTE um objeto JSON com o seguinte formato:
{
  "subjectAnatomy": "descrição concisa da posição e proporção do sujeito/produto",
  "safeTypographyZone": "área livre para o título e textos sem corte",
  "antiOcclusionStrategy": "estratégia específica para manter o texto 100% na frente sem sobreposição",
  "layoutAdaptation": "adaptação visual recomendada para o formato ${formatStr}"
}
`.trim();

  const parts: Array<string | InlineDataPart> = [instructions];

  if (input.productImageDataUrl) {
    const parsed = parseDataUrl(input.productImageDataUrl);
    if (parsed) {
      parts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
      parts.push(
        "FOTO DO PRODUTO: Analise a geometria e proporções deste produto.",
      );
    }
  }

  if (input.referenceImageDataUrl) {
    const parsed = parseDataUrl(input.referenceImageDataUrl);
    if (parsed) {
      parts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
      parts.push(
        "IMAGEM DE REFERÊNCIA: Analise o equilíbrio visual e distribuição espacial desta referência.",
      );
    }
  }

  return parts;
}

/**
 * Etapa 1: Planejador Dinâmico que invoca gemini-3.8-flash para gerar o DynamicCompositionBrief.
 * Em caso de erro, timeout ou resposta sem texto, cai silenciosamente para o fallback determinístico.
 */
export async function planDynamicCompositionBrief(
  input: PromptEngineInput,
  options?: DynamicPromptCompileOptions,
): Promise<DynamicCompositionBrief> {
  const client = options?.client;
  if (!client || typeof client.models?.generateContent !== "function") {
    return buildDeterministicCompositionBrief(input);
  }

  const model =
    options?.model ||
    process.env.GEMINI_PROMPT_MODEL ||
    serverEnv.GEMINI_PROMPT_MODEL ||
    DEFAULT_GEMINI_PROMPT_MODEL;

  const timeoutMs = options?.timeoutMs ?? DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS;

  try {
    const contents = buildPlannerPromptContents(input);

    const response = await callWithTimeout(
      client.models.generateContent({
        model,
        contents,
        config: {
          responseModalities: ["text"],
          maxOutputTokens: 400,
          temperature: 0.2,
        },
      }),
      timeoutMs,
    );

    const rawText = extractTextFromResponse(response);
    if (!rawText || rawText.trim().length === 0) {
      log.info(
        "Resposta do planejador dinâmico sem conteúdo de texto; aplicando fallback determinístico.",
      );
      return buildDeterministicCompositionBrief(input);
    }

    return parseOrExtractBrief(rawText, input);
  } catch (error) {
    log.warn(
      "Falha ou timeout no planejador dinâmico; aplicando fallback gracioso.",
      { error },
    );
    return buildDeterministicCompositionBrief(input);
  }
}
