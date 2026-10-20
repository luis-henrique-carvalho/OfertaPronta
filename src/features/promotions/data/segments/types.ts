import type { LucideIcon } from "lucide-react";
import type { BusinessSegment, CardIntent } from "../offer-brief.schema";

export type LayoutVariant =
  | "retail-burst"
  | "fresh-organic"
  | "dark-luxury"
  | "rustic-wood"
  | "clean-minimal"
  | "neon-urban";

export type LayoutType =
  "bold-offer" | "clean-frame" | "dark-premium" | "vibrant-pop";

export interface StyleMockupSpec {
  layoutVariant: LayoutVariant;
  badgeText: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  footerHeadline?: string;
  footerSubline?: string;
  iconVariant?: string;
}

export interface ArtDirectionDirective {
  palette: string;
  composition: string;
  lighting: string;
  atmosphere: string;
}

export interface CommercialGuide {
  appearance: string;
  colorsSummary: string;
  customerVibe: string;
  idealFor: string;
  /** @deprecated Utilize `appearance` */
  visualTone?: string;
  /** @deprecated Utilize `customerVibe` */
  customerImpression?: string;
}

export interface CuratedStylePreset {
  id: string;
  segment: BusinessSegment;
  label: string;
  description: string;
  tags: string[];
  previewBadgeColor: string;
  accentColor: string;
  paletteSwatches: [string, string, string];
  mockup: StyleMockupSpec;
  artDirection: ArtDirectionDirective;
  commercialGuide: CommercialGuide;
}

export interface CreationPlaceholders {
  businessName: string;
  offerTitle: string;
  promoPrice: string;
  originalPrice?: string;
  callToAction?: string;
}

export interface IntentExample {
  title: string;
  price?: string;
}

export type IntentExamplesMap = Record<CardIntent, IntentExample[]>;

export interface SegmentVisualGuideline {
  segmentTitle: string;
  visualStyle: string;
  atmosphere: string;
}

export interface ExampleOffer {
  title: string;
  promoPrice: string;
  originalPrice?: string;
  stylePresetId: string;
}

export interface SegmentDefinition {
  id: BusinessSegment;
  label: string;
  shortDescription: string;
  icon: LucideIcon;
  iconName: string;
  placeholders: CreationPlaceholders;
  defaultPlaceholders?: CreationPlaceholders;
  intentExamples: IntentExamplesMap;
  exampleOffers?: ExampleOffer[];
  visualGuideline: SegmentVisualGuideline;
  presets: [
    CuratedStylePreset,
    CuratedStylePreset,
    CuratedStylePreset,
    CuratedStylePreset,
  ];
}
