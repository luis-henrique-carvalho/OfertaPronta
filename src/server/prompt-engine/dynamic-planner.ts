import { serverEnv } from "@/config/server-env";
import {
  DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS,
  DEFAULT_MASTER_PROMPT_TIMEOUT_MS,
  DEFAULT_GEMINI_PROMPT_MODEL,
  type CompositionArchetype,
  type DynamicCompositionBrief,
  type DynamicEditPlanResult,
  type DynamicPromptCompileOptions,
  type EditIntentMode,
  type InlineDataPart,
  type PromptEngineInput,
  type PromptPlannerGenerateResponse,
} from "./types";
import {
  isReferenceDrivenMode,
  parseDataUrl,
  resolveIntentDirective,
  resolvePresetAndBlueprint,
  SEGMENT_ART_DIRECTIVES,
} from "./art-direction-blueprints";
import { detectEditIntentMode } from "./edit-prompt-compiler";
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
  _input: PromptEngineInput,
): CompositionArchetype | undefined {
  return undefined;
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
  fallback?: CompositionArchetype,
): CompositionArchetype | undefined {
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
  const fallbackArchetype = fallback.compositionArchetype;
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
    authoredMasterPrompt: cleanedText,
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
        "FOTO DO PRODUTO: Analise a geometria, proporções e detalhes reais deste produto para descrevê-lo com máxima fidelidade no centro da composição.",
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
        "IMAGEM DE REFERÊNCIA: Analise e extraia 100% da atmosfera, iluminação, paleta de cores e distribuição espacial desta referência.",
      );
    }
  }

  if (input.logoImageDataUrl) {
    const parsed = parseDataUrl(input.logoImageDataUrl);
    if (parsed) {
      parts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
      parts.push(
        "LOGOTIPO DA LOJA FORNECIDO: Incorpore a identidade deste logotipo no topo do anúncio.",
      );
    }
  }
}

function buildAuthorPricingDirective(input: PromptEngineInput): string {
  const hasPrice = Boolean(
    input.promoPrice && input.promoPrice.trim().length > 0,
  );
  if (hasPrice) {
    return input.originalPrice?.trim()
      ? `- Preço em Destaque Promocional Máximo: Exibir de forma chamativa em badge de alto contraste "De ${input.originalPrice.trim()} Por ${input.promoPrice?.trim()}", garantindo que "${input.promoPrice?.trim()}" seja dominante e de leitura instantânea.`
      : `- Preço em Destaque Promocional Máximo: Exibir com grande destaque e contraste o valor promocional "${input.promoPrice?.trim()}" em badge/selo comercial de impacto.`;
  }
  return `- INVARIANTE CRÍTICA DE ANÚNCIO SEM PREÇO (SUPRESSÃO ESTRITA DE VALORES MONETÁRIOS):
Este anúncio NÃO possui preço informado. É TERMINANTEMENTE PROIBIDO inventar valores numéricos, inserir "R$ 0,00", cifras ou símbolos "R$".
MANTENHA 100% DA AGRESSIVIDADE E DO APELO PROMOCIONAL substituindo o preço por um selo gráfico de alta conversão como "OFERTA ESPECIAL!", "EDIÇÃO LIMITADA!", "CONDIÇÃO IMPERDÍVEL!" ou "NOVIDADE EXCLUSIVA!".`;
}

function buildAuthorStyleDirective(
  input: PromptEngineInput,
  segmentConfig: (typeof SEGMENT_ART_DIRECTIVES)[keyof typeof SEGMENT_ART_DIRECTIVES],
): string {
  if (isReferenceDrivenMode(input)) {
    return `
MODO REFERENCE-DRIVEN (REPLICAÇÃO DA IMAGEM DE REFERÊNCIA ANEXA):
- Extraia 100% da paleta cromática, iluminação, composição espacial, texturas de fundo e tipografia da IMAGEM DE REFERÊNCIA anexa.
- PROIBIÇÃO ABSOLUTA DE CÓDIGOS HEX: É expressamente proibido citar códigos hexadecimais. Descreva as tonalidades com riqueza descritiva sensorial.
- PROIBIÇÃO DE NOMES DE PRESETS EXTERNOS: Não mencione nomes técnicos de estilos ou presets.
`.trim();
  }

  const { preset } = resolvePresetAndBlueprint(
    input.businessSegment,
    input.stylePresetId,
  );
  return `
ESTILO VISUAL SELECIONADO: "${preset.label}"
- Inspiração Estética: ${preset.description}
- Direção de Arte do Segmento: ${segmentConfig.visualStyle}
- Clima e Atmosfera: ${segmentConfig.atmosphere}
`.trim();
}

export function buildMasterPromptAuthorContents(
  input: PromptEngineInput,
): Array<string | InlineDataPart> {
  const segmentConfig =
    SEGMENT_ART_DIRECTIVES[input.businessSegment] ??
    SEGMENT_ART_DIRECTIVES.supermarket;

  const isStory = input.targetAspectRatio === "story";
  const formatStr = isStory
    ? "Story / Status 9:16 vertical (1080x1920) com SAFE ZONE OBRIGATÓRIA (15% superior e 15% inferior livres de textos)"
    : "Feed 4:5 vertical (1080x1350)";

  const pricingDirective = buildAuthorPricingDirective(input);
  const styleContextDirective = buildAuthorStyleDirective(input, segmentConfig);

  const customInstructionsDirective = input.customStyleInstructions?.trim()
    ? `\n- Instruções Personalizadas do Cliente: "${input.customStyleInstructions.trim()}"`
    : "";

  const ctaDirective = input.callToAction?.trim()
    ? `\n- Chamada para Ação (CTA): "${input.callToAction.trim()}" renderizada em selo com acabamento gráfico rico (pincelada grunge brush stroke, carimbo artesanal ou fita vibrante com textura real).`
    : "";

  const whatsappDirective = input.whatsapp?.trim()
    ? `\n- Contato / WhatsApp: "${input.whatsapp.trim()}" formatado discretamente no rodapé com ícone temático de canal de atendimento.`
    : "";

  const intentDirective = input.cardIntent
    ? `\n- Objetivo do Card: ${resolveIntentDirective(input.cardIntent, input.customIntentText)}`
    : "";

  const instructions = `
Você é um Diretor de Arte Publicitário Sênior de Agência e Especialista em Design Gráfico de Alta Conversão.
Sua missão é REDIGIR 100% DO PROMPT VISUAL FINAL em português para o gerador de imagem (3 a 5 parágrafos densos, coesos e ricamente detalhados), atuando como o autor único da direção de arte deste anúncio comercial.

DADOS DA OFERTA ANUNCIADA:
- Segmento: ${segmentConfig.segmentTitle}
- Estabelecimento / Marca: "${input.businessName}"
- Título da Oferta / Produto: "${input.offerTitle}"
- Formato do Anúncio: ${formatStr}
${pricingDirective}${ctaDirective}${whatsappDirective}${intentDirective}${customInstructionsDirective}

${styleContextDirective}

DIRETRIZES FUNDAMENTAIS DE COMPOSIÇÃO VISUAL (AUTORIA DIRETA DO PROMPT):

1. CENA ÚNICA TRIDIMENSIONAL CONTÍNUA (FULL-BLEED, PROIBIDO DIVISÃO 50/50 CHAPADA):
- Componha o card como uma única cena contínua, tridimensional e imersiva de ponta a ponta (full-bleed).
- Superfície contínua de apoio (madeira rústica, mármore nobre, ardósia, aço escovado ou toalha de linho).
- Elementos de apoio em primeiro plano criando profundidade de campo óptica Z natural e sombras de contato realistas.
- Cenário de fundo autêntico e ambientado para o segmento ${segmentConfig.segmentTitle} em elegante desfoque óptico (bokeh suave), garantindo atmosfera rica e profissional.
- Área de penumbra orgânica ou leve gradiente natural de luz para acomodar perfeitamente os textos sem interferências visuais.
- PROIBIÇÃO EXPRESSA: É TERMINANTEMENTE PROIBIDO criar divisão 50/50 chapada por linha reta artificial, paredes ou blocos lisos de cor sólida dividindo o anúncio ao meio. A cena deve ser visualmente integrada e tridimensional.

2. DETALHAMENTO SENSORIAL E PRODUCT/FOOD STYLING HIPER-REALISTA:
- Sujeito Hero imponente anunciado: Descreva o produto ou serviço "${input.offerTitle}" com proporções harmônicas, acabamento comercial de alto padrão e apelo visual irresistível.
- Detalhe minuciosamente os atributos táteis específicos do produto "${input.offerTitle}" (texturas físicas reais, frescor, apetite, suculência, vapor sutil ou acabamento de alto nível condizente com a oferta).
- Simule captura fotográfica comercial profissional com lente 85mm f/2.0, profundidade de campo ótica natural e iluminação de recorte dourada (rim light) destacando contornos e texturas.
- PROIBIÇÃO DE CÓDIGOS HEX: Não despeje códigos HEX de UI como fundo chapado. Descreva a iluminação e as cores naturais da cena.

3. TIPOGRAFIA PUBLICITÁRIA EXPRESSIVA MULTI-ESTILO (ZERO OCLUSÃO EM 1º PLANO):
- Assinatura da Loja no Topo: Apresente "${input.businessName}" no topo como um emblema/insígnia artesanal elegante com pequeno ícone temático desenhado à mão (ou preserve fielmente o logotipo fornecido caso esteja anexo).
- Título da Oferta ("${input.offerTitle}"): Quebrado em múltiplos níveis com contraste tipográfico impactante — combinar fonte display condensada robusta e imponente com leve textura tátil + lettering brush script / caligráfico dinâmico inclinado nas palavras-chave de sabor ou apelo principal em cor de destaque vibrante + pequenos conectores pintados à mão.
- Micro-copy de Atributos Sensoriais: Imediatamente abaixo do título, inclua uma linha curta com exatamente 3 atributos sensoriais em caixa alta separados por "•" adaptados ao produto anunciado.
- Selo de Chamada / CTA: Faixa com acabamento de pincelada rústica (grunge brush stroke), carimbo artesanal ou fita gráfica rica.
- REGRA INEGOCIÁVEL DE ZERO OCLUSÃO: Todos os textos, títulos, valores e selos DEVEM estar 100% em primeiro plano absoluto (foreground), nunca posicionados atrás do produto, personagem ou modelo.

INSTRUÇÕES FINAIS DE FORMATO:
Redija DIRETAMENTE o texto final do prompt de imagem em português (3 a 5 parágrafos densos e coesos), sem introduções, sem saudações e sem envolver em JSON. O texto gerado será enviado diretamente ao renderizador de imagem.
`.trim();

  const parts: Array<string | InlineDataPart> = [instructions];
  appendPlannerImageParts(parts, input);
  return parts;
}

/**
 * Etapa 1: Planejador Dinâmico / Autor de Master Prompt que invoca gemini-3.8-flash.
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

  const timeoutMs = options?.timeoutMs ?? DEFAULT_MASTER_PROMPT_TIMEOUT_MS;

  try {
    const contents = buildMasterPromptAuthorContents(input);

    const response = await callWithTimeout(
      client.models.generateContent({
        model,
        contents,
        config: {
          responseModalities: ["text"],
          maxOutputTokens: 4096,
          temperature: 0.4,
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
      "Master prompt / planejamento retornado pelo Gemini 3.8 Flash (Etapa 1):",
      {
        model,
        hasAuthoredPrompt: Boolean(brief.authoredMasterPrompt),
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

function appendEditPlannerImageParts(
  parts: Array<string | InlineDataPart>,
  input: PromptEngineInput,
): void {
  if (input.baseCardImageDataUrl) {
    const parsed = parseDataUrl(input.baseCardImageDataUrl);
    if (parsed) {
      parts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
      parts.push(
        "IMAGEM ATUAL DO CARD: Analise a arte atual que o cliente deseja editar.",
      );
    }
  }

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
        "FOTO DO PRODUTO REAL FORNECIDA: Analise este produto para garantir fidelidade visual.",
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
        "IMAGEM DE REFERÊNCIA: Extraia atmosfera, iluminação e cores.",
      );
    }
  }

  if (input.logoImageDataUrl) {
    const parsed = parseDataUrl(input.logoImageDataUrl);
    if (parsed) {
      parts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      });
      parts.push(
        "LOGOTIPO DA LOJA FORNECIDO: Mantenha fidelidade à identidade visual.",
      );
    }
  }
}

function buildEditAuthorInstructions(input: PromptEngineInput): string {
  const segmentConfig =
    SEGMENT_ART_DIRECTIVES[input.businessSegment] ??
    SEGMENT_ART_DIRECTIVES.supermarket;

  const isStory = input.targetAspectRatio === "story";
  const formatStr = isStory
    ? "Story / Status 9:16 vertical (1080x1920) com SAFE ZONE OBRIGATÓRIA (15% superior e 15% inferior livres de textos)"
    : "Feed 4:5 vertical (1080x1350)";

  const pricingDirective = buildAuthorPricingDirective(input);
  const styleContextDirective = buildAuthorStyleDirective(input, segmentConfig);

  const customInstructions =
    input.customStyleInstructions?.trim() ||
    "Ajuste padrão solicitado pelo cliente";

  const ctaDirective = input.callToAction?.trim()
    ? `\n- Chamada para Ação (CTA): "${input.callToAction.trim()}"`
    : "";

  const whatsappDirective = input.whatsapp?.trim()
    ? `\n- Contato / WhatsApp: "${input.whatsapp.trim()}"`
    : "";

  return `
Você é um Diretor de Arte Sênior e Especialista em Design Gráfico Publicitário.
Sua missão é atuar como Diretor de Arte e Redator de Edição Criativa (Etapa 1) para interpretar uma solicitação de ajuste feita pelo cliente sobre um card publicitário já existente e redigir o novo Master Prompt em português para o gerador de imagem.

DADOS DO CARD ATUAL:
- Segmento: ${segmentConfig.segmentTitle}
- Estabelecimento: "${input.businessName}"
- Título da Oferta: "${input.offerTitle}"
- Formato do Anúncio: ${formatStr}
${pricingDirective}${ctaDirective}${whatsappDirective}

${styleContextDirective}

AJUSTE SOLICITADO PELO CLIENTE:
"${customInstructions}"

INSTRUÇÕES CRÍTICAS DE CLASSIFICAÇÃO:
Classifique a intenção da edição em exatamente um dos dois modos:
1. "RECOMPOSE": Escolha este modo se o cliente deseja alterar layout, reorganizar ou mover elementos, centralizar o produto, dar destaque ou foco na foto/produto, aumentar tamanho do produto, trocar cenário ou plano de fundo, alterar cores/estilo, reposicionar textos ou desobstruir elementos. No modo RECOMPOSE a IA tem autorização para reposicionar elementos e quebrar o layout anterior.
2. "SURGICAL": Escolha este modo SOMENTE se for uma alteração pontual e estritamente localizada de conteúdo textual (ex.: mudar telefone, corrigir digitação no título, mudar o valor do preço), mantendo 100% de todo o layout e posições inalterados.

DIRETRIZ DE AUTORIA DO MASTER PROMPT:
- Se modo for "RECOMPOSE": Redija no campo "authoredMasterPrompt" um NOVO Master Prompt completo (3 a 5 parágrafos densos e coesos em português) para o gerador de imagem, reestruturando a cena de forma contínua, tridimensional e imersiva (full-bleed, sem divisões 50/50 chapadas), destacando o produto anunciado "${input.offerTitle}" com riqueza sensorial e posicionando a tipografia expressiva em 1º plano absoluto (zero oclusão).
- Se modo for "SURGICAL": Redija no campo "authoredMasterPrompt" uma diretriz concisa de edição cirúrgica instruindo a manter 100% da imagem base inalterada e modificar exclusivamente o texto/preço solicitado.

Se o modo for "RECOMPOSE", você pode opcionalmente sugerir um "compositionArchetype" adequado:
("split-editorial" | "hero-bottom-staged" | "diagonal-dynamic" | "overhead-flatlay" | "center-showcase" | "minimal-negative-space").

Retorne EXCLUSIVAMENTE um objeto JSON no formato:
{
  "mode": "RECOMPOSE" | "SURGICAL",
  "reason": "breve justificativa da decisão",
  "compositionArchetype": "center-showcase" | "split-editorial" | "hero-bottom-staged" | "diagonal-dynamic" | "overhead-flatlay" | "minimal-negative-space" | null,
  "authoredMasterPrompt": "Texto completo do prompt em português..."
}
`.trim();
}

export function buildMasterEditPromptAuthorContents(
  input: PromptEngineInput,
): Array<string | InlineDataPart> {
  const parts: Array<string | InlineDataPart> = [
    buildEditAuthorInstructions(input),
  ];
  appendEditPlannerImageParts(parts, input);
  return parts;
}

export const buildPlannerEditPromptContents =
  buildMasterEditPromptAuthorContents;

function parseOrExtractEditPlan(
  rawText: string,
  fallbackMode: EditIntentMode,
): DynamicEditPlanResult {
  const jsonMatch =
    rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/\{[\s\S]*\}/);

  const jsonCandidate = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : rawText;

  try {
    const parsed = JSON.parse(jsonCandidate) as {
      mode?: string;
      reason?: string;
      compositionArchetype?: string;
      authoredMasterPrompt?: string;
    };

    const mode =
      parsed.mode === "RECOMPOSE" || parsed.mode === "SURGICAL"
        ? parsed.mode
        : fallbackMode;

    const VALID_ARCHETYPES: CompositionArchetype[] = [
      "split-editorial",
      "hero-bottom-staged",
      "diagonal-dynamic",
      "overhead-flatlay",
      "center-showcase",
      "minimal-negative-space",
    ];

    const archetype = VALID_ARCHETYPES.includes(
      parsed.compositionArchetype as CompositionArchetype,
    )
      ? (parsed.compositionArchetype as CompositionArchetype)
      : undefined;

    const authoredMasterPrompt =
      typeof parsed.authoredMasterPrompt === "string" &&
      parsed.authoredMasterPrompt.trim().length > 0
        ? parsed.authoredMasterPrompt.trim()
        : undefined;

    return {
      mode,
      compositionArchetype: archetype,
      authoredMasterPrompt,
      reason: parsed.reason,
      source: "ai-dynamic",
    };
  } catch {
    if (/\bRECOMPOSE\b/i.test(rawText)) {
      return { mode: "RECOMPOSE", source: "ai-dynamic" };
    }
    if (/\bSURGICAL\b/i.test(rawText)) {
      return { mode: "SURGICAL", source: "ai-dynamic" };
    }
    return { mode: fallbackMode, source: "deterministic-fallback" };
  }
}

/**
 * Planejador Dinâmico de Edição: Interpreta o pedido de ajuste pós-compra via Gemini 3.8 Flash,
 * determinando se a alteração requer RECOMPOSE (reposicionamento/estilo) ou SURGICAL (texto/preço pontual)
 * e gerando o authoredMasterPrompt autoral.
 */
export async function planDynamicEditIntent(
  input: PromptEngineInput,
  options?: DynamicPromptCompileOptions,
): Promise<DynamicEditPlanResult> {
  const fallbackMode = detectEditIntentMode({
    customStyleInstructions: input.customStyleInstructions,
  });

  const client = options?.client;
  if (!client || typeof client.models?.generateContent !== "function") {
    return {
      mode: fallbackMode,
      source: "deterministic-fallback",
    };
  }

  const instructions = input.customStyleInstructions?.trim();
  if (!instructions) {
    return {
      mode: fallbackMode,
      source: "deterministic-fallback",
    };
  }

  const model =
    options?.model ||
    process.env.GEMINI_PROMPT_MODEL ||
    serverEnv.GEMINI_PROMPT_MODEL ||
    DEFAULT_GEMINI_PROMPT_MODEL;

  const timeoutMs = options?.timeoutMs ?? DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS;

  try {
    const contents = buildMasterEditPromptAuthorContents(input);

    const response = await callWithTimeout(
      client.models.generateContent({
        model,
        contents,
        config: {
          responseModalities: ["text"],
          maxOutputTokens: 2048,
          temperature: 0.3,
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
        "Resposta vazia no planejador dinâmico de edição; aplicando fallback determinístico.",
      );
      return {
        mode: fallbackMode,
        source: "deterministic-fallback",
      };
    }

    const plan = parseOrExtractEditPlan(rawText, fallbackMode);
    log.info(
      "Interpretação dinâmica de ajuste via Gemini 3.8 Flash (Etapa 1):",
      {
        model,
        rawText,
        plan,
      },
    );
    return plan;
  } catch (error) {
    log.warn(
      "Falha ou timeout no planejador dinâmico de edição; aplicando fallback gracioso.",
      { error },
    );
    return {
      mode: fallbackMode,
      source: "deterministic-fallback",
    };
  }
}
