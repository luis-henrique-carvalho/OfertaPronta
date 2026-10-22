import type {
  DynamicPromptCompileOptions,
  EditIntentMode,
  InlineDataPart,
  PromptEngineInput,
} from "./types";
import {
  buildProportionDirectives,
  buildPromptOptionalNotes,
  buildReferenceDrivenArtDirective,
  isReferenceDrivenMode,
  parseDataUrl,
  resolveIntentDirective,
  resolvePriceInstructions,
  resolveArtDirectionDirective,
  SEGMENT_ART_DIRECTIVES,
  AUTHENTIC_PHOTOGRAPHY_DIRECTIVE,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
} from "./art-direction-blueprints";
import {
  buildAdaptiveEditPromptText,
  detectEditIntentMode,
} from "./edit-prompt-compiler";
import {
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

/**
 * Compila o prompt do card de maneira determinística direta (fallback síncrono offline),
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

  const styleSection = ctx.isReferenceDriven
    ? buildReferenceDrivenArtDirective(input)
    : resolveArtDirectionDirective(input.businessSegment, input.stylePresetId, {
        hasReferenceImage: ctx.hasReferenceImage,
        hasCustomPalette: ctx.hasCustomPalette,
        cardIntent: input.cardIntent,
        hasPromoPrice: ctx.hasPrice,
      });

  const notesText = [
    ctx.notes.logoNote,
    ctx.notes.productNote,
    ctx.notes.referenceNote,
    ctx.notes.customInstructions ? `- ${ctx.notes.customInstructions}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const sections: string[] = [
    `Você é um diretor de arte publicitário sênior especialista em anúncios para ${ctx.audienceText}.\nCrie um CARD PUBLICITÁRIO COMPLETO, profissional, esteticamente impecável e pronto para postagem imediata.`,
    `--- DADOS DA OFERTA COMERCIAL ---
- Segmento: ${ctx.resolvedSegmentConfig.segmentTitle}
- Estabelecimento: "${input.businessName}"
- Item ou Oferta: "${input.offerTitle}"
- ${ctx.priceInstructions}${ctx.notes.ctaInstruction ? `\n- ${ctx.notes.ctaInstruction}` : ""}${ctx.notes.whatsappInstruction ? `\n- ${ctx.notes.whatsappInstruction}` : ""}
- ${resolveIntentDirective(input.cardIntent, input.customIntentText)}`,
    ctx.proportionDirectives,
    styleSection,
  ];

  if (notesText) {
    sections.push(`--- INSUMOS E OBSERVAÇÕES ---\n${notesText}`);
  }

  sections.push(AUTHENTIC_PHOTOGRAPHY_DIRECTIVE);
  sections.push(ZERO_TEXT_OCCLUSION_DIRECTIVE);

  return sections.join("\n\n");
}

/**
 * Alias de compatibilidade com o padrão existente de geração de prompt textual.
 */
export const buildPromptText = compileDeterministicCardPrompt;

/**
 * Compila o prompt completo orquestrando o Gemini 3.8 Flash como autor único do Master Prompt
 * e fundindo o texto autoral com os guardrails determinísticos (Safe Zone, Zero Oclusão e Insumos).
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

  // Executa a autoria do Master Prompt pelo Gemini 3.8 Flash (Etapa 1)
  const brief = await planDynamicCompositionBrief(input, options);

  if (brief.authoredMasterPrompt) {
    return assembleAuthoredMasterPrompt({
      authoredMasterPrompt: brief.authoredMasterPrompt,
      input,
      isStory: ctx.isStory,
      proportionDirectives: ctx.proportionDirectives,
    });
  }

  return compileDeterministicCardPrompt(input);
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

  // 3. Guardrail inegociável de Zero Oclusão Tipográfica
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

  // A imagem base do card aprovado é fornecida com identificador neutro
  if (input.baseCardImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.baseCardImageDataUrl,
      "[IMAGEM BASE DO CARD]",
    );
  }

  if (input.logoImageDataUrl) {
    appendInlineInputPart(parts, input.logoImageDataUrl, "[LOGOTIPO OFICIAL]");
  }

  if (input.productImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.productImageDataUrl,
      "[FOTO DO PRODUTO REAL]",
    );
  }

  if (input.referenceImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.referenceImageDataUrl,
      "[IMAGEM DE REFERÊNCIA ESTÉTICA]",
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
    appendInlineInputPart(parts, input.logoImageDataUrl, "[LOGOTIPO OFICIAL]");
  }

  if (input.productImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.productImageDataUrl,
      "[FOTO DO PRODUTO REAL]",
    );
  }

  if (input.referenceImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.referenceImageDataUrl,
      "[IMAGEM DE REFERÊNCIA ESTÉTICA]",
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
    appendInlineInputPart(parts, input.logoImageDataUrl, "[LOGOTIPO OFICIAL]");
  }

  if (input.productImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.productImageDataUrl,
      "[FOTO DO PRODUTO REAL]",
    );
  }

  if (input.referenceImageDataUrl) {
    appendInlineInputPart(
      parts,
      input.referenceImageDataUrl,
      "[IMAGEM DE REFERÊNCIA ESTÉTICA]",
    );
  }

  return parts;
}
