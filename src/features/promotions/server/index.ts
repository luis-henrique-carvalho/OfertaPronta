/**
 * Ponto de entrada público do módulo Promotions Server.
 * Expõe exclusivamente Server Functions e tipos de DTO autorizados para a UI / hooks.
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
