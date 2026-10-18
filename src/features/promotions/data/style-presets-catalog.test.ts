import { describe, it, expect } from "vitest";
import { BUSINESS_SEGMENTS, type BusinessSegment } from "./offer-brief.schema";
import {
  getSegmentPresets,
  getPresetById,
  resolveArtDirectionDirective,
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

    it("deve conter identificadores únicos globais entre todos os 24 estilos do catálogo", () => {
      const allIds = BUSINESS_SEGMENTS.flatMap((segment) =>
        getSegmentPresets(segment).map((preset) => preset.id),
      );

      expect(allIds).toHaveLength(24);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(24);
    });

    it("deve conter os IDs canônicos esperados por segmento", () => {
      const expectedIdsBySegment: Record<BusinessSegment, string[]> = {
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
  });
});
