import { describe, it, expect } from "vitest";
import { BUSINESS_SEGMENTS, type BusinessSegment } from "./offer-brief.schema";
import {
  getSegmentPresets,
  getPresetById,
  getCommercialGuide,
  resolveArtDirectionDirective,
  mapPresetToStyleVisualOption,
  LAYOUT_VARIANT_BLUEPRINTS,
  LEGACY_PRESET_ID_ALIASES,
  SegmentRegistry,
  type LayoutVariant,
} from "./style-presets-catalog";

describe("StylePresetsCatalog (style-presets-catalog.ts)", () => {
  const VALID_LAYOUT_VARIANTS: LayoutVariant[] = [
    "retail-burst",
    "fresh-organic",
    "dark-luxury",
    "rustic-wood",
    "clean-minimal",
    "neon-urban",
  ];

  describe("getSegmentPresets", () => {
    it("deve retornar exatamente 4 estilos visuais curados para cada um dos 6 segmentos comerciais", () => {
      for (const segment of BUSINESS_SEGMENTS) {
        const presets = getSegmentPresets(segment);
        expect(presets).toHaveLength(4);

        for (const preset of presets) {
          expect(preset.segment).toBe(segment);
          expect(preset.id).toMatch(/^[a-z0-9-]+$/);
          expect(preset.label.trim().length).toBeGreaterThan(0);
          expect(preset.description.trim().length).toBeGreaterThan(0);
          expect(preset.tags.length).toBeGreaterThanOrEqual(2);
          for (const tag of preset.tags) {
            expect(tag.trim().length).toBeGreaterThan(0);
          }
          expect(preset.previewBadgeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(preset.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);

          // Validação da especificação do mockup
          expect(preset.mockup).toBeDefined();
          expect(VALID_LAYOUT_VARIANTS).toContain(preset.mockup.layoutVariant);
          expect(preset.mockup.badgeText.trim().length).toBeGreaterThan(0);
          expect(preset.mockup.bgColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(preset.mockup.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(preset.mockup.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);

          // Validação da diretriz estruturada de direção de arte
          expect(preset.artDirection).toBeDefined();
          expect(preset.artDirection.palette.trim().length).toBeGreaterThan(0);
          expect(preset.artDirection.composition.trim().length).toBeGreaterThan(
            0,
          );
          expect(preset.artDirection.lighting.trim().length).toBeGreaterThan(0);
          expect(preset.artDirection.atmosphere.trim().length).toBeGreaterThan(
            0,
          );
        }
      }
    });

    it("deve conter identificadores únicos globais entre todos os 28 estilos do catálogo", () => {
      const allIds = BUSINESS_SEGMENTS.flatMap((segment) =>
        getSegmentPresets(segment).map((preset) => preset.id),
      );

      expect(allIds).toHaveLength(28);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(28);
    });

    it("deve conter os IDs canônicos esperados por segmento", () => {
      const expectedIdsBySegment: Record<BusinessSegment, string[]> = {
        fashion: [
          "fashion-boutique",
          "fashion-modern",
          "fashion-vibrant",
          "fashion-bazaar",
        ],
        supermarket: [
          "market-discount",
          "market-fresh",
          "market-premium",
          "market-daily",
        ],
        "beauty-salon": [
          "salon-glamour",
          "barber-vintage",
          "beauty-clean",
          "barber-modern",
        ],
        pizzeria: [
          "pizza-rustic-wood",
          "pizza-artisan-craft",
          "pizza-neon-night",
          "pizza-promo-combo",
        ],
        "burger-shop": [
          "burger-dark-bold",
          "burger-smash-fire",
          "burger-urban-pop",
          "burger-artisan-wood",
        ],
        restaurant: [
          "restaurant-homestyle",
          "restaurant-buffet",
          "restaurant-gourmet",
          "restaurant-delivery",
        ],
        "local-retail": [
          "retail-vibrant",
          "retail-dynamic",
          "retail-clean-modern",
          "retail-service-pro",
        ],
      };

      for (const segment of BUSINESS_SEGMENTS) {
        const presets = getSegmentPresets(segment);
        const ids = presets.map((p) => p.id);
        expect(ids).toEqual(expectedIdsBySegment[segment]);
      }
    });
  });

  describe("getPresetById", () => {
    it("deve retornar o preset correto quando o ID for válido para o segmento", () => {
      const preset = getPresetById("pizzeria", "pizza-rustic-wood");
      expect(preset).toBeDefined();
      expect(preset?.id).toBe("pizza-rustic-wood");
      expect(preset?.label).toBe("Forno a Lenha Rústico");
      expect(preset?.segment).toBe("pizzeria");
    });

    it("deve retornar undefined quando o preset não pertencer ao segmento", () => {
      const preset = getPresetById("supermarket", "pizza-rustic-wood");
      expect(preset).toBeUndefined();
    });

    it("deve retornar undefined quando o ID for inexistente, nulo ou vazio", () => {
      expect(getPresetById("pizzeria", "estilo-fantasma")).toBeUndefined();
      expect(getPresetById("pizzeria", null)).toBeUndefined();
      expect(getPresetById("pizzeria", undefined)).toBeUndefined();
      expect(getPresetById("pizzeria", "")).toBeUndefined();
    });
  });

  describe("resolveArtDirectionDirective", () => {
    it("deve formatar a diretriz de arte completa com paleta, composição, iluminação e atmosfera", () => {
      const directive = resolveArtDirectionDirective(
        "supermarket",
        "market-discount",
      );

      expect(directive).toContain(
        '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Super Encarte Amarelo & Vermelho" ---',
      );
      expect(directive).toContain(
        "- Paleta de Cores: Vermelho primário vibrante",
      );
      expect(directive).toContain(
        "- Composição e Layout: Layout dinâmico de encarte",
      );
      expect(directive).toContain(
        "- Iluminação e Texturas: Iluminação de estúdio comercial",
      );
      expect(directive).toContain(
        "- Atmosfera Visual: Urgência promocional de supermercado",
      );
    });

    it("deve aplicar graciosamente o primeiro estilo padrão do segmento quando presetId for indefinido", () => {
      const directive = resolveArtDirectionDirective("pizzeria", undefined);
      expect(directive).toContain(
        '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Forno a Lenha Rústico" ---',
      );
    });

    it("deve aplicar graciosamente o primeiro estilo padrão quando presetId for nulo", () => {
      const directive = resolveArtDirectionDirective("beauty-salon", null);
      expect(directive).toContain(
        '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Glamour Rose Gold & Editorial" ---',
      );
    });

    it("deve aplicar graciosamente o primeiro estilo padrão quando presetId for inexistente", () => {
      const directive = resolveArtDirectionDirective(
        "burger-shop",
        "burger-alienigena",
      );
      expect(directive).toContain(
        '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Dark Burger & Fumaça" ---',
      );
    });

    it("deve aplicar graciosamente o primeiro estilo padrão quando presetId for string vazia ou espaços", () => {
      const directive = resolveArtDirectionDirective("restaurant", "   ");
      expect(directive).toContain(
        '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Comidinha Caseira & Aconchego" ---',
      );
    });

    it("deve enriquecer a diretriz com as especificações do blueprint da LayoutVariant", () => {
      const directive = resolveArtDirectionDirective(
        "supermarket",
        "market-discount",
      );

      expect(directive).toContain(
        "- Variante de Arquitetura Gráfica (LayoutVariant): retail-burst",
      );
      expect(directive).toContain("- Grid Espacial e Posicionamento:");
      expect(directive).toContain("- Família e Estilo Tipográfico:");
      expect(directive).toContain("- Óptica Fotográfica e Setup de Estúdio:");
      expect(directive).toContain("- Especificação Cromática HEX:");
      expect(directive).toContain("- Estilo de Badge / Ancoragem:");
      expect(directive).toContain("- Percepção Comercial para o Cliente:");
    });

    it("deve adaptar a especificação cromática quando hasReferenceImage ou hasCustomPalette for verdadeiro", () => {
      const directiveWithRef = resolveArtDirectionDirective(
        "pizzeria",
        "pizza-rustic-wood",
        { hasReferenceImage: true },
      );
      expect(directiveWithRef).toContain(
        "priorizando os tons extraídos da Imagem de Referência ou Paleta Personalizada",
      );

      const directiveWithPalette = resolveArtDirectionDirective(
        "pizzeria",
        "pizza-rustic-wood",
        { hasCustomPalette: true },
      );
      expect(directiveWithPalette).toContain(
        "priorizando os tons extraídos da Imagem de Referência ou Paleta Personalizada",
      );
    });

    it("deve adaptar o estilo de badge quando hasPromoPrice for falso (card institucional)", () => {
      const directive = resolveArtDirectionDirective(
        "fashion",
        "fashion-boutique",
        { hasPromoPrice: false },
      );
      expect(directive).toContain(
        "Selo institucional editorial discreto sem conotação de preço",
      );
    });

    it("deve resolver graciosamente IDs de presets legados via LEGACY_PRESET_ID_ALIASES", () => {
      expect(LEGACY_PRESET_ID_ALIASES["pizza-rustic"]).toBe(
        "pizza-rustic-wood",
      );
      expect(LEGACY_PRESET_ID_ALIASES["market-red"]).toBe("market-discount");

      const directive = resolveArtDirectionDirective(
        "pizzeria",
        "pizza-rustic",
      );
      expect(directive).toContain(
        '--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL: "Forno a Lenha Rústico" ---',
      );

      const preset = getPresetById("pizzeria", "pizza-rustic");
      expect(preset?.id).toBe("pizza-rustic-wood");

      const marketPreset = getPresetById("supermarket", "market-red");
      expect(marketPreset?.id).toBe("market-discount");
    });
  });

  describe("LAYOUT_VARIANT_BLUEPRINTS", () => {
    it("deve conter blueprints válidos para todas as 6 variantes canônicas de layout", () => {
      expect(Object.keys(LAYOUT_VARIANT_BLUEPRINTS)).toHaveLength(6);

      for (const variant of VALID_LAYOUT_VARIANTS) {
        const bp = LAYOUT_VARIANT_BLUEPRINTS[variant];
        expect(bp).toBeDefined();
        expect(bp.layoutVariant).toBe(variant);
        expect(bp.spatialGrid.trim().length).toBeGreaterThan(0);
        expect(bp.descriptiveTypography.trim().length).toBeGreaterThan(0);
        expect(bp.priceBadgeStyle.trim().length).toBeGreaterThan(0);
        expect(bp.cameraAndLightingSetup.trim().length).toBeGreaterThan(0);
        expect(bp.defaultTailwindPreview.color.trim().length).toBeGreaterThan(
          0,
        );
        expect(
          bp.defaultTailwindPreview.bgPreview.trim().length,
        ).toBeGreaterThan(0);
        expect(bp.defaultTailwindPreview.badgeBg.trim().length).toBeGreaterThan(
          0,
        );
        expect(
          bp.defaultTailwindPreview.textColor.trim().length,
        ).toBeGreaterThan(0);
      }
    });
  });

  describe("mapPresetToStyleVisualOption", () => {
    it("deve mapear um CuratedStylePreset para StyleVisualOption com fidelidade visual", () => {
      const presets = getSegmentPresets("fashion");
      for (const preset of presets) {
        const visual = mapPresetToStyleVisualOption(preset);
        expect(visual.id).toBe(preset.id);
        expect(visual.name.trim().length).toBeGreaterThan(0);
        expect(visual.tag.trim().length).toBeGreaterThan(0);
        expect(visual.color.trim().length).toBeGreaterThan(0);
        expect(visual.bgPreview.trim().length).toBeGreaterThan(0);
        expect(visual.badgeBg.trim().length).toBeGreaterThan(0);
        expect(visual.badgeText).toBe(preset.mockup.badgeText);
        expect(visual.textColor.trim().length).toBeGreaterThan(0);
        expect(visual.paletteSwatches).toEqual(preset.paletteSwatches);
      }
    });
  });

  describe("SegmentRegistry", () => {
    it("getAllSegments retorna todas as 7 definições canônicas", () => {
      const segments = SegmentRegistry.getAllSegments();
      expect(segments).toHaveLength(7);
      expect(segments.map((s) => s.id)).toEqual(BUSINESS_SEGMENTS);
    });

    it("getSegment retorna a definição com metadados, visualGuideline e 4 presets", () => {
      for (const segmentId of BUSINESS_SEGMENTS) {
        const segment = SegmentRegistry.getSegment(segmentId);
        expect(segment.id).toBe(segmentId);
        expect(segment.label.trim().length).toBeGreaterThan(0);
        expect(segment.shortDescription.trim().length).toBeGreaterThan(0);
        expect(segment.icon).toBeDefined();
        expect(segment.iconName.trim().length).toBeGreaterThan(0);
        expect(segment.placeholders.businessName.trim().length).toBeGreaterThan(
          0,
        );
        expect(
          segment.visualGuideline.visualStyle.trim().length,
        ).toBeGreaterThan(0);
        expect(
          segment.visualGuideline.atmosphere.trim().length,
        ).toBeGreaterThan(0);
        expect(segment.presets).toHaveLength(4);
      }
    });

    it("permite registrar dinamicamente novos segmentos com zero impacto nos existentes", () => {
      const customDef = {
        ...SegmentRegistry.getSegment("local-retail"),
        id: "local-retail" as const,
        label: "Varejo Local Atualizado",
      };
      SegmentRegistry.registerSegment(customDef);
      expect(SegmentRegistry.getSegment("local-retail").label).toBe(
        "Varejo Local Atualizado",
      );
    });
  });

  describe("getCommercialGuide (Linguagem do Comerciante)", () => {
    it("deve retornar o guia comercial com todos os 4 campos essenciais para todos os 28 presets", () => {
      for (const segment of BUSINESS_SEGMENTS) {
        const presets = getSegmentPresets(segment);
        for (const preset of presets) {
          const guide = getCommercialGuide(preset);
          expect(guide.appearance.trim().length).toBeGreaterThan(0);
          expect(guide.colorsSummary.trim().length).toBeGreaterThan(0);
          expect(guide.customerVibe.trim().length).toBeGreaterThan(0);
          expect(guide.idealFor.trim().length).toBeGreaterThan(0);

          // Compatibilidade regressiva
          expect(guide.visualTone).toBe(guide.appearance);
          expect(guide.customerImpression).toBe(guide.customerVibe);
        }
      }
    });

    it("deve conter a cópia exata humanizada focada no negócio para o estilo salon-glamour", () => {
      const preset = getPresetById("beauty-salon", "salon-glamour");
      expect(preset).toBeDefined();
      const guide = getCommercialGuide(preset!);

      expect(guide.appearance).toBe(
        "Visual iluminado e limpo, que valoriza cada detalhe sem reflexos pesados.",
      );
      expect(guide.colorsSummary).toBe("Tons elegantes de Rosa e Dourado.");
      expect(guide.customerVibe).toBe(
        "Passa ar de serviço VIP e alto padrão, transmitindo confiança para cobrar mais.",
      );
      expect(guide.idealFor).toBe(
        "Unhas em gel, escova, maquiagem, estética facial e datas comemorativas.",
      );
    });
  });
});
