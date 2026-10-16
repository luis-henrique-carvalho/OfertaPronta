import { describe, it, expect } from "vitest";
import {
  saveDraftFn,
  getDraftFn,
  getDraftInputSchema,
} from "./drafts.functions";
import {
  saveDraftFn as barrelSaveDraftFn,
  getDraftFn as barrelGetDraftFn,
  getDraftInputSchema as barrelGetDraftInputSchema,
} from "../index";

describe("Drafts Server Functions (RPC Transport Layer)", () => {
  describe("Contract and ServerFn definitions", () => {
    it("defines saveDraftFn with POST method and RPC structure", () => {
      expect(saveDraftFn).toBeDefined();
      expect(typeof saveDraftFn).toBe("function");
      expect(saveDraftFn.method).toBe("POST");
    });

    it("defines getDraftFn with GET method and RPC structure", () => {
      expect(getDraftFn).toBeDefined();
      expect(typeof getDraftFn).toBe("function");
      expect(getDraftFn.method).toBe("GET");
    });
  });

  describe("Input validation schemas", () => {
    it("getDraftInputSchema validates presence of draftId", () => {
      const valid = getDraftInputSchema.safeParse({ draftId: "draft-123" });
      expect(valid.success).toBe(true);

      const invalid = getDraftInputSchema.safeParse({ draftId: "" });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Server Index Barrel Exports", () => {
    it("re-exports saveDraftFn and getDraftFn from server/index.ts", () => {
      expect(barrelSaveDraftFn).toBe(saveDraftFn);
      expect(barrelGetDraftFn).toBe(getDraftFn);
      expect(barrelGetDraftInputSchema).toBe(getDraftInputSchema);
    });
  });
});
