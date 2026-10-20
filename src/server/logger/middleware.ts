import { createMiddleware } from "@tanstack/react-start";
import { runWithRequestContext, type RequestLogStore } from "./async-context";
import { createServerLogger } from "./index";

export const requestLoggingMiddleware = createMiddleware().server(
  async ({ next, request, pathname }) => {
    const log = createServerLogger("http.request");
    const requestId =
      request.headers.get("x-request-id") || crypto.randomUUID();
    const url = new URL(request.url);
    const startTime = Date.now();
    const path = pathname || url.pathname;

    const store: RequestLogStore = {
      requestId,
      pathname: path,
      method: request.method,
      startTime,
    };

    return runWithRequestContext(store, async () => {
      log.info(`Incoming request: ${request.method} ${path}`, {
        requestId,
        method: request.method,
        pathname: path,
      });

      try {
        const result = await next();
        const durationMs = Date.now() - startTime;

        const response: Response | undefined =
          result instanceof Response ? result : result?.response;

        const status = response?.status ?? 200;

        const logPayload = {
          requestId,
          status,
          durationMs,
        };

        if (status >= 500) {
          log.error(
            `Request completed with server error: ${request.method} ${path}`,
            undefined,
            logPayload,
          );
        } else if (status >= 400) {
          log.warn(
            `Request completed with client error: ${request.method} ${path}`,
            logPayload,
          );
        } else {
          log.info(`Request completed: ${request.method} ${path}`, logPayload);
        }

        if (response) {
          response.headers.set("x-request-id", requestId);
        }

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        log.error(`Request failed: ${request.method} ${path}`, error, {
          requestId,
          durationMs,
        });
        throw error;
      }
    });
  },
);

/**
 * Middleware de Server Function do TanStack Start.
 * Executa no servidor antes e depois de cada createServerFn handler.
 * Captura qualquer exceção não tratada (erros de IA, banco de dados, zod)
 * e gera um log ERROR estruturado antes que o TanStack Start serialize o erro para $TSR/Error.
 */
export const serverFnLoggingMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next, serverFnMeta }) => {
  const log = createServerLogger("server.fn");
  const fnName = serverFnMeta?.name || serverFnMeta?.id || "anonymousServerFn";
  const filename = serverFnMeta?.filename;
  const startTime = Date.now();

  try {
    const result = await next();
    const durationMs = Date.now() - startTime;
    log.debug(`Server function executada com sucesso: ${fnName}`, {
      functionName: fnName,
      filename,
      durationMs,
    });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error(`Server function falhou: ${fnName}`, error, {
      functionName: fnName,
      filename,
      durationMs,
    });
    throw error;
  }
});
