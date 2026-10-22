import type {
  DetectEditIntentInput,
  EditIntentMode,
  PromptEngineInput,
  ResolveRegenerationInstructionsOptions,
} from "./types";
import {
  AUTHENTIC_PHOTOGRAPHY_DIRECTIVE,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
} from "./art-direction-blueprints";

export const RECOMPOSE_INTENT_REGEX =
  /\b(centro|central|meio|centraliz\w*|destaqu\w*|foc\w*|produt\w*|maior|atrás|atras|frente|personagem|pessoa|modelo|rosto|cabeça|cabeca|escondid\w*|cobrind\w*|cobert\w*|cortad\w*|sobrepon\w*|sobrepos\w*|posiç\w*|posic\w*|mover|mova|mude\s+o\s+lugar|mudar\s+de\s+lugar|colocar?\s+em\s+cima|colocar?\s+em\s+baixo|mais\s+para\s+(baixo|cima|esquerda|direita)|topo|rodapé|rodape|lado|esquerda|direita|layout|estrutura|reestrutur\w*|reorganiz\w*|reposicion\w*|trocar\s+(o\s+)?(estilo|fundo|cenário|cenario|layout)|mudar\s+(o\s+)?(estilo|fundo|cenário|cenario|layout)|novo\s+preset|afastar|separar|desobstru\w*|visível|visivel|legível|legivel|1º\s*plano|primeiro\s+plano)\b/i;

/**
 * Classifica a intenção de edição entre 'SURGICAL' (ajustes pontuais em texto/preço/contato)
 * e 'RECOMPOSE' (mudança espacial, desobstrução de texto atrás de personagem, novo estilo visual ou layout).
 */
export function detectEditIntentMode(
  input: DetectEditIntentInput,
): EditIntentMode {
  if (input.presetChanged === true || input.hasReferenceOverride === true) {
    return "RECOMPOSE";
  }

  const instructions = input.customStyleInstructions?.trim();
  if (instructions && RECOMPOSE_INTENT_REGEX.test(instructions)) {
    return "RECOMPOSE";
  }

  return "SURGICAL";
}

export interface BuildAdaptiveEditPromptOptions {
  mode?: EditIntentMode;
  presetChanged?: boolean;
  newStylePresetId?: string | null;
}

/**
 * Compila o prompt adaptativo para edição de uma imagem existente.
 * Se o modo for SURGICAL, preserva rigorosamente a imagem base exigindo que cenários e layouts fiquem inalterados.
 * Se o modo for RECOMPOSE, remove a trava de posições idênticas e autoriza a IA a reposicionar o layout
 * e garantir que todos os textos fiquem desobstruídos em 1º plano.
 */
interface SharedEditPromptParts {
  proportionDirectives: string;
  requestedAdjustment: string;
  priceLine: string;
  ctaLine: string;
  whatsappLine: string;
}

function resolveSharedEditPromptParts(
  input: PromptEngineInput,
): SharedEditPromptParts {
  const isStory = input.targetAspectRatio === "story";
  const proportionDirectives = isStory
    ? "- Proporção Obrigatória: 9:16 vertical (master 1080x1920)."
    : "- Proporção Obrigatória: 4:5 vertical (master 1080x1350).";

  const requestedAdjustment = input.customStyleInstructions?.trim()
    ? input.customStyleInstructions.trim()
    : "Atualizar os dados da oferta preservando a identidade visual.";

  const hasPrice = Boolean(
    input.promoPrice && input.promoPrice.trim().length > 0,
  );
  const priceLine = hasPrice
    ? `- Preço Promocional: "${input.promoPrice}"${input.originalPrice ? ` (De: "${input.originalPrice}")` : ""}`
    : "- Preço: Nenhum (Card Institucional / Informativo sem valor monetário)";

  const ctaLine = input.callToAction
    ? `\n- Chamada para Ação: "${input.callToAction}"`
    : "";
  const whatsappLine = input.whatsapp
    ? `\n- Contato Comercial: "${input.whatsapp}"`
    : "";

  return {
    proportionDirectives,
    requestedAdjustment,
    priceLine,
    ctaLine,
    whatsappLine,
  };
}

export function buildAdaptiveEditPromptText(
  input: PromptEngineInput,
  options?: BuildAdaptiveEditPromptOptions,
): string {
  const parts = resolveSharedEditPromptParts(input);
  const mode =
    options?.mode ??
    detectEditIntentMode({
      customStyleInstructions: input.customStyleInstructions,
      presetChanged: options?.presetChanged,
    });

  const isSurgical = mode === "SURGICAL";

  const editDirective = isSurgical
    ? `--- EDIÇÃO DE CARD EXISTENTE (MODO CIRÚRGICO) ---
Modifique pontualmente o elemento indicado a seguir, preservando estritamente toda a composição, cenário, iluminação e identidade do produto da IMAGEM BASE anexa:
"${parts.requestedAdjustment}"`
    : `--- RECOMPOSIÇÃO DE LAYOUT DE CARD EXISTENTE (MODO RECOMPOSE) ---
Reposicione os elementos e reestruture o layout da IMAGEM BASE anexa para atender ao ajuste solicitado pelo cliente, mantendo rigorosamente a mesma identidade visual e características do produto/sujeito:
"${parts.requestedAdjustment}"`;

  return [
    `Você é um designer gráfico sênior executando a edição de um card publicitário a partir da imagem base anexa.`,
    editDirective,
    `--- DADOS DA OFERTA COMERCIAL A MANTER ---
- Estabelecimento: "${input.businessName}"
- Título da Oferta: "${input.offerTitle}"
${parts.priceLine}${parts.ctaLine}${parts.whatsappLine}`,
    parts.proportionDirectives,
    AUTHENTIC_PHOTOGRAPHY_DIRECTIVE,
    ZERO_TEXT_OCCLUSION_DIRECTIVE,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Atalho para geração de prompt em modo estritamente cirúrgico.
 */
export function buildSurgicalEditPromptText(input: PromptEngineInput): string {
  return buildAdaptiveEditPromptText(input, { mode: "SURGICAL" });
}

/**
 * Isola o ajuste atual do cliente sem acumular diretrizes conflitantes de rodadas anteriores,
 * combinando a nova paleta de cores ou indicação de novo preset, e preservando eventuais instruções originais de estilo.
 */
export function resolveRegenerationStyleInstructions(
  originalStyleInstructions: string | undefined | null,
  currentAdjustmentPrompt: string | undefined | null,
  optionsOrColorPalette?:
    ResolveRegenerationInstructionsOptions | string | null,
): string | undefined {
  let colorPalette: string | null | undefined = undefined;
  let presetChanged = false;

  if (
    typeof optionsOrColorPalette === "object" &&
    optionsOrColorPalette !== null
  ) {
    colorPalette = optionsOrColorPalette.colorPalette;
    presetChanged = Boolean(optionsOrColorPalette.presetChanged);
  } else if (typeof optionsOrColorPalette === "string") {
    colorPalette = optionsOrColorPalette;
  }

  const adjustmentParts: string[] = [];

  if (colorPalette?.trim()) {
    adjustmentParts.push(`Paleta de cores: ${colorPalette.trim()}`);
  }

  if (presetChanged) {
    adjustmentParts.push(
      "Reestruturar layout e estilo visual aplicando integralmente o novo preset selecionado",
    );
  }

  if (currentAdjustmentPrompt?.trim()) {
    adjustmentParts.push(currentAdjustmentPrompt.trim());
  }

  if (adjustmentParts.length === 0) {
    return originalStyleInstructions || undefined;
  }

  const combinedAdjustment = adjustmentParts.join(". ");

  const cleanOriginal = originalStyleInstructions
    ? originalStyleInstructions
        .replace(/\.?\s*Ajuste solicitado pelo cliente:.*$/i, "")
        .trim()
    : "";

  return cleanOriginal
    ? `${cleanOriginal}. Ajuste solicitado pelo cliente: ${combinedAdjustment}`
    : `Ajuste solicitado pelo cliente: ${combinedAdjustment}`;
}
