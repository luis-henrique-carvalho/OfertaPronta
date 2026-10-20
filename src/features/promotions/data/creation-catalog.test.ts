import { describe, it, expect } from "vitest";
import { BUSINESS_SEGMENTS, CARD_INTENTS } from "./offer-brief.schema";
import {
  CREATION_CATALOG,
  CREATION_CARD_INTENTS,
  QUICK_BRAND_PALETTES,
  getCreationSegment,
  getAllCreationSegments,
  getSegmentStyles,
  getCreationStyleById,
  type LayoutType,
} from "./creation-catalog";

describe("CreationCatalog (creation-catalog.ts)", () => {
  const VALID_LAYOUT_TYPES: LayoutType[] = [
    "bold-offer",
    "clean-frame",
    "dark-premium",
    "vibrant-pop",
  ];

  it("contém exatamente os 7 ramos de comércio oficiais, incluindo fashion", () => {
    const catalogKeys = Object.keys(CREATION_CATALOG);
    expect(catalogKeys).toHaveLength(7);
    for (const segment of BUSINESS_SEGMENTS) {
      expect(catalogKeys).toContain(segment);
    }
  });

  it("cada segmento possui estrutura válida de metadados, ícone e placeholders", () => {
    for (const segment of BUSINESS_SEGMENTS) {
      const item = CREATION_CATALOG[segment];
      expect(item.id).toBe(segment);
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.icon).toBeDefined();
      expect(typeof item.iconName).toBe("string");
      expect(item.iconName.length).toBeGreaterThan(0);

      // Placeholders
      expect(item.placeholders).toBeDefined();
      expect(item.placeholders.businessName.trim().length).toBeGreaterThan(0);
      expect(item.placeholders.offerTitle.trim().length).toBeGreaterThan(0);
      expect(item.placeholders.promoPrice.trim().length).toBeGreaterThan(0);

      // Alias defaultPlaceholders
      expect(item.defaultPlaceholders).toEqual(item.placeholders);
    }
  });

  it("cada segmento possui exemplos práticos para todos os 6 objetivos de card", () => {
    for (const segment of BUSINESS_SEGMENTS) {
      const item = CREATION_CATALOG[segment];
      expect(item.intentExamples).toBeDefined();

      for (const intent of CARD_INTENTS) {
        const examples = item.intentExamples[intent];
        expect(examples).toBeDefined();
        expect(Array.isArray(examples)).toBe(true);
        expect(examples.length).toBeGreaterThan(0);

        for (const example of examples) {
          expect(example.title.trim().length).toBeGreaterThan(0);
          if (intent === "promo") {
            expect(example.price).toBeDefined();
            expect(example.price?.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("cada segmento contém exatamente 6 estilos visuais completos com layout types canônicos", () => {
    const allStyleIds = new Set<string>();

    for (const segment of BUSINESS_SEGMENTS) {
      const item = CREATION_CATALOG[segment];
      expect(item.styles).toHaveLength(6);

      for (const style of item.styles) {
        expect(style.id).toMatch(/^[a-z0-9-]+$/);
        expect(style.name.trim().length).toBeGreaterThan(0);
        expect(style.tag.trim().length).toBeGreaterThan(0);
        expect(style.color.trim().length).toBeGreaterThan(0);
        expect(style.bgPreview.trim().length).toBeGreaterThan(0);
        expect(style.badgeBg.trim().length).toBeGreaterThan(0);
        expect(style.badgeText.trim().length).toBeGreaterThan(0);
        expect(style.textColor.trim().length).toBeGreaterThan(0);
        expect(VALID_LAYOUT_TYPES).toContain(style.layoutType);

        // Paleta com 3 swatches hex válidos
        expect(style.paletteSwatches).toHaveLength(3);
        for (const hex of style.paletteSwatches) {
          expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }

        // Testar unicidade de IDs de estilo
        expect(allStyleIds.has(style.id)).toBe(false);
        allStyleIds.add(style.id);
      }
    }

    // 7 segmentos * 6 estilos = 42 estilos únicos
    expect(allStyleIds.size).toBe(42);
  });

  it("exporta QUICK_BRAND_PALETTES com exatamente 6 paletas de duas cores", () => {
    expect(QUICK_BRAND_PALETTES).toHaveLength(6);

    for (const palette of QUICK_BRAND_PALETTES) {
      expect(palette.name.trim().length).toBeGreaterThan(0);
      expect(palette.label.trim().length).toBeGreaterThan(0);
      expect(palette.value.trim().length).toBeGreaterThan(0);
      expect(palette.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(palette.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(palette.swatches).toHaveLength(2);
      expect(palette.swatches[0]).toBe(palette.primary);
      expect(palette.swatches[1]).toBe(palette.secondary);
    }
  });

  it("exporta CREATION_CARD_INTENTS com metadados para os 6 objetivos", () => {
    expect(CREATION_CARD_INTENTS).toHaveLength(6);
    const intentIds = CREATION_CARD_INTENTS.map((item) => item.id);
    for (const intent of CARD_INTENTS) {
      expect(intentIds).toContain(intent);
    }

    const promoIntent = CREATION_CARD_INTENTS.find((i) => i.id === "promo");
    expect(promoIntent?.hasPriceByDefault).toBe(true);

    const newArrivalIntent = CREATION_CARD_INTENTS.find(
      (i) => i.id === "new-arrival",
    );
    expect(newArrivalIntent?.hasPriceByDefault).toBe(false);
  });

  describe("Helper Functions", () => {
    it("getCreationSegment retorna o item correto ou fashion como fallback", () => {
      const fashion = getCreationSegment("fashion");
      expect(fashion.id).toBe("fashion");
      expect(fashion.label).toBe("Moda & Roupas");

      const market = getCreationSegment("supermarket");
      expect(market.id).toBe("supermarket");

      // @ts-expect-error fallback de segmento inválido
      const fallback = getCreationSegment("invalid-segment");
      expect(fallback.id).toBe("fashion");
    });

    it("getAllCreationSegments retorna os 7 itens", () => {
      const all = getAllCreationSegments();
      expect(all).toHaveLength(7);
      expect(all.map((item) => item.id)).toEqual([
        "fashion",
        "supermarket",
        "pizzeria",
        "burger-shop",
        "beauty-salon",
        "restaurant",
        "local-retail",
      ]);
    });

    it("getSegmentStyles retorna 6 estilos para o segmento", () => {
      const styles = getSegmentStyles("pizzeria");
      expect(styles).toHaveLength(6);
      expect(styles[0].id).toBe("pizza-rustic");
    });

    it("getCreationStyleById localiza o estilo correto ou retorna undefined", () => {
      const found = getCreationStyleById("fashion-boutique");
      expect(found).toBeDefined();
      expect(found?.name).toBe("Vitrine Elegante");

      const notFound = getCreationStyleById("non-existent-style");
      expect(notFound).toBeUndefined();
    });
  });
});
