import type {
  DetectEditIntentInput,
  EditIntentMode,
  PromptEngineInput,
  ResolveRegenerationInstructionsOptions,
} from "./types";
import {
  isReferenceDrivenMode,
  resolveArtDirectionDirective,
  REFERENCE_STYLE_PRESET_ID,
  ZERO_TEXT_OCCLUSION_DIRECTIVE,
} from "./art-direction-blueprints";

export const RECOMPOSE_INTENT_REGEX =
  /\b(atrás|atras|frente|personagem|pessoa|modelo|rosto|cabeça|cabeca|escondid\w*|cobrind\w*|cobert\w*|cortad\w*|sobrepon\w*|sobrepos\w*|posiç\w*|posic\w*|mover|mova|mude\s+o\s+lugar|mudar\s+de\s+lugar|colocar?\s+em\s+cima|colocar?\s+em\s+baixo|mais\s+para\s+(baixo|cima|esquerda|direita)|topo|rodapé|rodape|lado|esquerda|direita|layout|estrutura|reestrutur\w*|reorganiz\w*|reposicion\w*|trocar\s+(o\s+)?(estilo|fundo|cenário|cenario|layout)|mudar\s+(o\s+)?(estilo|fundo|cenário|cenario|layout)|novo\s+preset|afastar|separar|desobstru\w*|visível|visivel|legível|legivel|1º\s*plano|primeiro\s+plano)\b/i;

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

function buildSurgicalPromptTemplate(
  input: PromptEngineInput,
  parts: SharedEditPromptParts,
): string {
  return `
Você é um diretor de arte e designer gráfico sênior executando uma EDIÇÃO CIRÚRGICA DE IMAGEM EXISTENTE.
Uma IMAGEM BASE DO CARD PUBLICITÁRIO já aprovada pelo cliente está anexa.

--- DIRETRIZ FUNDAMENTAL: PRESERVAÇÃO ESTRITA ---
1. PRESERVAÇÃO TOTAL DO DESIGN: Mantenha 100% da estrutura, cenário, iluminação, produto anunciado, acompanhamentos, paleta de cores, tipografia, fontes, faixas e posições da IMAGEM BASE rigorosamente inalterados.
2. PROIBIDO REINVENTAR: É TERMINANTEMENTE PROIBIDO gerar um novo cenário, mudar a aparência do produto, trocar recipientes/bandejas ou recriar a estrutura do anúncio do zero.
3. AJUSTE CIRÚRGICO SOLICITADO: Modifique EXCLUSIVAMENTE o elemento pontual especificado a seguir:
"${parts.requestedAdjustment}"
4. DADOS DA OFERTA A MANTER:
- Estabelecimento: "${input.businessName}"
- Título da Oferta: "${input.offerTitle}"
${parts.priceLine}${parts.ctaLine}${parts.whatsappLine}

${parts.proportionDirectives}

${ZERO_TEXT_OCCLUSION_DIRECTIVE}

Todo o restante da imagem original deve permanecer visualmente idêntico à imagem base fornecida.
`.trim();
}

function buildRecomposePromptTemplate(
  input: PromptEngineInput,
  parts: SharedEditPromptParts,
  options?: BuildAdaptiveEditPromptOptions,
): string {
  const targetPresetId = options?.newStylePresetId ?? input.stylePresetId;
  const isRef = isReferenceDrivenMode(input);
  let artDirectiveSection = "";

  const hasPrice = Boolean(
    input.promoPrice && input.promoPrice.trim().length > 0,
  );

  if (
    targetPresetId &&
    !isRef &&
    targetPresetId !== REFERENCE_STYLE_PRESET_ID
  ) {
    const directive = resolveArtDirectionDirective(
      input.businessSegment,
      targetPresetId,
      {
        hasPromoPrice: hasPrice,
        hasReferenceImage: Boolean(input.referenceImageDataUrl),
      },
    );
    if (directive) {
      artDirectiveSection = `\n${directive}\n`;
    }
  }

  return `
Você é um diretor de arte e designer gráfico sênior executando uma RECOMPOSIÇÃO VISUAL E REESTRUTURAÇÃO DE LAYOUT DE CARD EXISTENTE (MODO RECOMPOSE).
Uma IMAGEM BASE DO CARD PUBLICITÁRIO está anexa para fornecer o contexto de conteúdo comercial.

--- DIRETRIZ FUNDAMENTAL: DESTRAVAMENTO ESPACIAL E REESTRUTURAÇÃO DE LAYOUT ---
1. DESTRAVAMENTO ESPACIAL E DE ESTILO: Você está AUTORIZADO E OBRIGADO a alterar posições, reorganizar o grid/layout, afastar elementos, corrigir textos encobertos e aplicar o novo estilo visual solicitado pelo cliente.
2. REPOSICIONAMENTO DE ELEMENTOS: Reposicione livremente o sujeito, o título, o preço e os selos para garantir harmonia visual e leitura perfeita sem qualquer elemento encoberto.
3. AJUSTE DE RECOMPOSIÇÃO SOLICITADO: Reorganize a composição atendendo à seguinte demanda:
"${parts.requestedAdjustment}"
${artDirectiveSection}
4. DADOS DA OFERTA COMERCIAL A MANTER E REORGANIZAR:
- Estabelecimento: "${input.businessName}"
- Título da Oferta: "${input.offerTitle}"
${parts.priceLine}${parts.ctaLine}${parts.whatsappLine}

${parts.proportionDirectives}

${ZERO_TEXT_OCCLUSION_DIRECTIVE}

Crie a nova versão do card com a recomposição solicitada, garantindo impacto visual, legibilidade absoluta de todos os textos em 1º plano e sem oclusões.
`.trim();
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

  if (mode === "SURGICAL") {
    return buildSurgicalPromptTemplate(input, parts);
  }

  return buildRecomposePromptTemplate(input, parts, options);
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
