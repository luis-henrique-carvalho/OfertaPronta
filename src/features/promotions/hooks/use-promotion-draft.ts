/**
 * Re-export canônico do hook de rascunho de promoção de acordo com convenções de arquitetura.
 */
export { useOfferBriefDraft as usePromotionDraft } from "./use-offer-brief-draft";
export type {
  UseOfferBriefDraftOptions as UsePromotionDraftOptions,
  GenerateAiPreviewResult,
  GenerateCardAndCheckoutResult,
} from "./use-offer-brief-draft";
