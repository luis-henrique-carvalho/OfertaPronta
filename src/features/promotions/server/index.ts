/**
 * Ponto de entrada público do módulo Promotions Server.
 * Expõe exclusivamente Server Functions, serviços e tipos de DTO autorizados.
 */
export {
  saveDraftFn,
  getDraftFn,
  getDraftInputSchema,
} from "./functions/drafts.functions";

export type {
  OfferDraft,
  SaveDraftResponse,
  GetDraftResponse,
} from "./functions/drafts.functions";

export {
  generatePreviewFn,
  generatePreviewInputSchema,
  generatePreviewOutputSchema,
  getPreviewQuotaFn,
  getPreviewQuotaOutputSchema,
} from "./functions/generator.functions";

export type {
  GeneratePreviewInput,
  GeneratePreviewOutput,
  GeneratePreviewResponse,
  GeneratePreviewDependencies,
  GetPreviewQuotaOutput,
} from "./functions/generator.functions";

export {
  getShowcaseCardsFn,
  getShowcaseCardsInputSchema,
  showcaseCardsResponseSchema,
} from "./functions/showcase.functions";

export type {
  GetShowcaseCardsInput,
  ShowcaseCardsResponse,
  ShowcaseCardItem,
} from "./functions/showcase.functions";
