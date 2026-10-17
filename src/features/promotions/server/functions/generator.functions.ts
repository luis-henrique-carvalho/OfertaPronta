import { createServerFn } from "@tanstack/react-start";
import {
  generatePreviewInputSchema,
  type GeneratePreviewInput,
} from "../../data/offer-brief.schema";
import {
  executeGeneratePreview,
  type GeneratePreviewResponse,
  type GeneratePreviewDependencies,
} from "../services/preview-generator.service";

export { generatePreviewInputSchema };
export type {
  GeneratePreviewInput,
  GeneratePreviewResponse,
  GeneratePreviewDependencies,
};

/**
 * Server Function RPC TanStack Start: expõe a geração de prévia protegida
 * com validação Zod no boundary e isolamento Server-Only.
 */
export const generatePreviewFn = createServerFn({ method: "POST" })
  .validator((input: unknown): GeneratePreviewInput =>
    generatePreviewInputSchema.parse(input),
  )
  .handler(
    async ({
      data,
    }: {
      data: GeneratePreviewInput;
    }): Promise<GeneratePreviewResponse> => {
      return executeGeneratePreview(data);
    },
  );
