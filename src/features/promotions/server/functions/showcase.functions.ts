import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getShowcaseCards } from "../services/showcase.service";
import type { ShowcaseCardItem } from "../../data/showcase-catalog";

export type { ShowcaseCardItem };

export const getShowcaseCardsInputSchema = z.object({
  segment: z.string().min(1, "segment é obrigatório"),
  stylePresetId: z.string().optional(),
});

export type GetShowcaseCardsInput = z.infer<typeof getShowcaseCardsInputSchema>;

export const showcaseCardMetadataSchema = z
  .object({
    businessName: z.string().optional(),
    promoPrice: z.string().optional(),
    originalPrice: z.string().optional(),
    highlights: z.array(z.string()).optional(),
  })
  .nullable()
  .optional();

export const showcaseCardItemSchema = z.object({
  id: z.string(),
  businessSegment: z.string(),
  stylePresetId: z.string(),
  cardIntent: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  imageUrl: z.string(),
  aspectRatio: z.string(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().optional(),
  metadata: showcaseCardMetadataSchema,
});

export const showcaseCardsResponseSchema = z.object({
  success: z.boolean(),
  cards: z.array(showcaseCardItemSchema),
});

export type ShowcaseCardsResponse = z.infer<typeof showcaseCardsResponseSchema>;

/**
 * Server Function: Busca cards de vitrine de alta resolução para o segmento e estilo informados.
 * Executa exclusivamente no servidor Node.js/Nitro com validação Zod de entrada e saída.
 */
export const getShowcaseCardsFn = createServerFn({ method: "GET" })
  .validator((input: unknown): GetShowcaseCardsInput =>
    getShowcaseCardsInputSchema.parse(input),
  )
  .handler(
    async ({
      data,
    }: {
      data: GetShowcaseCardsInput;
    }): Promise<ShowcaseCardsResponse> => {
      const cards = await getShowcaseCards(data);
      return showcaseCardsResponseSchema.parse({
        success: true,
        cards,
      });
    },
  );
