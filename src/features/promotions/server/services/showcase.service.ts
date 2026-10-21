import { asc, eq, and, inArray } from "drizzle-orm";
import { db as defaultDb, type AppDatabase } from "@/server/db";
import { showcaseCards } from "@/server/db/schema";
import {
  SHOWCASE_SEED_CATALOG,
  normalizeSegment,
  type ShowcaseCardItem,
} from "../../data/showcase-catalog";

export interface GetShowcaseCardsInput {
  segment: string;
  stylePresetId?: string;
}

/**
 * Módulo Profundo: ShowcaseService
 * Recupera cards de vitrine de alta resolução para o segmento e estilo informados.
 * Consulta prioritariamente a tabela `showcase_cards` no banco PostgreSQL.
 * Caso o banco esteja vazio ou inacessível, recorre deterministicamente
 * ao catálogo de semente estático (`SHOWCASE_SEED_CATALOG`).
 */
export async function getShowcaseCards(
  input: GetShowcaseCardsInput,
  dbClient: AppDatabase = defaultDb,
): Promise<ShowcaseCardItem[]> {
  const { segment, stylePresetId } = input;
  const normalized = normalizeSegment(segment);
  const possibleSegments = Array.from(new Set([segment, normalized]));

  try {
    const conditions = [
      inArray(showcaseCards.businessSegment, possibleSegments),
      eq(showcaseCards.isFeatured, true),
    ];

    if (stylePresetId) {
      conditions.push(eq(showcaseCards.stylePresetId, stylePresetId));
    }

    const rows = await dbClient
      .select()
      .from(showcaseCards)
      .where(and(...conditions))
      .orderBy(asc(showcaseCards.displayOrder));

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        businessSegment: r.businessSegment,
        stylePresetId: r.stylePresetId,
        cardIntent: r.cardIntent,
        title: r.title,
        description: r.description,
        imageUrl: r.imageUrl,
        aspectRatio: r.aspectRatio,
        isFeatured: r.isFeatured,
        displayOrder: r.displayOrder,
        metadata: r.metadata ?? null,
      }));
    }
  } catch {
    // Falha silenciosa no banco (ex: testes sem conexão ou tabela vazia): fallback transparente
  }

  // Fallback determinístico para o catálogo de semente
  return getSeedFallback(segment, stylePresetId);
}

function getSeedFallback(
  segment: string,
  stylePresetId?: string,
): ShowcaseCardItem[] {
  const normalized = normalizeSegment(segment);

  let filtered = SHOWCASE_SEED_CATALOG.filter((item) => {
    return (
      item.businessSegment === segment ||
      item.businessSegment === normalized ||
      normalizeSegment(item.businessSegment) === normalized
    );
  });

  if (stylePresetId) {
    const matchingPreset = filtered.filter(
      (item) => item.stylePresetId === stylePresetId,
    );
    if (matchingPreset.length > 0) {
      filtered = matchingPreset;
    }
  }

  // Se por alguma razão o segmento não encontrar itens na semente, retorna os primeiros
  // itens para garantir que a vitrine nunca retorne lista vazia
  if (filtered.length === 0) {
    filtered = SHOWCASE_SEED_CATALOG.slice(0, 3);
  }

  return [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);
}
