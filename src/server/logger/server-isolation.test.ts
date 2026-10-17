import { describe, it, expect } from "vitest";
import * as loggerModule from "./index";
import * as checkoutServerModule from "../../features/checkout/server/index";
import * as promotionsServerModule from "../../features/promotions/server/index";

describe("Server Logger Isolation (Zero Server Code Leaks)", () => {
  it("exporta exclusivamente a interface pública mínima (createServerLogger, logger)", () => {
    const exportedKeys = Object.keys(loggerModule);

    const allowedExports = ["createServerLogger", "logger"];
    expect(exportedKeys.sort()).toEqual(allowedExports.sort());
  });

  it("não expõe detalhes internos (asyncLocalStorage, redactSecrets, formatLogEntry) na interface pública raiz", () => {
    const record = loggerModule as Record<string, unknown>;

    expect(record.asyncLocalStorage).toBeUndefined();
    expect(record.redactSecrets).toBeUndefined();
    expect(record.formatLogEntry).toBeUndefined();
    expect(record.serializeError).toBeUndefined();
    expect(record.runWithRequestContext).toBeUndefined();
  });

  it("garante que nenhum barrel público de feature re-exporta logger ou createServerLogger para o cliente", () => {
    const checkoutRecord = checkoutServerModule as Record<string, unknown>;
    const promotionsRecord = promotionsServerModule as Record<string, unknown>;

    expect(checkoutRecord.logger).toBeUndefined();
    expect(checkoutRecord.createServerLogger).toBeUndefined();

    expect(promotionsRecord.logger).toBeUndefined();
    expect(promotionsRecord.createServerLogger).toBeUndefined();
  });
});
