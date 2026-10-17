import { createStart, createCsrfMiddleware } from "@tanstack/react-start";
import { requestLoggingMiddleware } from "@/server/logger/middleware";

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      filter: (ctx) => ctx.handlerType === "serverFn",
    }),
    requestLoggingMiddleware,
  ],
}));
