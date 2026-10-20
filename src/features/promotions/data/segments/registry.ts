import type { BusinessSegment } from "../offer-brief.schema";
import type { CuratedStylePreset, SegmentDefinition } from "./types";
import { fashionSegment } from "./definitions/fashion.segment";
import { supermarketSegment } from "./definitions/supermarket.segment";
import { beautySalonSegment } from "./definitions/beauty-salon.segment";
import { pizzeriaSegment } from "./definitions/pizzeria.segment";
import { burgerShopSegment } from "./definitions/burger-shop.segment";
import { restaurantSegment } from "./definitions/restaurant.segment";
import { localRetailSegment } from "./definitions/local-retail.segment";

export const LEGACY_PRESET_ID_ALIASES: Record<string, string> = {
  // Supermercado
  "market-red": "market-discount",
  "market-clean": "market-fresh",
  "market-dark": "market-premium",
  "market-orange": "market-daily",

  // Pizzaria
  "pizza-rustic": "pizza-rustic-wood",
  "pizza-italian": "pizza-artisan-craft",
  "pizza-party": "pizza-promo-combo",
  "pizza-wood": "pizza-rustic-wood",

  // Hamburgueria
  "burger-dark": "burger-dark-bold",
  "burger-fire": "burger-smash-fire",
  "burger-retro": "burger-urban-pop",
  "burger-artisan": "burger-artisan-wood",

  // Beleza & Barbearia
  "beauty-rose": "salon-glamour",
  "beauty-gold": "barber-vintage",
  "barber-retro": "barber-vintage",
  "beauty-spa": "beauty-clean",
  "barber-fade": "barber-modern",

  // Restaurante
  "rest-homestyle": "restaurant-homestyle",
  "rest-dark": "restaurant-gourmet",
  "rest-buffet": "restaurant-buffet",
  "rest-delivery": "restaurant-delivery",

  // Comércio & Serviços Locais
  "retail-clean": "retail-clean-modern",
  "retail-promo": "retail-vibrant",
  "retail-services": "retail-service-pro",
};

const CANONICAL_SEGMENT_ORDER: BusinessSegment[] = [
  "fashion",
  "supermarket",
  "beauty-salon",
  "pizzeria",
  "burger-shop",
  "restaurant",
  "local-retail",
];

class SegmentRegistryImpl {
  private readonly segments = new Map<string, SegmentDefinition>();

  constructor() {
    this.registerSegment(fashionSegment);
    this.registerSegment(supermarketSegment);
    this.registerSegment(beautySalonSegment);
    this.registerSegment(pizzeriaSegment);
    this.registerSegment(burgerShopSegment);
    this.registerSegment(restaurantSegment);
    this.registerSegment(localRetailSegment);
  }

  public registerSegment(definition: SegmentDefinition): void {
    this.segments.set(definition.id, definition);
  }

  public getSegment(segmentId: BusinessSegment | string): SegmentDefinition {
    const found = this.segments.get(segmentId);
    if (found) {
      return found;
    }
    // Fallback gracioso
    return this.segments.get("supermarket") ?? supermarketSegment;
  }

  public getAllSegments(): SegmentDefinition[] {
    const list: SegmentDefinition[] = [];
    for (const key of CANONICAL_SEGMENT_ORDER) {
      const seg = this.segments.get(key);
      if (seg) {
        list.push(seg);
      }
    }
    // Adicionar quaisquer segmentos extras registrados dinamicamente
    for (const [key, seg] of this.segments.entries()) {
      if (!CANONICAL_SEGMENT_ORDER.includes(key as BusinessSegment)) {
        list.push(seg);
      }
    }
    return list;
  }

  public getSegmentPresets(
    segmentId: BusinessSegment | string,
  ): [
    CuratedStylePreset,
    CuratedStylePreset,
    CuratedStylePreset,
    CuratedStylePreset,
  ] {
    const segment = this.getSegment(segmentId);
    return [...segment.presets];
  }

  public getPresetById(
    segmentId: BusinessSegment | string,
    presetId?: string | null,
  ): CuratedStylePreset | undefined {
    if (!presetId) return undefined;
    const trimmedId = presetId.trim();
    if (!trimmedId) return undefined;

    const resolvedId = LEGACY_PRESET_ID_ALIASES[trimmedId] ?? trimmedId;
    const presets = this.getSegmentPresets(segmentId);
    return presets.find((p) => p.id === resolvedId);
  }

  public findPresetById(
    presetId?: string | null,
  ): CuratedStylePreset | undefined {
    if (!presetId) return undefined;
    const trimmedId = presetId.trim();
    if (!trimmedId) return undefined;

    const resolvedId = LEGACY_PRESET_ID_ALIASES[trimmedId] ?? trimmedId;
    for (const segment of this.segments.values()) {
      const match = segment.presets.find((p) => p.id === resolvedId);
      if (match) return match;
    }
    return undefined;
  }
}

export const SegmentRegistry = new SegmentRegistryImpl();
