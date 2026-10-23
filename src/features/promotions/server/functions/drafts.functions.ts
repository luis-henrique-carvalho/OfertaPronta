import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  saveOfferDraftSchema,
  type SaveOfferDraftInput,
  draftClientDtoSchema,
  type DraftClientDto,
} from "../../data/offer-brief.schema";
import {
  saveOfferDraft,
  getOfferDraft,
  type OfferDraft,
} from "../services/drafts.service";

export type { OfferDraft, DraftClientDto };

export interface SaveDraftResponse {
  success: boolean;
  draftId: string;
  draft: DraftClientDto;
}

export interface GetDraftResponse {
  success: boolean;
  draft: DraftClientDto | null;
}

export const getDraftInputSchema = z.object({
  draftId: z.string().min(1, "draftId é obrigatório"),
});

/**
 * Server Function: Salva ou atualiza um rascunho de briefing no banco.
 * O handler executa exclusivamente no servidor e chama o serviço drafts.service.ts.
 */
export const saveDraftFn = createServerFn({ method: "POST" })
  .validator((input: unknown): SaveOfferDraftInput =>
    saveOfferDraftSchema.parse(input),
  )
  .handler(
    async ({
      data,
    }: {
      data: SaveOfferDraftInput;
    }): Promise<SaveDraftResponse> => {
      const draft = await saveOfferDraft(data);
      return {
        success: true,
        draftId: draft.id,
        draft: draftClientDtoSchema.parse(draft),
      };
    },
  );

/**
 * Server Function: Busca um rascunho existente pelo ID.
 * O handler executa exclusivamente no servidor e chama o serviço drafts.service.ts.
 */
export const getDraftFn = createServerFn({ method: "GET" })
  .validator((input: unknown): { draftId: string } =>
    getDraftInputSchema.parse(input),
  )
  .handler(
    async ({
      data,
    }: {
      data: { draftId: string };
    }): Promise<GetDraftResponse> => {
      const draft = await getOfferDraft(data.draftId);
      return {
        success: true,
        draft: draft ? draftClientDtoSchema.parse(draft) : null,
      };
    },
  );
