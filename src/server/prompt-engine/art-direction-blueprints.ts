import {
  type BusinessSegment,
  type CardIntent,
  REFERENCE_STYLE_PRESET_ID,
} from "@/features/promotions/data/offer-brief.schema";
import {
  resolveArtDirectionDirective,
  getPresetById,
  getSegmentPresets,
  getCommercialGuide,
  LAYOUT_VARIANT_BLUEPRINTS,
  type CuratedStylePreset,
  type LayoutVariantBlueprint,
  type LayoutVariant,
  type LayoutType,
  type ResolveArtDirectionOptions,
} from "@/features/promotions/data/style-presets-catalog";
import type { PromptEngineInput } from "./types";

export {
  REFERENCE_STYLE_PRESET_ID,
  LAYOUT_VARIANT_BLUEPRINTS,
  resolveArtDirectionDirective,
  getPresetById,
  getSegmentPresets,
  getCommercialGuide,
  type CuratedStylePreset,
  type LayoutVariantBlueprint,
  type LayoutVariant,
  type LayoutType,
  type ResolveArtDirectionOptions,
};

export const AUTHENTIC_PHOTOGRAPHY_DIRECTIVE = [
  "--- DIRETIVA MANDATÓRIA DE AUTENTICIDADE FOTOGRÁFICA (ANTI-GENERIC AI LOOK) ---",
  "- ACABAMENTO FOTOGRÁFICO REALISTA: A cena visual DEVE simular uma fotografia comercial profissional de câmera full-frame (sensor 35mm, abertura física f/2.0 a f/2.8), com profundidade de campo ótica natural, e NÃO uma renderização 3D digital, modelo CGI plástico ou ilustração digital.",
  "- TEXTURA E IMPERFEIÇÕES NATURAIS TÁTEIS: Preserve texturas físicas reais — vapor sutil de comida quente, brilho natural de suculência sem exagero plástico, gotículas de condensação fresca, porosidade dos alimentos, fibras reais de tecidos e granulação fotográfica analógica sutil (estilo ISO 200-400).",
  "- ILUMINAÇÃO ORGÂNICA E SOMBRAS DE CONTATO: Priorize iluminação natural difusa (luz de janela lateral de estúdio, golden hour ou luz de ambiente comercial acolhedor) com oclusão de ambiente e sombras de contato suaves e realistas projetadas na base de apoio.",
  "- PROIBIÇÕES EXPRESSAS (ANTI-CLICHÊ DE IA): Proibido acabamento plástico polido, pele encerada/aerografada (airbrushed), brilho artificial excessivo de render 3D, visual de vetor cartoon ou composição de banco de imagens corporativo estéril e despersonalizado.",
  "- CONTEXTO COMERCIAL LOCAL BRASILEIRO: A ambientação visual deve refletir o comércio local real do Brasil (hamburgueria artesanal com chapa e bancada rústica, hortifrúti fresco de bairro com caixotes de madeira, pizzaria com forno e farinha sutil, salão de beleza contemporâneo brasileiro).",
].join("\n");

export const ZERO_TEXT_OCCLUSION_DIRECTIVE = [
  "--- REGRA INEGOCIÁVEL DE CAMADA E LEGIBILIDADE (ZERO OCLUSÃO TIPOGRÁFICA / 100% FOREGROUND TEXT PRIORITY) ---",
  "- PRIORIDADE ABSOLUTA DE 1º PLANO (TOP Z-INDEX / FOREGROUND LAYER): Todos os textos do anúncio (título principal, nome do estabelecimento, preço promocional, selos e chamada para ação) DEVEM ser renderizados estritamente na camada frontal superior (100% em primeiro plano).",
  "- PROIBIÇÃO DE TEXTO ATRÁS DO PERSONAGEM OU PRODUTO (NO TEXT BEHIND SUBJECT): É TERMINANTEMENTE PROIBIDO posicionar letras, palavras ou títulos atrás da cabeça, rosto, cabelo, ombros, corpo de pessoas/personagens/modelos ou atrás do produto anunciado. Nenhuma parte do sujeito pode cobrir, cortar ou ocultar caracteres do texto.",
  "- ZONA DE RESPIRO OU FAIXA DE CONTRASTE FRONTAL: Se a imagem contiver uma pessoa/personagem vertical ou produto alto, posicione o sujeito levemente deslocado ou enquadrado de forma que o título ocupe uma zona negativa limpa ou uma faixa/container gráfico sólido em 1º plano absoluto com leitura 100% desobstruída.",
].join("\n");

export const SEGMENT_ART_DIRECTIVES: Record<
  BusinessSegment,
  { segmentTitle: string; visualStyle: string; atmosphere: string }
> = {
  fashion: {
    segmentTitle: "Moda & Roupas",
    visualStyle:
      "Visual clean, moderno e refinado de vitrine de boutique ou lookbook de moda. Tons harmônicos (bege, linho, off-white, rosé ou preto premium). Iluminação suave de estúdio fotográfico, enquadramento limpo e minimalista valorizando o tecido, caimento e elegância das peças.",
    atmosphere:
      "Elegância contemporânea, estilo autêntico, tendência de moda, sofisticação e excelente custo-benefício.",
  },
  supermarket: {
    segmentTitle: "Supermercado & Hortifrúti",
    visualStyle:
      "Encarte de ofertas vibrante e dinâmico de supermercado. Cores quentes (amarelo, vermelho, verde hortifrúti). Alto contraste, selos gráficos chamativos de promoção, sensação de frescor e grande economia.",
    atmosphere:
      "Varejo comercial de alimentos, produtos frescos e apetitosos, destaque agressivo e profissional para o preço promocional.",
  },
  "beauty-salon": {
    segmentTitle: "Salão de Beleza & Barbearia",
    visualStyle:
      "Estética refinada, moderna e elegante. Tons harmônicos (dourado, preto, rose gold ou neutros sofisticados). Iluminação profissional suave de estúdio.",
    atmosphere:
      "Sofisticação, bem-estar, autoestima, higiene impecável e transformação estética de alto padrão.",
  },
  pizzeria: {
    segmentTitle: "Pizzaria Artesanal & Delivery",
    visualStyle:
      "Estilo gastronômico rústico e acolhedor. Tons quentes (vermelho pomodoro, terracota, madeira nobre, dourado do queijo). Foco em apetitosidade máxima e texturas artesanais.",
    atmosphere:
      "Fornos a lenha, ingredientes frescos italianos, queijo derretido, água na boca e agilidade de delivery.",
  },
  "burger-shop": {
    segmentTitle: "Hamburgueria Artesanal & Smash Burger",
    visualStyle:
      "Estética urbana, dark gourmet ou diner contemporâneo. Contraste marcante, luz lateral valorizando suculência, pão brioche dourado e texturas.",
    atmosphere:
      "Explosão de sabor, hambúrguer farto e artesanal, atmosfera descolada e apetite imediato.",
  },
  restaurant: {
    segmentTitle: "Restaurante Executivo & À La Carte",
    visualStyle:
      "Gastronomia elegante e profissional. Empratamento impecável, mesa arrumada, iluminação gastronômica aconchegante.",
    atmosphere:
      "Sabor autêntico, qualidade culinária de restaurante conceituado, pronto para um almoço ou jantar memorável.",
  },
  "local-retail": {
    segmentTitle: "Comércio Local & Varejo",
    visualStyle:
      "Visual publicitário direto, cativante e acolhedor de loja de bairro. Cores comerciais convidativas e selos promocionais atraentes.",
    atmosphere:
      "Oportunidade única, proximidade com a comunidade, vitrine convidativa e excelente custo-benefício.",
  },
};

/**
 * Avalia se a geração deve operar no modo puramente orientado à referência visual.
 * Retorna true se referenceImageDataUrl existe e não está vazio,
 * E (!stylePresetId ou stylePresetId.trim() === REFERENCE_STYLE_PRESET_ID).
 */
export function isReferenceDrivenMode(input: {
  referenceImageDataUrl?: string | null;
  stylePresetId?: string | null;
}): boolean {
  const hasRef = Boolean(
    input.referenceImageDataUrl &&
    input.referenceImageDataUrl.trim().length > 0,
  );
  if (!hasRef) return false;

  const presetId = input.stylePresetId?.trim();
  return !presetId || presetId === REFERENCE_STYLE_PRESET_ID;
}

/**
 * Constrói a diretriz autoritativa de direção de arte para replicação estética da imagem de referência.
 */
export function buildReferenceDrivenArtDirective(
  _input?: PromptEngineInput,
): string {
  return [
    `--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---`,
    `- Papel do Modelo: Atue como diretor de arte e designer gráfico sênior encarregado de reproduzir com maestria a identidade visual do print de referência anexo.`,
    `- Estilo, Composição e Grid: Analise detalhadamente a IMAGEM DE REFERÊNCIA anexa e reproduza sua distribuição espacial, enquadramento, proporções relativas, alinhamentos, formas geométricas e padrão de respiro/bordas.`,
    `- Paleta Cromática Dominante: Extraia com fidelidade as cores de fundo, contrastes, gradientes e tons de acento presentes na IMAGEM DE REFERÊNCIA, aplicando-os à composição do anúncio sem recorrer a paletas externas genéricas.`,
    `- Tipografia e Hierarquia: Emule o estilo visual, peso das fontes (bold, condensed, elegante, etc.) e disposição de títulos e chamadas observados na IMAGEM DE REFERÊNCIA.`,
    `- Iluminação e Atmosfera: Replique o clima luminoso (luz suave, iluminação comercial, contraste dramático, estética clean ou vibrante) e as texturas da IMAGEM DE REFERÊNCIA.`,
    `- Adaptação ao Conteúdo: Combine toda essa estética do print com os dados da oferta comercial anunciada (título, preço, contato e fotos enviadas), gerando uma peça inédita que pareça pertencer à mesma campanha visual.`,
  ].join("\n");
}

export function resolvePresetAndBlueprint(
  businessSegment: BusinessSegment,
  stylePresetId?: string | null,
): { preset: CuratedStylePreset; blueprint: LayoutVariantBlueprint } {
  const presets = getSegmentPresets(businessSegment);
  const matchedPreset = getPresetById(businessSegment, stylePresetId);
  const preset = matchedPreset ?? presets[0];
  const blueprint = preset
    ? LAYOUT_VARIANT_BLUEPRINTS[preset.mockup.layoutVariant]
    : LAYOUT_VARIANT_BLUEPRINTS["retail-burst"];

  return { preset, blueprint };
}

export function buildProportionDirectives(isStory: boolean): {
  audienceText: string;
  proportionDirectives: string;
} {
  if (isStory) {
    return {
      audienceText:
        "redes sociais (Instagram Stories, Reels e WhatsApp Status 9:16)",
      proportionDirectives: `- Proporção Obrigatória: 9:16 vertical (master 1080x1920 para Stories e WhatsApp Status).
- SAFE ZONE OBRIGATÓRIA (Margem de Segurança para Stories/Status): Deixar 15% da altura no topo e 15% na base totalmente livres de textos importantes, preços, títulos ou logos, pois serão encobertos pela interface do Instagram/WhatsApp (foto de perfil, barra de status, caixa de resposta e navegação). Todo o conteúdo textual, título e preço DEVE estar estritamente concentrado na zona segura vertical central.`,
    };
  }

  return {
    audienceText: "redes sociais (Instagram Feed 4:5 e WhatsApp)",
    proportionDirectives:
      "- Proporção Obrigatória: 4:5 vertical (master 1080x1350 para Feed do Instagram).",
  };
}

export function resolvePriceInstructions(
  hasPrice: boolean,
  promoPrice?: string | null,
  originalPrice?: string | null,
): string {
  if (!hasPrice) {
    return "ESTE É UM CARD INSTITUCIONAL / INFORMATIVO: Não exiba nenhum preço ou valor monetário na arte gráfica. É expressamente proibido inserir 'R$ 0,00' ou valores inventados.";
  }

  if (originalPrice) {
    return `PREÇO PROMOCIONAL EM DESTAQUE MÁXIMO: Exibir claramente "De ${originalPrice} Por ${promoPrice}", garantindo que o valor promocional "${promoPrice}" tenha o maior tamanho visual, cor chamativa e contraste absoluto da peça.`;
  }

  return `PREÇO PROMOCIONAL EM DESTAQUE MÁXIMO: Exibir "${promoPrice}" em caixa alta e tamanho grande com contraste visual dominante.`;
}

export function resolveIntentDirective(
  intent?: CardIntent | null,
  customText?: string | null,
): string {
  const currentIntent = intent ?? "promo";
  switch (currentIntent) {
    case "promo":
      return "OBJETIVO DO ANÚNCIO (PROMOÇÃO): Foco absoluto em apelo promocional marcante, senso de oportunidade e alto contraste no preço.";
    case "new-arrival":
      return "OBJETIVO DO ANÚNCIO (NOVIDADE / LANÇAMENTO): Foco editorial em sofisticação, novidade e apresentação impecável de coleção ou lançamento ('Novidade!', 'Chegou!', 'Chegou Novidade!', 'Nova Coleção').";
    case "special-date":
      return "OBJETIVO DO ANÚNCIO (DATA COMEMORATIVA): Foco em ambientação temática e emotiva da data comemorativa anunciada.";
    case "announcement":
      return "OBJETIVO DO ANÚNCIO (COMUNICADO / INAUGURAÇÃO): Foco em clareza institucional, impacto visual de inauguração/evento e destaque para data/local.";
    case "schedule":
      return "OBJETIVO DO ANÚNCIO (HORÁRIO DE FUNCIONAMENTO / AVISO): Foco em legibilidade máxima do comunicado de horário de atendimento ou feriado.";
    case "custom": {
      const customDetail = customText?.trim() ? `: ${customText.trim()}` : "";
      return `OBJETIVO DO ANÚNCIO (PERSONALIZADO): Foco no objetivo e mensagem personalizada informada pelo cliente${customDetail}.`;
    }
    default:
      return "OBJETIVO DO ANÚNCIO: Foco em apelo visual e comunicação clara da oferta.";
  }
}

export function buildPromptOptionalNotes(input: PromptEngineInput): {
  ctaInstruction: string;
  whatsappInstruction: string;
  customInstructions: string;
  logoNote: string;
  productNote: string;
  referenceNote: string;
} {
  return {
    ctaInstruction: input.callToAction
      ? `CHAMADA PARA AÇÃO: Incluir selo ou faixa com "${input.callToAction}".`
      : "",
    whatsappInstruction: input.whatsapp
      ? `CONTATO COMERCIAL: Exibir "${input.whatsapp}" no rodapé do anúncio.`
      : "",
    customInstructions: input.customStyleInstructions
      ? `INSTRUÇÕES ADICIONAIS DO CLIENTE: ${input.customStyleInstructions}`
      : "",
    logoNote: input.logoImageDataUrl ? "- [LOGOTIPO OFICIAL]" : "",
    productNote: input.productImageDataUrl ? "- [FOTO DO PRODUTO REAL]" : "",
    referenceNote: input.referenceImageDataUrl
      ? "- [IMAGEM DE REFERÊNCIA ESTÉTICA]"
      : "",
  };
}

export function parseDataUrl(
  dataUrl: string,
): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}
