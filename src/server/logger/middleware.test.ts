import { describe, it, expect, vi } from "vitest";
import {
  requestLoggingMiddleware,
  serverFnLoggingMiddleware,
} from "./middleware";

import { getCurrentRequestStore } from "./async-context";

describe("Request Logging Middleware (TanStack Start)", () => {
  it("intercepta a requisição, propaga requestId no AsyncLocalStorage e injeta header x-request-id na resposta", async () => {
    let capturedStoreRequestId: string | undefined;

    const mockRequest = new Request("https://ofertapronta.com/api/test", {
      method: "POST",
    });

    const mockNext = vi.fn().mockImplementation(async () => {
      capturedStoreRequestId = getCurrentRequestStore()?.requestId;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    // Invocamos a função do servidor do middleware
    const serverFn = (
      requestLoggingMiddleware as unknown as {
        options: {
          server: (ctx: {
            request: Request;
            pathname: string;
            context: unknown;
            next: () => Promise<Response>;
            handlerType: "serverFn" | "router";
          }) => Promise<Response>;
        };
      }
    ).options.server;

    const response = await serverFn({
      request: mockRequest,
      pathname: "/api/test",
      context: {},
      next: mockNext,
      handlerType: "router",
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(capturedStoreRequestId).toBeDefined();
    expect(response.headers.get("x-request-id")).toBe(capturedStoreRequestId);
    expect(response.status).toBe(200);
  });

  it("reutiliza o x-request-id recebido no header da requisição", async () => {
    let capturedStoreRequestId: string | undefined;

    const mockRequest = new Request(
      "https://ofertapronta.com/api/webhooks/pix",
      {
        method: "POST",
        headers: {
          "x-request-id": "client-provided-req-id-1234",
        },
      },
    );

    const mockNext = vi.fn().mockImplementation(async () => {
      capturedStoreRequestId = getCurrentRequestStore()?.requestId;
      return new Response(null, { status: 200 });
    });

    const serverFn = (
      requestLoggingMiddleware as unknown as {
        options: {
          server: (ctx: {
            request: Request;
            pathname: string;
            context: unknown;
            next: () => Promise<Response>;
            handlerType: "serverFn" | "router";
          }) => Promise<Response>;
        };
      }
    ).options.server;

    const response = await serverFn({
      request: mockRequest,
      pathname: "/api/webhooks/pix",
      context: {},
      next: mockNext,
      handlerType: "router",
    });

    expect(capturedStoreRequestId).toBe("client-provided-req-id-1234");
    expect(response.headers.get("x-request-id")).toBe(
      "client-provided-req-id-1234",
    );
  });

  it("captura erro do next(), loga falha e re-lança o erro", async () => {
    const mockRequest = new Request("https://ofertapronta.com/api/failing", {
      method: "GET",
    });

    const mockNext = vi
      .fn()
      .mockRejectedValue(new Error("Database connection down"));

    const serverFn = (
      requestLoggingMiddleware as unknown as {
        options: {
          server: (ctx: {
            request: Request;
            pathname: string;
            context: unknown;
            next: () => Promise<Response>;
            handlerType: "serverFn" | "router";
          }) => Promise<Response>;
        };
      }
    ).options.server;

    await expect(
      serverFn({
        request: mockRequest,
        pathname: "/api/failing",
        context: {},
        next: mockNext,
        handlerType: "router",
      }),
    ).rejects.toThrow("Database connection down");
  });

  it("loga com warn quando resposta HTTP tem status 4xx e com error quando tem status 5xx", async () => {
    const mockNext404 = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));
    const mockNext500 = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));

    const serverFn = (
      requestLoggingMiddleware as unknown as {
        options: {
          server: (ctx: {
            request: Request;
            pathname: string;
            context: unknown;
            next: () => Promise<Response>;
            handlerType: "serverFn" | "router";
          }) => Promise<Response>;
        };
      }
    ).options.server;

    const res404 = await serverFn({
      request: new Request("https://ofertapronta.com/pedido/not-found"),
      pathname: "/pedido/not-found",
      context: {},
      next: mockNext404,
      handlerType: "router",
    });
    expect(res404.status).toBe(404);

    const res500 = await serverFn({
      request: new Request("https://ofertapronta.com/api/crash"),
      pathname: "/api/crash",
      context: {},
      next: mockNext500,
      handlerType: "router",
    });
    expect(res500.status).toBe(500);
  });
});

describe("Server Function Logging Middleware (TanStack Start)", () => {
  it("executa a Server Function com sucesso e retorna o resultado", async () => {
    const mockNext = vi
      .fn()
      .mockResolvedValue({ success: true, draftId: "draft-123" });

    const serverFn = (
      serverFnLoggingMiddleware as unknown as {
        options: {
          server: (ctx: {
            next: () => Promise<{ success: boolean; draftId: string }>;
            serverFnMeta?: { name?: string; filename?: string; id?: string };
            context: unknown;
          }) => Promise<{ success: boolean; draftId: string }>;
        };
      }
    ).options.server;

    const result = await serverFn({
      next: mockNext,
      serverFnMeta: {
        name: "saveDraftFn",
        filename:
          "src/features/promotions/server/functions/drafts.functions.ts",
        id: "saveDraftFn_id",
      },
      context: {},
    });

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, draftId: "draft-123" });
  });

  it("intercepta erro lançado na Server Function, loga falha estruturada e re-lança o erro para serialização TSR", async () => {
    const testError = new Error(
      "Your account or project has exceeded the quota. Upgrade your plan to increase limits.",
    );
    const mockNext = vi.fn().mockRejectedValue(testError);

    const serverFn = (
      serverFnLoggingMiddleware as unknown as {
        options: {
          server: (ctx: {
            next: () => Promise<unknown>;
            serverFnMeta?: { name?: string; filename?: string; id?: string };
            context: unknown;
          }) => Promise<unknown>;
        };
      }
    ).options.server;

    await expect(
      serverFn({
        next: mockNext,
        serverFnMeta: {
          name: "generatePreviewFn",
          filename:
            "src/features/promotions/server/functions/generator.functions.ts",
          id: "generatePreviewFn_id",
        },
        context: {},
      }),
    ).rejects.toThrow(
      "Your account or project has exceeded the quota. Upgrade your plan to increase limits.",
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
