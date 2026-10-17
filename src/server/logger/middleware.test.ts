import { describe, it, expect, vi } from "vitest";
import { requestLoggingMiddleware } from "./middleware";
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
});
