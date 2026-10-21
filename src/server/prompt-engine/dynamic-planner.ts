import { serverEnv } from "@/config/server-env";
import {
  DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS,
  DEFAULT_GEMINI_PROMPT_MODEL,
  type CompositionArchetype,
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

function resolveDeterministicArchetype(
  input: PromptEngineInput,
): CompositionArchetype {
  const isStory = input.targetAspectRatio === "story";
  if (
    input.businessSegment === "fashion" ||
    input.businessSegment === "beauty-salon"
  ) {
    return "split-editorial";
  }
  if (input.businessSegment === "restaurant" && isStory) {
    return "split-editorial";
  }
  if (input.businessSegment === "pizzeria") {
    return "overhead-flatlay";
  }
  if (input.businessSegment === "supermarket") {
    return isStory ? "hero-bottom-staged" : "diagonal-dynamic";
  }
  return isStory ? "hero-bottom-staged" : "center-showcase";
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

  const compositionArchetype = resolveDeterministicArchetype(input);

  return {
    compositionArchetype,
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

const VALID_ARCHETYPES = new Set<CompositionArchetype>([
  "split-editorial",
  "hero-bottom-staged",
  "diagonal-dynamic",
  "overhead-flatlay",
  "center-showcase",
  "minimal-negative-space",
]);

function extractValidArchetype(
  rawArchetype: unknown,
  fallback: CompositionArchetype,
): CompositionArchetype {
  if (
    typeof rawArchetype === "string" &&
    VALID_ARCHETYPES.has(rawArchetype as CompositionArchetype)
  ) {
    return rawArchetype as CompositionArchetype;
  }
  return fallback;
}

function buildBriefFromParsedJson(
  parsed: Record<string, unknown>,
  fallback: DynamicCompositionBrief,
): DynamicCompositionBrief {
  const fallbackArchetype = fallback.compositionArchetype ?? "center-showcase";
  const compositionArchetype = extractValidArchetype(
    parsed.compositionArchetype,
    fallbackArchetype,
  );

  return {
    compositionArchetype,
    subjectAnatomy:
      typeof parsed.subjectAnatomy === "string" && parsed.subjectAnatomy.trim()
        ? parsed.subjectAnatomy.trim().slice(0, 500)
        : fallback.subjectAnatomy,
    safeTypographyZone:
      typeof parsed.safeTypographyZone === "string" &&
      parsed.safeTypographyZone.trim()
        ? parsed.safeTypographyZone.trim().slice(0, 500)
        : fallback.safeTypographyZone,
    antiOcclusionStrategy:
      typeof parsed.antiOcclusionStrategy === "string" &&
      parsed.antiOcclusionStrategy.trim()
        ? parsed.antiOcclusionStrategy.trim().slice(0, 500)
        : fallback.antiOcclusionStrategy,
    layoutAdaptation:
      typeof parsed.layoutAdaptation === "string" &&
      parsed.layoutAdaptation.trim()
        ? parsed.layoutAdaptation.trim().slice(0, 500)
        : fallback.layoutAdaptation,
    source: "ai-dynamic",
  };
}

function parseOrExtractBrief(
  rawText: string,
  input: PromptEngineInput,
): DynamicCompositionBrief {
  const isRefDriven = isReferenceDrivenMode(input);
  const cleanedText = isRefDriven
    ? sanitizeTextForReferenceMode(rawText)
    : rawText.trim();
  const fallback = buildDeterministicCompositionBrief(input);

  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      if (
        typeof parsed.compositionArchetype === "string" ||
        typeof parsed.subjectAnatomy === "string" ||
        typeof parsed.safeTypographyZone === "string" ||
        typeof parsed.antiOcclusionStrategy === "string" ||
        typeof parsed.layoutAdaptation === "string"
      ) {
        return buildBriefFromParsedJson(parsed, fallback);
      }
    } catch {
      // JSON parse falhou, prossegue para síntese textual
    }
  }

  const truncatedSummary = cleanedText.replace(/[\r\n]+/g, " ").slice(0, 350);

  return {
    compositionArchetype: fallback.compositionArchetype,
    subjectAnatomy: fallback.subjectAnatomy,
    safeTypographyZone: fallback.safeTypographyZone,
    antiOcclusionStrategy: fallback.antiOcclusionStrategy,
    layoutAdaptation: truncatedSummary || fallback.layoutAdaptation,
    source: "ai-dynamic",
  };
}

function appendPlannerImageParts(
  parts: Array<string | InlineDataPart>,
  input: PromptEngineInput,
): void {
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
Você é um Diretor de Arte Sênior Especialista em Design Gráfico e Layout Publicitário.
Sua missão é atuar como Planejador Criativo (Etapa 1) para:
1. Escolher o ARQUÉTIPO DE COMPOSIÇÃO ("compositionArchetype") mais adequado e esteticamente envolvente para esta oferta específica (evitando layouts estáticos ou repetitivos).
2. Determinar a zona segura e anatomia do sujeito para que os textos fiquem em 1º PLANO ABSOLUTO sem qualquer oclusão.

DADOS DA OFERTA:
- Segmento: ${segmentConfig.segmentTitle}
- Estabelecimento: "${input.businessName}"
- Título da Oferta: "${input.offerTitle}"
- Preço: "${input.promoPrice || "Institucional sem preço"}"
- Formato: ${formatStr}
- Possui Foto do Produto: ${input.productImageDataUrl ? "Sim" : "Não"}
- Possui Imagem de Referência: ${input.referenceImageDataUrl ? "Sim" : "Não"}

ARQUÉTIPOS DE COMPOSIÇÃO DISPONÍVEIS:
- "split-editorial": Divisão em 2 zonas (coluna de texto limpa à esquerda 40-50% + fotografia hero à direita). Ideal para produtos com texturas ricas (moda, cortes nobres de carne, smash burger, pratos assinados, estética e novidades).
- "hero-bottom-staged": Produto hero majestoso na base inferior (45%) com sombra de contato realista; terço superior limpo para títulos grandes. Perfeito para lanches com combos, garrafas, cosméticos e formato Story 9:16.
- "diagonal-dynamic": Composição em ângulo dinâmico (30-45°) gerando velocidade e energia promocional. Ideal para promoções de varejo, delivery rápido, fatias de pizza e senso de urgência.
- "overhead-flatlay": Visão superior zenital (90° bird's eye). Ideal para mesas fartas, pizzas inteiras, combos com vários itens, cafés e kits organizados.
- "center-showcase": Hero imponente centralizado com iluminação 360° de estúdio comercial. Ideal para produtos solo icônicos, bolos e joias.
- "minimal-negative-space": 60%+ de espaço negativo com atmosfera limpa e minimalista. Ideal para serviços premium, barbearia clássica, clínicas e marcas de luxo.

INVARIANTE CRÍTICA DE ANTI-OCLUSÃO:
Jamais permita que texto ou títulos fiquem posicionados atrás do rosto, cabeça, ombros ou corpo de personagens ou produtos.
Determine onde o sujeito ficará e onde o texto terá respiro livre e 100% visível em 1º plano.

Retorne EXCLUSIVAMENTE um objeto JSON com o seguinte formato:
{
  "compositionArchetype": "split-editorial" | "hero-bottom-staged" | "diagonal-dynamic" | "overhead-flatlay" | "center-showcase" | "minimal-negative-space",
  "subjectAnatomy": "descrição concisa da posição e proporção do sujeito/produto",
  "safeTypographyZone": "área livre para o título e textos sem corte",
  "antiOcclusionStrategy": "estratégia específica para manter o texto 100% na frente sem sobreposição",
  "layoutAdaptation": "adaptação visual recomendada para o formato ${formatStr}"
}
`.trim();

  const parts: Array<string | InlineDataPart> = [instructions];
  appendPlannerImageParts(parts, input);
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
          maxOutputTokens: 600,
          temperature: 0.2,
          thinkingConfig: {
            thinkingLevel: "low",
          },
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

    const brief = parseOrExtractBrief(rawText, input);
    log.info(
      "Planejamento criativo retornado pelo Gemini 3.8 Flash (Etapa 1):",
      {
        model,
        rawText,
        brief,
      },
    );
    return brief;
  } catch (error) {
    log.warn(
      "Falha ou timeout no planejador dinâmico; aplicando fallback gracioso.",
      { error },
    );
    return buildDeterministicCompositionBrief(input);
  }
}
