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

        log.info(`Request completed: ${request.method} ${path}`, {
          requestId,
          status,
          durationMs,
        });

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
