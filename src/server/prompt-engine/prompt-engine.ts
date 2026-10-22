import { serverEnv } from "@/config/server-env";
import { createServerLogger } from "@/server/logger";
import {
  type PromptEngineInput,
  type PromptEngineOptions,
  type PromptEngineCompileResult,
  type InlineDataPart,
  type EditStrategy,
  DEFAULT_PROMPT_ENGINE_TIMEOUT_MS,
  editPlanSchema,
} from "./types";
import {
  UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION,
  CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION,
} from "./system-instructions";

const log = createServerLogger("prompt-engine");

/**
 * Converte Data URL em InlineDataPart para a API do Gemini.
 */
export function parseDataUrl(dataUrl?: string | null): InlineDataPart | null {
  if (!dataUrl || typeof dataUrl !== "string") {
    return null;
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !match[1] || !match[2]) {
    return null;
  }

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

/**
 * Identifica se a geração é puramente guiada por referência estética (sem preset de catálogo conflitante e sem foto de produto).
 */
export function isReferenceDrivenMode(
  input: Partial<PromptEngineInput>,
): boolean {
  if (
    !input.referenceImageDataUrl ||
    typeof input.referenceImageDataUrl !== "string"
  ) {
    return false;
  }
  if (!input.referenceImageDataUrl.trim()) {
    return false;
  }

  // Se houver foto do produto real, a geração é orientada ao produto real integrado ao cenário, e não pura referência estética
  if (
    input.productImageDataUrl &&
    typeof input.productImageDataUrl === "string" &&
    input.productImageDataUrl.trim().length > 0
  ) {
    return false;
  }

  const presetId = input.stylePresetId?.trim();
  if (
    !presetId ||
    presetId === "reference-image" ||
    presetId === "reference-style"
  ) {
    return true;
  }

  return false;
}

/**
 * Resolve instruções de estilo para regeneração evitando acúmulo infinito de rodadas anteriores.
 */
export function resolveRegenerationStyleInstructions(
  previousInstructions: string | null | undefined,
  newAdjustment: string | null | undefined,
  colorPaletteOrOptions?:
    | string
    | null
    | {
        presetChanged?: boolean;
        newStylePresetId?: string | null;
        colorPalette?: string | null;
      },
): string {
  let presetChanged = false;
  let colorPalette: string | null | undefined = undefined;

  if (
    typeof colorPaletteOrOptions === "string" ||
    colorPaletteOrOptions === null
  ) {
    colorPalette = colorPaletteOrOptions ?? undefined;
  } else if (
    typeof colorPaletteOrOptions === "object" &&
    colorPaletteOrOptions !== null
  ) {
    presetChanged = Boolean(colorPaletteOrOptions.presetChanged);
    colorPalette = colorPaletteOrOptions.colorPalette ?? undefined;
  }

  // Remove qualquer menção antiga a "Ajuste solicitado pelo..." ou "Paleta de cores..." para evitar acúmulo de rodadas passadas
  let baseInstructions = previousInstructions?.trim() || "";
  baseInstructions = baseInstructions
    .replace(/\.?\s*Ajuste solicitado pelo (?:cliente|usuário):.*$/gi, "")
    .replace(/\.?\s*Paleta de cores:.*$/gi, "")
    .replace(/\.\s*\./g, ".")
    .replace(/^\.\s*/, "")
    .replace(/\s*\.$/, "")
    .trim();

  const adjustmentSegments: string[] = [];

  if (colorPalette?.trim()) {
    adjustmentSegments.push(`Paleta de cores: ${colorPalette.trim()}`);
  }

  if (presetChanged) {
    adjustmentSegments.push(
      "Reestruturar layout e estilo visual aplicando integralmente o novo preset selecionado",
    );
  }

  if (newAdjustment?.trim()) {
    adjustmentSegments.push(newAdjustment.trim());
  }

  if (adjustmentSegments.length === 0) {
    return baseInstructions;
  }

  const adjustmentText = `Ajuste solicitado pelo cliente: ${adjustmentSegments.join(". ")}`;
  if (!baseInstructions) {
    return adjustmentText;
  }

  return `${baseInstructions}. ${adjustmentText}`;
}

/**
 * Fallback determinístico puro: constrói 4 parágrafos densos e cinematográficos em português
 * aplicando rigorosamente os 4 Pilares Universais de Direção de Arte Publicitária.
 */
const FALLBACK_SEGMENT_TERMS: Record<
  string,
  {
    ambiance: string;
    surfaces: string;
    sensoryLine: string;
    lighting?: string;
  }
> = {
  fashion: {
    ambiance: "Boutique contemporânea de moda feminina e roupas",
    surfaces:
      "expositor minimalista de design com tecidos nobres e acabamentos acetinados",
    sensoryLine: "ELEGÂNCIA • TENDÊNCIA • EXCLUSIVIDADE",
    lighting: "Luz suave e difusa de janela de estúdio fotográfico",
  },
  supermarket: {
    ambiance:
      "hortifrúti e empório contemporâneo com produtos frescos selecionados",
    surfaces:
      "bancada moderna de empório com respiro visual e acabamento impecável",
    sensoryLine: "SELECIONADO • FRESCO • QUALIDADE",
    lighting:
      "A iluminação comercial nítida, brilhante e convidativa destaca o frescor vibrante dos produtos com cores vivas e alto contraste.",
  },
  "beauty-salon": {
    ambiance: "estúdio de beleza contemporâneo e spa editorial minimalista",
    surfaces: "bancada de mármore claro acetinado com reflexos sutis de vidro",
    sensoryLine: "CUIDADO • BRILHO • ELEGÂNCIA",
    lighting:
      "Luz suave e difusa de janela ampla (high-key daylight) com sombras delicadas e acabamento límpido de revista de luxo.",
  },
  beauty: {
    ambiance: "estúdio de beleza contemporâneo e spa editorial minimalista",
    surfaces: "bancada de mármore claro acetinado com reflexos sutis de vidro",
    sensoryLine: "CUIDADO • BRILHO • ELEGÂNCIA",
    lighting:
      "Luz suave e difusa de janela ampla (high-key daylight) com sombras delicadas e acabamento límpido de revista de luxo.",
  },
  pizzeria: {
    ambiance: "pizzaria artesanal contemporânea e acolhedora",
    surfaces:
      "pá de madeira nobre, pedra refratária e folhas de manjericão fresco",
    sensoryLine: "SABOROSO • CROCANTE • ARTESANAL",
    lighting:
      "A iluminação quente e dourada valoriza a textura do queijo borbulhante e o ponto perfeito da borda com alto apelo de apetite.",
  },
  "burger-shop": {
    ambiance: "steakhouse artesanal e hamburgueria moderna de alto padrão",
    surfaces:
      "pesada tábua de madeira maciça escura com grãos de pimenta e sal grosso",
    sensoryLine: "ARTESANAL • SUCULENTO • CROCANTE",
    lighting:
      "A iluminação de padrão editorial em lente 85mm f/2.0 esculpe as texturas táteis da carne e a cremosidade do queijo com uma luz lateral quente e elegante rim light dourada.",
  },
  burger: {
    ambiance: "steakhouse artesanal e hamburgueria moderna de alto padrão",
    surfaces:
      "pesada tábua de madeira maciça escura com grãos de pimenta e sal grosso",
    sensoryLine: "ARTESANAL • SUCULENTO • CROCANTE",
    lighting:
      "A iluminação de padrão editorial em lente 85mm f/2.0 esculpe as texturas táteis da carne e a cremosidade do queijo com uma luz lateral quente e elegante rim light dourada.",
  },
  restaurant: {
    ambiance:
      "bistrô contemporâneo de alta gastronomia com atmosfera acolhedora",
    surfaces: "mesa de madeira escura polida com louças de cerâmica artesanal",
    sensoryLine: "SABOROSO • REFINADO • GOURMET",
  },
  "local-retail": {
    ambiance:
      "boutique e showroom de design moderno com iluminação de destaque",
    surfaces:
      "podium geométrico com acabamento fosco e superfícies arquitetônicas limpas",
    sensoryLine: "PREMIUM • TENDÊNCIA • EXCLUSIVO",
  },
  retail: {
    ambiance:
      "boutique e showroom de design moderno com iluminação de destaque",
    surfaces:
      "podium geométrico com acabamento fosco e superfícies arquitetônicas limpas",
    sensoryLine: "PREMIUM • TENDÊNCIA • EXCLUSIVO",
  },
};

function resolveFallbackIntentClause(
  cardIntent?: string | null,
  customIntentText?: string | null,
): string {
  const snippets: Record<string, string> = {
    promo: "com apelo promocional marcante e alto contraste no preço",
    "new-arrival":
      "com atmosfera de sofisticação e apresentação de novidade exclusiva",
    "special-date": "com ambientação temática para data comemorativa",
    announcement: "com clareza institucional destacando anúncio ou inauguração",
    schedule:
      "com excelente legibilidade informando a programação ou horário de atendimento",
    custom: customIntentText
      ? `com proposta personalizada focada em ${customIntentText}`
      : "com proposta personalizada sob medida",
  };

  return cardIntent && snippets[cardIntent] ? ` ${snippets[cardIntent]}` : "";
}

function buildFallbackPriceClause(input: PromptEngineInput): string {
  const promoPriceTrimmed = input.promoPrice?.trim();
  const hasPromoPrice = Boolean(
    promoPriceTrimmed && promoPriceTrimmed.length > 0,
  );

  if (hasPromoPrice && promoPriceTrimmed) {
    const originalPriceMention = input.originalPrice?.trim()
      ? ` com menção ao preço anterior de ${input.originalPrice.trim()}`
      : "";
    return `Destaca-se um badge promocional de preço de altíssimo impacto visual exibindo em números nítidos e gigantes o valor promocional de "${promoPriceTrimmed}"${originalPriceMention}, acompanhado por uma faixa de destaque contendo a chamada para ação "${input.callToAction?.trim() || "Aproveite agora!"}"`;
  }

  return `Tratando-se de uma peça institucional ou sem indicação de preço, a composição dispensa badges de preço numéricos e valores monetários, valorizando um elegante selo editorial de chamada para ação com o texto "${input.callToAction?.trim() || "Consulte opções e saiba mais"}"`;
}

/**
 * Fallback determinístico puro: constrói 4 parágrafos densos e cinematográficos em português
 * aplicando rigorosamente os 4 Pilares Universais de Direção de Arte Publicitária.
 */
export function buildFallbackMasterPrompt(input: PromptEngineInput): string {
  const isStory = input.targetAspectRatio === "story";
  const aspectRatioDescription = isStory
    ? "proporção vertical 9:16 (Story/Reels)"
    : "proporção vertical 4:5 (Feed de Instagram)";

  const segmentConfig =
    FALLBACK_SEGMENT_TERMS[input.businessSegment] ??
    FALLBACK_SEGMENT_TERMS.retail;
  const intentClause = resolveFallbackIntentClause(
    input.cardIntent,
    input.customIntentText,
  );

  // Parágrafo 1: Hero Subject e cena tridimensional
  const productPreservation = input.productImageDataUrl
    ? " A identidade física e características do produto original são preservadas com máxima fidelidade e perfeitamente integradas à iluminação do cenário."
    : "";
  const paragraph1 = `Fotografia publicitária comercial de alto padrão para social media em ${aspectRatioDescription}, sem divisão estanque de tela, apresentando uma cena única tridimensional contínua e imersiva de ${segmentConfig.ambiance}${intentClause}. A base da composição é composta por ${segmentConfig.surfaces}, estendendo-se harmoniosamente pela largura inferior da imagem com texturas autênticas e ricas em microdetalhes. No centro-direito e avançando com presença visual marcante e monumental, posiciona-se o Hero Subject comemorativo: ${input.offerTitle}, evidenciando formas impecáveis, acabamento perfeito, materiais vívidos e frescor sensorial absoluto.${productPreservation}`;

  // Parágrafo 2: Iluminação de estúdio adequada ao segmento, safe zone e ajustes
  const storySafeZone = isStory
    ? " Como o formato é vertical 9:16 para Story, a composição preserva rigorosamente 15% no topo e 15% na base totalmente livres de textos e elementos cruciais para não sofrer oclusão pela interface de aplicativos."
    : "";
  const lighting =
    segmentConfig.lighting ??
    "A iluminação comercial nítida e vibrante de estúdio destaca formas e texturas com brilhos especulares elegantes e excelente separação tridimensional do fundo em suave bokeh.";
  const customNote = input.customStyleInstructions?.trim()
    ? ` Especificação visual customizada: ${input.customStyleInstructions.trim()}.`
    : "";
  const editAdjustment = input.regenerationPrompt?.trim()
    ? ` Ajuste prioritário solicitado pelo cliente: "${input.regenerationPrompt.trim()}", reorganizando a cena e os elementos visuais para cumprir fielmente esta solicitação.`
    : "";
  const refNote = input.referenceImageDataUrl
    ? " A atmosfera e paleta de iluminação absorvem a referência estética anexa."
    : "";
  const paragraph2 = `${lighting}${editAdjustment} O quadrante superior esquerdo mergulha em uma penumbra tonal suave de baixa frequência visual e alto contraste, reservada deliberadamente como zona limpa exclusiva para o layout tipográfico em primeiro plano absoluto, garantindo zero colisão e legibilidade cristalina.${customNote}${refNote}${storySafeZone}`;

  // Parágrafo 3: Assinatura e título da oferta em tipografia mista
  const brandName = input.businessName?.trim() || "Estabelecimento";
  const paragraph3 = `Integrado à zona limpa de alto contraste, sobre a área suave sem interferir no produto, posiciona-se o conjunto gráfico e tipográfico publicitário artesanal e refinado. No topo, a assinatura da marca "${brandName}" surge como um emblema elegante em lettering estilizado e luminoso com filetes sutis. Imediatamente abaixo, o título da oferta "${input.offerTitle}" desdobra-se com impacto gráfico magistral em tipografia mista: fontes display condensadas e robustas em tons de branco puro e dourado quente, criando uma hierarquia visual imponente, dinâmica e perfeitamente legível.`;

  // Parágrafo 4: Micro-copy, badge de preço/CTA e WhatsApp
  const priceBlock = buildFallbackPriceClause(input);
  const whatsapp = input.whatsapp?.trim()
    ? `, e o contato de atendimento "${input.whatsapp.trim()}" posicionado no rodapé da arte`
    : "";
  const paragraph4 = `Abaixo do título da oferta, alinha-se uma linha elegante de micro-copy sensorial em caixa alta e espaçamento arejado: "${segmentConfig.sensoryLine}", intercalada por pequenas esferas luminosas. Ancorando a base do conjunto gráfico com irresistível apelo de conversão, ${priceBlock}${whatsapp}. Toda a arte é executada com renderização fotográfica comercial fotorrealista hiperdetalhada, cores ricas e saturadas, nitidez estelar e design publicitário editorial com legibilidade absoluta.`;

  return [paragraph1, paragraph2, paragraph3, paragraph4].join("\n\n");
}

export const buildPromptText = buildFallbackMasterPrompt;

/**
 * Monta as partes multimodais de forma determinística (síncrona).
 */
export function buildMultimodalPromptParts(
  input: PromptEngineInput,
): Array<string | InlineDataPart> {
  const masterPrompt = buildFallbackMasterPrompt(input);
  const parts: Array<string | InlineDataPart> = [masterPrompt];

  if (input.baseCardImageDataUrl) {
    const basePart = parseDataUrl(input.baseCardImageDataUrl);
    if (basePart) {
      parts.push(basePart);
      parts.push(
        "[IMAGEM BASE DO CARD: Preservar estrutura e aplicar os ajustes solicitados]",
      );
    }
  }

  if (input.logoImageDataUrl) {
    const logoPart = parseDataUrl(input.logoImageDataUrl);
    if (logoPart) {
      parts.push(logoPart);
      parts.push("[LOGOTIPO OFICIAL: Aplicar em destaque no topo da arte]");
    }
  }

  if (input.productImageDataUrl) {
    const productPart = parseDataUrl(input.productImageDataUrl);
    if (productPart) {
      parts.push(productPart);
      parts.push(
        "[FOTO DO PRODUTO REAL: Manter fidelidade visual e integrar harmonicamente à cena]",
      );
    }
  }

  if (input.referenceImageDataUrl) {
    const refPart = parseDataUrl(input.referenceImageDataUrl);
    if (refPart) {
      parts.push(refPart);
      parts.push(
        "[IMAGEM DE REFERÊNCIA ESTÉTICA: Absorver iluminação, paleta de cores e estilo visual]",
      );
    }
  }

  return parts;
}

/**
 * Compila o prompt do Card Publicitário no Módulo Profundo Prompt Engine v2.
 * Orquestra o Estágio 1 (GEMINI_PROMPT_MODEL como Diretor de Arte Universal)
 * e devolve as partes multimodais limpas para o Estágio 2 (GEMINI_IMAGE_MODEL).
 */
export async function compileAdCardPrompt(
  input: PromptEngineInput,
  options?: PromptEngineOptions,
): Promise<PromptEngineCompileResult> {
  const isEditMode = Boolean(input.baseCardImageDataUrl);
  const model = options?.model ?? serverEnv.GEMINI_PROMPT_MODEL;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_PROMPT_ENGINE_TIMEOUT_MS;

  const shouldExecuteAiPlanner =
    Boolean(options?.client) && options?.enableDynamicPlanner !== false;

  if (shouldExecuteAiPlanner && options?.client) {
    const startedAt = Date.now();
    log.info(`Chamando Estágio 1 (${model}) como Diretor de Arte de IA...`, {
      segment: input.businessSegment,
      offerTitle: input.offerTitle,
      isEditMode,
      model,
    });

    try {
      const aiResult = await Promise.race([
        executeAiArtDirector(input, options.client, model, isEditMode),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `PromptEngine timeout após ${timeoutMs}ms aguardando ${model}`,
                ),
              ),
            timeoutMs,
          ),
        ),
      ]);

      const durationMs = Date.now() - startedAt;
      log.info(`Estágio 1 (${model}) concluiu com sucesso em ${durationMs}ms`, {
        model,
        durationMs,
        editStrategy: aiResult.editStrategy,
      });

      return assembleCompileResult(
        input,
        aiResult.masterPrompt,
        aiResult.editStrategy,
        "ai-art-director",
      );
    } catch (error) {
      log.warn(
        `Falha ou timeout no Estágio 1 (${model}). Acionando fallback determinístico de 4 parágrafos.`,
        { error: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  // Fallback determinístico
  const fallbackPrompt = buildFallbackMasterPrompt(input);
  const fallbackEditStrategy: EditStrategy | undefined = isEditMode
    ? input.regenerationPrompt &&
      /layout|horizontal|mudar|trocar|posiç|estrutura|recompor|3d|infogr|arranj/i.test(
        input.regenerationPrompt,
      )
      ? "RECOMPOSE_LAYOUT"
      : "IN_PLACE_EDIT"
    : undefined;

  return assembleCompileResult(
    input,
    fallbackPrompt,
    fallbackEditStrategy,
    "deterministic-fallback",
  );
}

/**
 * Atalho assíncrono para obter diretamente o array de parts multimodais.
 */
export async function buildMultimodalPromptPartsAsync(
  input: PromptEngineInput,
  options?: PromptEngineOptions,
): Promise<Array<string | InlineDataPart>> {
  const result = await compileAdCardPrompt(input, options);
  return result.parts;
}

// -----------------------------------------------------------------------------
// Helpers Privados de Implementação
// -----------------------------------------------------------------------------

async function executeAiArtDirector(
  input: PromptEngineInput,
  client: NonNullable<PromptEngineOptions["client"]>,
  model: string,
  isEditMode: boolean,
): Promise<{ masterPrompt: string; editStrategy?: EditStrategy }> {
  if (isEditMode) {
    return executeConversationalEdit(input, client, model);
  }
  return executeCreationArtDirector(input, client, model);
}

async function executeCreationArtDirector(
  input: PromptEngineInput,
  client: NonNullable<PromptEngineOptions["client"]>,
  model: string,
): Promise<{ masterPrompt: string; editStrategy?: EditStrategy }> {
  const contents: Array<string | InlineDataPart> = [];

  const briefingText = buildCreationBriefingText(input);
  contents.push(briefingText);

  appendVisualInputs(contents, input, false);

  const response = await client.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION,
      temperature: 1.0,
      thinkingConfig: {
        thinkingLevel: "LOW" as unknown as undefined,
      },
    },
  });

  const rawText = extractTextFromResponse(response);
  if (!rawText || rawText.trim().length < 20) {
    throw new Error(
      "Resposta do Estágio 1 retornou texto vazio ou insuficiente",
    );
  }

  return {
    masterPrompt: cleanMarkdownFences(rawText),
  };
}

async function executeConversationalEdit(
  input: PromptEngineInput,
  client: NonNullable<PromptEngineOptions["client"]>,
  model: string,
): Promise<{ masterPrompt: string; editStrategy: EditStrategy }> {
  const contents: Array<string | InlineDataPart> = [];

  const editBriefingText = buildEditBriefingText(input);
  contents.push(editBriefingText);

  // No Estágio 1, a imagem base é SEMPRE enviada para o Diretor de Arte analisar a estrutura atual!
  appendVisualInputs(contents, input, true);

  const response = await client.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: 0.4,
      thinkingConfig: {
        thinkingLevel: "LOW" as unknown as undefined,
      },
    },
  });

  const rawJson = extractTextFromResponse(response);
  if (!rawJson) {
    throw new Error("Resposta do Estágio 1 de edição retornou texto vazio");
  }

  const cleanedJson = cleanJsonFences(rawJson);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (err) {
    throw new Error(
      `Falha ao converter resposta do Estágio 1 em JSON: ${String(err)}`,
    );
  }

  const validated = editPlanSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `JSON do Estágio 1 não obedece ao schema editPlanSchema: ${JSON.stringify(validated.error.format())}`,
    );
  }

  return {
    masterPrompt: cleanMarkdownFences(validated.data.masterPrompt),
    editStrategy: validated.data.editStrategy,
  };
}

function assembleCompileResult(
  input: PromptEngineInput,
  masterPrompt: string,
  editStrategy: EditStrategy | undefined,
  source: "ai-art-director" | "deterministic-fallback",
): PromptEngineCompileResult {
  const parts: Array<string | InlineDataPart> = [masterPrompt];

  // Desbloqueio de Pixels Inegociável:
  // Se editStrategy === "RECOMPOSE_LAYOUT", NÃO anexa baseCardImageDataUrl!
  if (input.baseCardImageDataUrl && editStrategy !== "RECOMPOSE_LAYOUT") {
    const basePart = parseDataUrl(input.baseCardImageDataUrl);
    if (basePart) {
      parts.push(basePart);
      parts.push(
        "[IMAGEM BASE DO CARD: Preservar estrutura e aplicar os ajustes solicitados]",
      );
    }
  }

  if (input.logoImageDataUrl) {
    const logoPart = parseDataUrl(input.logoImageDataUrl);
    if (logoPart) {
      parts.push(logoPart);
      parts.push("[LOGOTIPO OFICIAL: Aplicar em destaque no topo da arte]");
    }
  }

  if (input.productImageDataUrl) {
    const productPart = parseDataUrl(input.productImageDataUrl);
    if (productPart) {
      parts.push(productPart);
      parts.push(
        "[FOTO DO PRODUTO REAL: Manter fidelidade visual e integrar harmonicamente à cena]",
      );
    }
  }

  if (input.referenceImageDataUrl) {
    const refPart = parseDataUrl(input.referenceImageDataUrl);
    if (refPart) {
      parts.push(refPart);
      parts.push(
        "[IMAGEM DE REFERÊNCIA ESTÉTICA: Absorver iluminação, paleta de cores e estilo visual]",
      );
    }
  }

  return {
    masterPrompt,
    editStrategy,
    parts,
    source,
  };
}

function appendVisualInputs(
  contents: Array<string | InlineDataPart>,
  input: PromptEngineInput,
  includeBaseCard: boolean,
): void {
  if (includeBaseCard && input.baseCardImageDataUrl) {
    const basePart = parseDataUrl(input.baseCardImageDataUrl);
    if (basePart) {
      contents.push(basePart);
      contents.push("[IMAGEM BASE DO CARD]");
    }
  }

  if (input.logoImageDataUrl) {
    const logoPart = parseDataUrl(input.logoImageDataUrl);
    if (logoPart) {
      contents.push(logoPart);
      contents.push("[LOGOTIPO OFICIAL]");
    }
  }

  if (input.productImageDataUrl) {
    const productPart = parseDataUrl(input.productImageDataUrl);
    if (productPart) {
      contents.push(productPart);
      contents.push("[FOTO DO PRODUTO REAL]");
    }
  }

  if (input.referenceImageDataUrl) {
    const refPart = parseDataUrl(input.referenceImageDataUrl);
    if (refPart) {
      contents.push(refPart);
      contents.push("[IMAGEM DE REFERÊNCIA ESTÉTICA]");
    }
  }
}

function buildCreationBriefingText(input: PromptEngineInput): string {
  const isStory = input.targetAspectRatio === "story";
  const lines: string[] = [
    `BRIEFING DE CRIAÇÃO DO CARD PUBLICITÁRIO:`,
    `- Segmento: ${input.businessSegment}`,
    `- Proporção: ${isStory ? "9:16 (Story/Reels - preservar 15% topo e 15% base livres de texto)" : "4:5 (Feed vertical de Instagram)"}`,
    `- Nome do Estabelecimento / Marca: "${input.businessName}"`,
    `- Título Principal da Oferta: "${input.offerTitle}"`,
  ];

  if (input.cardIntent) {
    const customDetail = input.customIntentText?.trim()
      ? ` (${input.customIntentText.trim()})`
      : "";
    lines.push(
      `- Propósito Comercial / Intenção do Card: "${input.cardIntent}"${customDetail}`,
    );
  }

  if (input.promoPrice && input.promoPrice.trim().length > 0) {
    lines.push(`- Preço Promocional: "${input.promoPrice.trim()}"`);
    if (input.originalPrice?.trim()) {
      lines.push(`- Preço Original: "${input.originalPrice.trim()}"`);
    }
  } else {
    lines.push(
      `- Preço: NÃO INFORMADO. Criar composição publicitária atraente sem badges numéricos de preço e sem inventar valores monetários (NÃO exibir "R$ 0,00").`,
    );
  }

  if (input.callToAction?.trim()) {
    lines.push(`- Chamada para Ação (CTA): "${input.callToAction.trim()}"`);
  }

  if (input.whatsapp?.trim()) {
    lines.push(`- Contato / WhatsApp: "${input.whatsapp.trim()}"`);
  }

  if (input.stylePresetId?.trim()) {
    lines.push(`- Estilo Visual / Preset: "${input.stylePresetId.trim()}"`);
  }

  if (input.customStyleInstructions?.trim()) {
    lines.push(
      `- Instruções Adicionais de Estilo: "${input.customStyleInstructions.trim()}"`,
    );
  }

  lines.push(
    `\nRedija a descrição visual de estúdio em exatamente 4 parágrafos densos e contínuos em português seguindo os 4 Pilares Universais de Direção de Arte Publicitária.`,
  );

  return lines.join("\n");
}

function buildEditBriefingText(input: PromptEngineInput): string {
  const isStory = input.targetAspectRatio === "story";
  const userRequests: string[] = [];

  if (input.regenerationPrompt?.trim()) {
    userRequests.push(
      `- Pedido de Ajuste do Usuário ("regenerationPrompt"): "${input.regenerationPrompt.trim()}"`,
    );
  }

  if (input.customStyleInstructions?.trim()) {
    userRequests.push(
      `- Instruções Adicionais de Estilo: "${input.customStyleInstructions.trim()}"`,
    );
  }

  if (userRequests.length === 0) {
    userRequests.push(`- Pedido do Usuário: "Ajuste e refinamento da arte"`);
  }

  const lines: string[] = [
    `BRIEFING DE EDIÇÃO E REGENERAÇÃO DO CARD PUBLICITÁRIO:`,
    ...userRequests,
    `- Proporção Fixa do Canvas: ${isStory ? "9:16 (Story/Reels)" : "4:5 (Feed vertical)"}`,
    `- Segmento: ${input.businessSegment}`,
    `- Nome da Marca: "${input.businessName}"`,
    `- Título da Oferta: "${input.offerTitle}"`,
  ];

  if (input.cardIntent) {
    const customDetail = input.customIntentText?.trim()
      ? ` (${input.customIntentText.trim()})`
      : "";
    lines.push(
      `- Propósito Comercial / Intenção do Card: "${input.cardIntent}"${customDetail}`,
    );
  }

  if (input.promoPrice && input.promoPrice.trim().length > 0) {
    lines.push(`- Preço Promocional: "${input.promoPrice.trim()}"`);
    if (input.originalPrice?.trim()) {
      lines.push(`- Preço Original: "${input.originalPrice.trim()}"`);
    }
  } else {
    lines.push(
      `- Preço: NÃO INFORMADO (Sem badge monetário e sem inventar valores)`,
    );
  }

  if (input.callToAction?.trim()) {
    lines.push(`- CTA: "${input.callToAction.trim()}"`);
  }

  if (input.whatsapp?.trim()) {
    lines.push(`- WhatsApp: "${input.whatsapp.trim()}"`);
  }

  if (input.stylePresetId?.trim()) {
    lines.push(`- Preset Solicitado: "${input.stylePresetId.trim()}"`);
  }

  lines.push(
    `\nAnalise o card anexo ([IMAGEM BASE DO CARD]) e o pedido do usuário.`,
    `Determine se a edição é "IN_PLACE_EDIT" (ajuste pontual mantendo o layout atual) ou "RECOMPOSE_LAYOUT" (mudança estrutural de layout, redistribuição espacial, faixas horizontais internas dentro do canvas vertical, troca de posição ou novo arranjo).`,
    `Responda EXCLUSIVAMENTE com o JSON: { "editStrategy": "IN_PLACE_EDIT" | "RECOMPOSE_LAYOUT", "masterPrompt": "<4 parágrafos densos em português>" }`,
  );

  return lines.join("\n");
}

function extractTextFromResponse(response: {
  text?: string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}): string | undefined {
  if (typeof response.text === "string" && response.text.trim()) {
    return response.text.trim();
  }
  const partText = response.candidates?.[0]?.content?.parts?.find(
    (p) => typeof p.text === "string" && p.text.trim(),
  )?.text;
  return partText?.trim();
}

function cleanMarkdownFences(text: string): string {
  return text
    .replace(/^```[a-z0-9_-]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

function cleanJsonFences(text: string): string {
  const withoutFences = cleanMarkdownFences(text);
  const match = withoutFences.match(/\{[\s\S]*\}/);
  return match ? match[0] : withoutFences;
}
