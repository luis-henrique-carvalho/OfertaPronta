import { describe, it, expect, beforeEach } from "vitest";
import { createServerLogger, logger } from "./index";
import {
  runWithRequestContext,
  getCurrentRequestStore,
  getTraceContext,
} from "./async-context";
import { redactSecrets, serializeError, formatLogEntry } from "./formatters";

describe("Server Logger Deep Module (TDD)", () => {
  let capturedLogs: Array<{ level: string; message: string; raw: string }> = [];

  const testWriter = (
    level: "DEBUG" | "INFO" | "WARN" | "ERROR",
    formattedMessage: string,
  ) => {
    capturedLogs.push({
      level,
      message: formattedMessage,
      raw: formattedMessage,
    });
  };

  beforeEach(() => {
    capturedLogs = [];
  });

  describe("Log Levels and Writer", () => {
    it("deve registrar logs em todos os níveis suportados (debug, info, warn, error)", () => {
      const log = createServerLogger("test.module", {
        writer: testWriter,
        isProduction: true,
      });

      log.debug("Debug message", { debugKey: "val" });
      log.info("Info message", { infoKey: "val" });
      log.warn("Warn message", { warnKey: "val" });
      log.error("Error message", new Error("Boom"), { errKey: "val" });

      expect(capturedLogs).toHaveLength(4);
      expect(capturedLogs[0]?.level).toBe("DEBUG");
      expect(capturedLogs[1]?.level).toBe("INFO");
      expect(capturedLogs[2]?.level).toBe("WARN");
      expect(capturedLogs[3]?.level).toBe("ERROR");

      const debugParsed = JSON.parse(capturedLogs[0]?.message || "{}");
      expect(debugParsed.level).toBe("DEBUG");
      expect(debugParsed.module).toBe("test.module");
      expect(debugParsed.message).toBe("Debug message");
      expect(debugParsed.context).toEqual({ debugKey: "val" });
    });

    it("exporta um singleton default logger com módulo 'app'", () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });
  });

  describe("Secret Redaction (formatters.ts)", () => {
    it("mascara recursivamente segredos case-insensíveis (authorization, tokens, senhas, chaves webhook)", () => {
      const sensitiveData = {
        authorization: "Bearer pushin_live_secret_12345",
        "x-webhook-secret": "super_secret_webhook_key",
        webhookSecret: "another_secret",
        token: "tok_abc999",
        pushinPayToken: "secret_pushin_token",
        geminiApiKey: "AIzaSySecretGeminiKey",
        apiKey: "my-custom-api-key",
        password: "super_secure_password",
        senha: "senha_do_usuario",
        safeData: "dados-publicos",
        nested: {
          token: "nested_token_value",
          normalField: 12345,
          deepHeaders: {
            Authorization: "Bearer token_nested_in_headers",
            "X-WEBHOOK-SECRET": "upper_case_secret",
          },
        },
        list: [
          { token: "list_token", name: "item1" },
          { secret: "list_secret", name: "item2" },
        ],
      };

      const redacted = redactSecrets(sensitiveData);

      expect(redacted.authorization).toBe("Bearer ***");
      expect(redacted["x-webhook-secret"]).toBe("***");
      expect(redacted.webhookSecret).toBe("***");
      expect(redacted.token).toBe("***");
      expect(redacted.pushinPayToken).toBe("***");
      expect(redacted.geminiApiKey).toBe("***");
      expect(redacted.apiKey).toBe("***");
      expect(redacted.password).toBe("***");
      expect(redacted.senha).toBe("***");
      expect(redacted.safeData).toBe("dados-publicos");

      expect(redacted.nested.token).toBe("***");
      expect(redacted.nested.normalField).toBe(12345);
      expect(redacted.nested.deepHeaders.Authorization).toBe("Bearer ***");
      expect(redacted.nested.deepHeaders["X-WEBHOOK-SECRET"]).toBe("***");

      expect(redacted.list[0]?.token).toBe("***");
      expect(redacted.list[0]?.name).toBe("item1");
      expect(redacted.list[1]?.secret).toBe("***");
      expect(redacted.list[1]?.name).toBe("item2");
    });

    it("lida com referências circulares sem quebrar", () => {
      const circularObj: Record<string, unknown> = {
        name: "circular-root",
        token: "secret_value",
      };
      circularObj.self = circularObj;

      const redacted = redactSecrets(circularObj);
      expect(redacted.token).toBe("***");
      expect(redacted.name).toBe("circular-root");
      expect(redacted.self).toBe("[Circular]");
    });
  });

  describe("Error Serialization (formatters.ts)", () => {
    it("serializa instâncias de Error com name, message, stack, cause e code", () => {
      const causeError = new Error("Causa raiz do erro de banco");
      const mainError = new Error("Falha na transação Pix", {
        cause: causeError,
      });
      (mainError as unknown as { code: string }).code = "DB_TRANSACTION_FAILED";

      const serialized = serializeError(mainError) as Record<string, unknown>;

      expect(serialized.name).toBe("Error");
      expect(serialized.message).toBe("Falha na transação Pix");
      expect(serialized.code).toBe("DB_TRANSACTION_FAILED");
      expect(typeof serialized.stack).toBe("string");
      expect(serialized.stack).toContain("Falha na transação Pix");

      const cause = serialized.cause as Record<string, unknown>;
      expect(cause.name).toBe("Error");
      expect(cause.message).toBe("Causa raiz do erro de banco");
      expect(typeof cause.stack).toBe("string");
    });

    it("lida com erros que não são instâncias de Error (strings, objetos puros)", () => {
      expect(serializeError("Erro simples em string")).toBe(
        "Erro simples em string",
      );
      expect(serializeError(123)).toBe(123);
      expect(serializeError({ custom: "obj", token: "secret" })).toEqual({
        custom: "obj",
        token: "***",
      });
    });
  });

  describe("Dual Formatting (Production JSON vs Dev Pretty)", () => {
    it("em produção gera JSON em linha única estritamente estruturado", () => {
      const date = new Date("2026-10-17T12:00:00.000Z");
      const formatted = formatLogEntry(
        {
          timestamp: date,
          level: "INFO",
          module: "checkout.pix",
          message: "Cobrança Pix gerada",
          requestId: "req_xyz123",
          context: { orderId: "ord_1", token: "secret_token" },
        },
        { isProduction: true },
      );

      const parsed = JSON.parse(formatted);
      expect(parsed).toEqual({
        timestamp: "2026-10-17T12:00:00.000Z",
        level: "INFO",
        module: "checkout.pix",
        message: "Cobrança Pix gerada",
        requestId: "req_xyz123",
        context: {
          orderId: "ord_1",
          token: "***",
        },
      });
      expect(formatted).not.toContain("\n");
    });

    it("em desenvolvimento gera formato legível colorizado", () => {
      const date = new Date("2026-10-17T12:00:00.000Z");
      const formatted = formatLogEntry(
        {
          timestamp: date,
          level: "WARN",
          module: "promotions.generator",
          message: "Cota de IA quase esgotada",
          requestId: "req_456",
          context: { draftId: "draft_abc" },
        },
        { isProduction: false, colors: false },
      );

      expect(formatted).toContain("WARN");
      expect(formatted).toContain("[promotions.generator]");
      expect(formatted).toContain("(req_456)");
      expect(formatted).toContain("Cota de IA quase esgotada");
      expect(formatted).toContain('{"draftId":"draft_abc"}');
    });
  });

  describe("Async Context Propagation (AsyncLocalStorage)", () => {
    it("captura automaticamente o requestId do AsyncLocalStorage sem necessidade de passar no context", async () => {
      const log = createServerLogger("async.test", {
        writer: testWriter,
        isProduction: true,
      });

      const store = {
        requestId: "req_auto_propagated_789",
        pathname: "/api/webhooks/pix",
        method: "POST",
        startTime: Date.now(),
      };

      await runWithRequestContext(store, async () => {
        expect(getCurrentRequestStore()?.requestId).toBe(
          "req_auto_propagated_789",
        );
        expect(getTraceContext().requestId).toBe("req_auto_propagated_789");

        log.info("Operação dentro do contexto assíncrono", {
          customKey: "val",
        });
      });

      expect(capturedLogs).toHaveLength(1);
      const parsed = JSON.parse(capturedLogs[0]?.message || "{}");
      expect(parsed.requestId).toBe("req_auto_propagated_789");
      expect(parsed.message).toBe("Operação dentro do contexto assíncrono");
      expect(parsed.context).toEqual({ customKey: "val" });
    });

    it("permite sobrescrever explicitamente o requestId no context do log se fornecido", async () => {
      const log = createServerLogger("override.test", {
        writer: testWriter,
        isProduction: true,
      });

      const store = {
        requestId: "req_store_default",
        pathname: "/checkout",
        method: "GET",
        startTime: Date.now(),
      };

      await runWithRequestContext(store, async () => {
        log.info("Log com requestId sobrescrito", {
          requestId: "req_override_explicit",
        });
      });

      expect(capturedLogs).toHaveLength(1);
      const parsed = JSON.parse(capturedLogs[0]?.message || "{}");
      expect(parsed.requestId).toBe("req_override_explicit");
    });
  });

  describe("Child Logger (.child)", () => {
    it("herda e combina contextos padrão do logger pai", () => {
      const parentLog = createServerLogger("parent.module", {
        writer: testWriter,
        isProduction: true,
      });

      const childLog = parentLog.child({
        orderId: "order_999",
        tenant: "loja_1",
      });
      childLog.info("Mensagem do child", { action: "paid" });

      expect(capturedLogs).toHaveLength(1);
      const parsed = JSON.parse(capturedLogs[0]?.message || "{}");
      expect(parsed.module).toBe("parent.module");
      expect(parsed.context).toEqual({
        orderId: "order_999",
        tenant: "loja_1",
        action: "paid",
      });
    });

    it("permite encadear múltiplos child loggers com fusão profunda de contexto", () => {
      const rootLog = createServerLogger("root", {
        writer: testWriter,
        isProduction: true,
      });
      const level1 = rootLog.child({ level: 1, step: "init" });
      const level2 = level1.child({ level: 2, detail: "deep" });

      level2.info("Ação profunda");

      expect(capturedLogs).toHaveLength(1);
      const parsed = JSON.parse(capturedLogs[0]?.message || "{}");
      expect(parsed.context).toEqual({
        level: 2,
        step: "init",
        detail: "deep",
      });
    });
  });
});
