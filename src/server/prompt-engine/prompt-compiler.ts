import type {
  CompositionArchetype,
  DynamicCompositionBrief,
  DynamicPromptCompileOptions,
  EditIntentMode,
  InlineDataPart,
  PromptEngineInput,
} from "./types";
import {
  adaptBlueprintForArchetype,
  buildProportionDirectives,
  buildPromptOptionalNotes,
  buildReferenceDrivenArtDirective,
  buildVisualHierarchy,
  compileFourLayersNarrative,
  compileReferenceDrivenFourLayers,
  isReferenceDrivenMode,
  parseDataUrl,
  resolveArtDirectionDirective,
  resolveIntentDirective,
  resolvePresetAndBlueprint,
  resolvePriceInstructions,
  SEGMENT_ART_DIRECTIVES,
  LAYOUT_VARIANT_BLUEPRINTS,
  AUTHENTIC_PHOTOGRAPHY_DIRECTIVE,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
  type LayoutVariantBlueprint,
} from "./art-direction-blueprints";
import {
  buildAdaptiveEditPromptText,
  detectEditIntentMode,
} from "./edit-prompt-compiler";
import {
  buildDeterministicCompositionBrief,
  planDynamicCompositionBrief,
  planDynamicEditIntent,
} from "./dynamic-planner";

export { AUTHENTIC_PHOTOGRAPHY_DIRECTIVE, ZERO_TEXT_OCCLUSION_DIRECTIVE };

function appendInlineInputPart(
  parts: Array<string | InlineDataPart>,
  dataUrl: string,
  instructionText: string,
): void {
  const parsed = parseDataUrl(dataUrl);
  if (parsed) {
    parts.push({
      inlineData: {
        mimeType: parsed.mimeType,
        data: parsed.data,
      },
    });
    parts.push(instructionText);
  }
}

interface ResolvedPromptContext {
  resolvedSegmentConfig: (typeof SEGMENT_ART_DIRECTIVES)[keyof typeof SEGMENT_ART_DIRECTIVES];
  isReferenceDriven: boolean;
  hasPrice: boolean;
  hasReferenceImage: boolean;
  hasCustomPalette: boolean;
  isStory: boolean;
  audienceText: string;
  proportionDirectives: string;
  priceInstructions: string;
  notes: ReturnType<typeof buildPromptOptionalNotes>;
}

function resolvePromptContext(
  input: PromptEngineInput,
  segmentConfig?: (typeof SEGMENT_ART_DIRECTIVES)[keyof typeof SEGMENT_ART_DIRECTIVES],
): ResolvedPromptContext {
  const resolvedSegmentConfig =
    segmentConfig ??
    SEGMENT_ART_DIRECTIVES[input.businessSegment] ??
    SEGMENT_ART_DIRECTIVES.supermarket;

  const isReferenceDriven = isReferenceDrivenMode(input);
  const hasPrice = Boolean(
    input.promoPrice && input.promoPrice.trim().length > 0,
  );
  const hasReferenceImage = Boolean(
    input.referenceImageDataUrl &&
    input.referenceImageDataUrl.trim().length > 0,
  );
  const hasCustomPalette = Boolean(
    input.customStyleInstructions &&
    input.customStyleInstructions.trim().length > 0,
  );
  const isStory = input.targetAspectRatio === "story";

  const { audienceText, proportionDirectives } =
    buildProportionDirectives(isStory);
  const priceInstructions = resolvePriceInstructions(
    hasPrice,
    input.promoPrice,
    input.originalPrice,
  );
  const notes = buildPromptOptionalNotes(input);

  return {
    resolvedSegmentConfig,
    isReferenceDriven,
    hasPrice,
    hasReferenceImage,
    hasCustomPalette,
    isStory,
    audienceText,
    proportionDirectives,
    priceInstructions,
    notes,
  };
}

function resolveArtAndLayers(
  input: PromptEngineInput,
  resolvedSegmentConfig: (typeof SEGMENT_ART_DIRECTIVES)[keyof typeof SEGMENT_ART_DIRECTIVES],
  options: {
    isReferenceDriven: boolean;
    hasPrice: boolean;
    hasReferenceImage: boolean;
    hasCustomPalette: boolean;
    isStory: boolean;
    compositionArchetype?: CompositionArchetype;
  },
): {
  artDirectiveText: string;
  layers: [string, string, string, string];
  blueprint: LayoutVariantBlueprint;
} {
  if (options.isReferenceDriven) {
    return {
      artDirectiveText: buildReferenceDrivenArtDirective(input),
      layers: compileReferenceDrivenFourLayers({
        input,
        hasPrice: options.hasPrice,
        isStory: options.isStory,
      }),
      blueprint: LAYOUT_VARIANT_BLUEPRINTS["retail-burst"],
    };
  }

  const { preset, blueprint: baseBlueprint } = resolvePresetAndBlueprint(
    input.businessSegment,
    input.stylePresetId,
  );

  const blueprint = adaptBlueprintForArchetype(
    baseBlueprint,
    options.compositionArchetype,
  );

  const artDirectiveText = resolveArtDirectionDirective(
    input.businessSegment,
    input.stylePresetId,
    {
      hasReferenceImage: options.hasReferenceImage,
      hasCustomPalette: options.hasCustomPalette,
      cardIntent: input.cardIntent,
      hasPromoPrice: options.hasPrice,
      overrideBlueprint: blueprint,
    },
  );

  const layers = compileFourLayersNarrative({
    input,
    segmentAtmosphere: resolvedSegmentConfig.atmosphere,
    preset,
    blueprint,
    hasPrice: options.hasPrice,
    hasReferenceImage: options.hasReferenceImage,
    hasCustomPalette: options.hasCustomPalette,
    isStory: options.isStory,
  });

  return { artDirectiveText, layers, blueprint };
}

interface AssemblePromptParams {
  audienceText: string;
  segmentConfig: (typeof SEGMENT_ART_DIRECTIVES)[keyof typeof SEGMENT_ART_DIRECTIVES];
  businessName: string;
  offerTitle: string;
  priceInstructions: string;
  notes: ReturnType<typeof buildPromptOptionalNotes>;
  intentText: string;
  proportionDirectives: string;
  artDirectiveText: string;
  dynamicBriefText?: string;
  layers: [string, string, string, string];
  visualHierarchy: string;
}

function assemblePromptText(params: AssemblePromptParams): string {
  const {
    audienceText,
    segmentConfig,
    businessName,
    offerTitle,
    priceInstructions,
    notes,
    intentText,
    proportionDirectives,
    artDirectiveText,
    dynamicBriefText,
    layers: [layer1, layer2, layer3, layer4],
    visualHierarchy,
  } = params;

  return `
Você é um diretor de arte publicitário sênior especialista em anúncios e cards promocionais para ${audienceText}.
Crie um CARD PUBLICITÁRIO COMPLETO, profissional, esteticamente impecável e pronto para postagem imediata.

--- DADOS DA OFERTA COMERCIAL ---
- Segmento do Negócio: ${segmentConfig.segmentTitle}
- Nome do Estabelecimento: ${businessName}
- Item ou Oferta Anunciada: ${offerTitle}
- ${priceInstructions}
${notes.ctaInstruction}
${notes.whatsappInstruction}
- ${intentText}

--- DIRETRIZES DE DIREÇÃO DE ARTE E DESIGN GRÁFICO ---
${proportionDirectives}
- Estilo Visual do Segmento: ${segmentConfig.visualStyle}
${artDirectiveText ? `\n${artDirectiveText}\n` : ""}
${notes.logoNote ? `${notes.logoNote}\n` : ""}${notes.productNote ? `${notes.productNote}\n` : ""}${notes.referenceNote ? `${notes.referenceNote}\n` : ""}${notes.customInstructions ? `- ${notes.customInstructions}` : ""}
${dynamicBriefText ? `\n${dynamicBriefText}\n` : ""}
--- ARQUITETURA DE COMPOSIÇÃO EM 4 CAMADAS (STEP-BY-STEP) ---
- ${layer1}
- ${layer2}
- ${layer3}
- ${layer4}

${AUTHENTIC_PHOTOGRAPHY_DIRECTIVE}

${ZERO_TEXT_OCCLUSION_DIRECTIVE}

--- HIERARQUIA VISUAL OBRIGATÓRIA ---
${visualHierarchy}
`.trim();
}

export function formatDynamicCompositionBrief(
  brief: DynamicCompositionBrief,
): string {
  const parts = [
    `--- PLANEJAMENTO DE COMPOSIÇÃO DINÂMICA (ETAPA 1 - ${brief.source.toUpperCase()}) ---`,
    `- Diagnóstico de Sujeito: ${brief.subjectAnatomy}`,
    `- Zona Segura para Tipografia: ${brief.safeTypographyZone}`,
    `- Estratégia de Anti-Oclusão: ${brief.antiOcclusionStrategy}`,
    `- Adaptação de Layout: ${brief.layoutAdaptation}`,
  ];
  if (brief.compositionArchetype) {
    parts.splice(
      1,
      0,
      `- Arquétipo de Composição Curado: ${brief.compositionArchetype}`,
    );
  }
  return parts.join("\n");
}

/**
 * Compila o prompt do card de maneira determinística e estruturada em 4 camadas,
 * com guardrails de fidelidade e diretriz explícita de Zero Oclusão Tipográfica.
 */
export function compileDeterministicCardPrompt(
  input: PromptEngineInput,
  segmentConfig?: (typeof SEGMENT_ART_DIRECTIVES)[keyof typeof SEGMENT_ART_DIRECTIVES],
): string {
  if (input.baseCardImageDataUrl) {
    return buildAdaptiveEditPromptText(input);
  }

  const ctx = resolvePromptContext(input, segmentConfig);
  const brief = buildDeterministicCompositionBrief(input);

  const { artDirectiveText, layers, blueprint } = resolveArtAndLayers(
    input,
    ctx.resolvedSegmentConfig,
    {
      isReferenceDriven: ctx.isReferenceDriven,
      hasPrice: ctx.hasPrice,
      hasReferenceImage: ctx.hasReferenceImage,
      hasCustomPalette: ctx.hasCustomPalette,
      isStory: ctx.isStory,
      compositionArchetype: brief.compositionArchetype,
    },
  );

  const visualHierarchy = buildVisualHierarchy(
    ctx.hasPrice,
    input.offerTitle,
    input.businessName,
    input.promoPrice,
    {
      layoutType: blueprint.layoutType,
      layoutVariant: blueprint.layoutVariant,
      cardIntent: input.cardIntent,
      isStory: ctx.isStory,
      compositionArchetype: brief.compositionArchetype,
    },
  );

  return assemblePromptText({
    audienceText: ctx.audienceText,
    segmentConfig: ctx.resolvedSegmentConfig,
    businessName: input.businessName,
    offerTitle: input.offerTitle,
    priceInstructions: ctx.priceInstructions,
    notes: ctx.notes,
    intentText: resolveIntentDirective(
      input.cardIntent,
      input.customIntentText,
    ),
    proportionDirectives: ctx.proportionDirectives,
    artDirectiveText,
    layers,
    visualHierarchy,
  });
}

/**
 * Alias de compatibilidade com o padrão existente de geração de prompt textual.
 */
export const buildPromptText = compileDeterministicCardPrompt;

/**
 * Compila o prompt completo orquestrando a Etapa 1 (Planejador Dinâmico Gemini 3.8 Flash)
 * e fundindo o DynamicCompositionBrief resultante com os guardrails determinísticos da Etapa 2.
 */
export async function compileDynamicCardPrompt(
  input: PromptEngineInput,
  options?: DynamicPromptCompileOptions,
): Promise<string> {
  if (input.baseCardImageDataUrl) {
    if (options?.client && input.customStyleInstructions?.trim()) {
      const editPlan = await planDynamicEditIntent(input, options);
      if (editPlan.authoredMasterPrompt) {
        const isStory = input.targetAspectRatio === "story";
        const { proportionDirectives } = buildProportionDirectives(isStory);
        return assembleAuthoredMasterPrompt({
          authoredMasterPrompt: editPlan.authoredMasterPrompt,
          input,
          isStory,
          proportionDirectives,
        });
      }
      return buildAdaptiveEditPromptText(input, {
        mode: editPlan.mode,
      });
    }
    return buildAdaptiveEditPromptText(input);
  }

  const ctx = resolvePromptContext(input);

  // Executa o planejamento da Etapa 1
  const brief = await planDynamicCompositionBrief(input, options);

  if (brief.authoredMasterPrompt) {
    return assembleAuthoredMasterPrompt({
      authoredMasterPrompt: brief.authoredMasterPrompt,
      input,
      isStory: ctx.isStory,
      proportionDirectives: ctx.proportionDirectives,
    });
  }

  const dynamicBriefText = formatDynamicCompositionBrief(brief);

  const { artDirectiveText, layers, blueprint } = resolveArtAndLayers(
    input,
    ctx.resolvedSegmentConfig,
    {
      isReferenceDriven: ctx.isReferenceDriven,
      hasPrice: ctx.hasPrice,
      hasReferenceImage: ctx.hasReferenceImage,
      hasCustomPalette: ctx.hasCustomPalette,
      isStory: ctx.isStory,
      compositionArchetype: brief.compositionArchetype,
    },
  );

  const visualHierarchy = buildVisualHierarchy(
    ctx.hasPrice,
    input.offerTitle,
    input.businessName,
    input.promoPrice,
    {
      layoutType: blueprint.layoutType,
      layoutVariant: blueprint.layoutVariant,
      cardIntent: input.cardIntent,
      isStory: ctx.isStory,
      compositionArchetype: brief.compositionArchetype,
    },
  );

  return assemblePromptText({
    audienceText: ctx.audienceText,
    segmentConfig: ctx.resolvedSegmentConfig,
    businessName: input.businessName,
    offerTitle: input.offerTitle,
    priceInstructions: ctx.priceInstructions,
    notes: ctx.notes,
    intentText: resolveIntentDirective(
      input.cardIntent,
      input.customIntentText,
    ),
    proportionDirectives: ctx.proportionDirectives,
    artDirectiveText,
    dynamicBriefText,
    layers,
    visualHierarchy,
  });
}

/**
 * Monta o prompt final quando o Gemini 3.8 Flash assume a autoria integral do Master Prompt,
 * anexando os metadados garantidos de proporção/safe zone, diretrizes de insumos multimodais e zero oclusão.
 */
export function assembleAuthoredMasterPrompt(params: {
  authoredMasterPrompt: string;
  input: PromptEngineInput;
  isStory: boolean;
  proportionDirectives: string;
}): string {
  const sections: string[] = [];

  // 1. O prompt narrativo autoral integral redigido pelo Gemini 3.8 Flash
  sections.push(params.authoredMasterPrompt.trim());

  // 2. Diretriz mandatória de proporção e Safe Zone (se Story)
  sections.push(params.proportionDirectives);

  // 3. Diretrizes de fidelidade para insumos multimodais se presentes
  const multimodalNotes: string[] = [];
  if (params.input.logoImageDataUrl) {
    multimodalNotes.push(
      "- LOGOTIPO DA LOJA FORNECIDO: Incorpore fielmente o logotipo oficial da loja anexo (posicionado no topo, canto superior ou no rodapé do card). Preserve rigorosamente suas cores, proporção, contraste e legibilidade sem distorções.",
    );
  }
  if (params.input.productImageDataUrl) {
    multimodalNotes.push(
      "- FOTO DO PRODUTO REAL FORNECIDA PELO CLIENTE: Preserve e destaque com máxima fidelidade o produto exibido na imagem anexa. Ele deve ser o elemento central anunciado na composição do card.",
    );
  }
  if (params.input.referenceImageDataUrl) {
    multimodalNotes.push(
      "- IMAGEM DE REFERÊNCIA ESTÉTICA: Inspire-se na paleta de cores, tipografia, iluminação e atmosfera visual desta referência para guiar o estilo geral da composição do card.",
    );
  }
  if (multimodalNotes.length > 0) {
    sections.push(
      ["--- INSUMOS VISUAIS MULTIMODAIS ANEXOS ---", ...multimodalNotes].join(
        "\n",
      ),
    );
  }

  // 4. Guardrail inegociável de Zero Oclusão Tipográfica
  sections.push(ZERO_TEXT_OCCLUSION_DIRECTIVE);

  return sections.join("\n\n");
}

function buildBaseCardMultimodalParts(
  input: PromptEngineInput,
  forcedMode?: EditIntentMode,
  authoredMasterPrompt?: string,
): Array<string | InlineDataPart> {
  const parts: Array<string | InlineDataPart> = [];
  const mode = forcedMode ?? detectEditIntentMode(input);
  const isRecompose = mode === "RECOMPOSE";

  if (authoredMasterPrompt) {
    const isStory = input.targetAspectRatio === "story";
    const { proportionDirectives } = buildProportionDirectives(isStory);
    parts.push(
      assembleAuthoredMasterPrompt({
        authoredMasterPrompt,
        input,
        isStory,
        proportionDirectives,
      }),
    );
  } else {
    parts.push(buildAdaptiveEditPromptText(input, { mode }));
  }

  // Em modo RECOMPOSE, NÃO anexamos baseCardImageDataUrl como inlineData para destravar os pixels
  // e evitar que o gerador de imagem fique ancorado na divisão espacial ou enquadramento lateral anterior.
  // Em modo SURGICAL, anexamos a imagem base como inlineData para garantir preservação estrita de pixels.
  if (!isRecompose && input.baseCardImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.baseCardImageDataUrl,
      "IMAGEM BASE DO CARD PUBLICITÁRIO (ARTE MESTRE APROVADA): Use esta imagem como base gráfica principal. Mantenha rigorosamente todos os elementos visuais idênticos, aplicando EXCLUSIVAMENTE a alteração solicitada.",
    );
  }

  if (input.logoImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.logoImageDataUrl,
      "LOGOTIPO DA LOJA FORNECIDO: Mantenha a fidelidade absoluta ao logotipo oficial.",
    );
  }

  if (input.productImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.productImageDataUrl,
      "FOTO DO PRODUTO REAL ORIGINAL: Mantenha a fidelidade absoluta a este produto exatamente como renderizado na imagem base.",
    );
  }

  if (input.referenceImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.referenceImageDataUrl,
      "IMAGEM DE REFERÊNCIA ESTÉTICA: Inspire-se na paleta de cores, tipografia, iluminação e atmosfera visual desta referência.",
    );
  }

  return parts;
}

/**
 * Montagem síncrona/determinística de partes multimodais (prompt + inlineData images).
 */
export function buildMultimodalPromptParts(
  input: PromptEngineInput,
): Array<string | InlineDataPart> {
  if (input.baseCardImageDataUrl) {
    return buildBaseCardMultimodalParts(input);
  }

  const parts: Array<string | InlineDataPart> = [];

  parts.push(compileDeterministicCardPrompt(input));

  if (input.logoImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.logoImageDataUrl,
      "LOGOTIPO DA LOJA FORNECIDO: Incorpore fielmente este logotipo no anúncio (posicionado no topo, canto superior ou no rodapé do card). Preserve rigorosamente suas cores, proporção, contraste e legibilidade sem distorções.",
    );
  }

  if (input.productImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.productImageDataUrl,
      "FOTO DO PRODUTO REAL FORNECIDA PELO CLIENTE: Preserve e destaque com máxima fidelidade o produto exibido nesta imagem de referência. Ele deve ser o elemento central anunciado na composição do card.",
    );
  }

  if (input.referenceImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.referenceImageDataUrl,
      "IMAGEM DE REFERÊNCIA ESTÉTICA: Inspire-se na paleta de cores, tipografia, iluminação e atmosfera visual desta referência para guiar o estilo geral da composição do card.",
    );
  }

  return parts;
}

/**
 * Montagem assíncrona de partes multimodais incluindo o planejamento dinâmico na Etapa 1.
 */
export async function buildMultimodalPromptPartsAsync(
  input: PromptEngineInput,
  options?: DynamicPromptCompileOptions,
): Promise<Array<string | InlineDataPart>> {
  if (input.baseCardImageDataUrl) {
    let plannedMode: EditIntentMode | undefined;
    let authoredMasterPrompt: string | undefined;
    if (options?.client && input.customStyleInstructions?.trim()) {
      const editPlan = await planDynamicEditIntent(input, options);
      plannedMode = editPlan.mode;
      authoredMasterPrompt = editPlan.authoredMasterPrompt;
    }
    return buildBaseCardMultimodalParts(
      input,
      plannedMode,
      authoredMasterPrompt,
    );
  }

  const parts: Array<string | InlineDataPart> = [];

  const promptText = await compileDynamicCardPrompt(input, options);
  parts.push(promptText);

  if (input.logoImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.logoImageDataUrl,
      "LOGOTIPO DA LOJA FORNECIDO: Incorpore fielmente este logotipo no anúncio (posicionado no topo, canto superior ou no rodapé do card). Preserve rigorosamente suas cores, proporção, contraste e legibilidade sem distorções.",
    );
  }

  if (input.productImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.productImageDataUrl,
      "FOTO DO PRODUTO REAL FORNECIDA PELO CLIENTE: Preserve e destaque com máxima fidelidade o produto exibido nesta imagem de referência. Ele deve ser o elemento central anunciado na composição do card.",
    );
  }

  if (input.referenceImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.referenceImageDataUrl,
      "IMAGEM DE REFERÊNCIA ESTÉTICA: Inspire-se na paleta de cores, tipografia, iluminação e atmosfera visual desta referência para guiar o estilo geral da composição do card.",
    );
  }

  return parts;
}
