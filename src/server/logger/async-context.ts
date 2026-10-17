import "@tanstack/react-start/server-only";
import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestLogStore {
  requestId: string;
  pathname: string;
  method: string;
  startTime: number;
  customContext?: Record<string, unknown>;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestLogStore>();

/**
 * Executa uma função dentro do contexto assíncrono da requisição atual.
 */
export function runWithRequestContext<T>(
  store: RequestLogStore,
  fn: () => T | Promise<T>,
): Promise<T> {
  return asyncLocalStorage.run(store, async () => {
    return await fn();
  });
}

/**
 * Retorna os dados da requisição atual armazenados no AsyncLocalStorage, se existirem.
 */
export function getCurrentRequestStore(): RequestLogStore | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Retorna o trace context com requestId ativo para correlação de logs distribuídos.
 */
export function getTraceContext(): { requestId?: string } {
  const store = asyncLocalStorage.getStore();
  return store ? { requestId: store.requestId } : {};
}
