import { describe, it, expect } from "vitest";
import * as serverModule from "./index";

describe("Promotions Server Isolation (Zero Server Code Leaks)", () => {
  it("exporta exclusivamente Server Functions e schemas DTO de entrada", () => {
    const exportedKeys = Object.keys(serverModule);

    // As únicas funções de runtime exportadas pelo barrel devem ser Server Functions e schemas Zod
    const allowedExports = [
      "saveDraftFn",
      "getDraftFn",
      "getDraftInputSchema",
      "generatePreviewFn",
      "generatePreviewInputSchema",
    ];

    expect(exportedKeys.sort()).toEqual(allowedExports.sort());
  });

  it("não re-exporta serviços internos que dependem de Node.js (pg, sharp, @google/genai)", () => {
    const record = serverModule as Record<string, unknown>;

    // Invariante estrita: serviços com drivers nativos nunca podem vazar para o cliente
    expect(record.generateAdCardImage).toBeUndefined();
    expect(record.saveOfferDraft).toBeUndefined();
    expect(record.getOfferDraft).toBeUndefined();
    expect(record.updateDraftPreviewCard).toBeUndefined();
    expect(record.executeGeneratePreview).toBeUndefined();
  });
});
