// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  usePreviewQuota,
  formatRemainingQuotaLabel,
  formatBlockedReasonMessage,
} from "./use-preview-quota";
import type { GetPreviewQuotaOutput } from "../data/offer-brief.schema";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe("usePreviewQuota Hook & Helpers", () => {
  describe("formatRemainingQuotaLabel", () => {
    it("deve formatar corretamente para 2, 1 e 0 restantes", () => {
      expect(formatRemainingQuotaLabel(2)).toBe(
        "2 prévias grátis restantes hoje",
      );
      expect(formatRemainingQuotaLabel(1)).toBe(
        "1 prévia grátis restante hoje",
      );
      expect(formatRemainingQuotaLabel(0)).toBe(
        "0 prévias grátis restantes hoje",
      );
      expect(formatRemainingQuotaLabel(null)).toBe("");
      expect(formatRemainingQuotaLabel(undefined)).toBe("");
    });
  });

  describe("formatBlockedReasonMessage", () => {
    it("deve retornar texto explicativo específico para cada motivo de bloqueio", () => {
      expect(formatBlockedReasonMessage("visitor")).toContain(
        "2 prévias grátis de hoje para este navegador",
      );
      expect(formatBlockedReasonMessage("ip")).toContain("conexão local");
      expect(formatBlockedReasonMessage("global")).toContain(
        "esgotadas por hoje",
      );
    });
  });

  describe("usePreviewQuota Query", () => {
    it("deve carregar cota com sucesso e refletir remaining e isBlocked = false", async () => {
      const mockQuotaFn = vi
        .fn()
        .mockImplementation(async (): Promise<GetPreviewQuotaOutput> => ({
          remaining: 2,
          blockedReason: null,
        }));

      const { result } = renderHook(
        () => usePreviewQuota({ getPreviewQuotaFn: mockQuotaFn }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.remaining).toBe(2);
      expect(result.current.blockedReason).toBeNull();
      expect(result.current.isBlocked).toBe(false);
      expect(result.current.remainingLabel).toBe(
        "2 prévias grátis restantes hoje",
      );
      expect(result.current.blockedMessage).toBeNull();
    });

    it("deve marcar isBlocked = true quando remaining === 0 mesmo sem blockedReason explícito", async () => {
      const mockQuotaFn = vi
        .fn()
        .mockImplementation(async (): Promise<GetPreviewQuotaOutput> => ({
          remaining: 0,
          blockedReason: null,
        }));

      const { result } = renderHook(
        () => usePreviewQuota({ getPreviewQuotaFn: mockQuotaFn }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.remaining).toBe(0);
      expect(result.current.isBlocked).toBe(true);
      expect(result.current.remainingLabel).toBe(
        "0 prévias grátis restantes hoje",
      );
    });

    it("deve refletir motivo de bloqueio 'visitor' quando fornecido pelo backend", async () => {
      const mockQuotaFn = vi
        .fn()
        .mockImplementation(async (): Promise<GetPreviewQuotaOutput> => ({
          remaining: 0,
          blockedReason: "visitor",
        }));

      const { result } = renderHook(
        () => usePreviewQuota({ getPreviewQuotaFn: mockQuotaFn }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.remaining).toBe(0);
      expect(result.current.blockedReason).toBe("visitor");
      expect(result.current.isBlocked).toBe(true);
      expect(result.current.blockedMessage).toContain(
        "2 prévias grátis de hoje para este navegador",
      );
    });

    it("deve refletir motivo de bloqueio 'ip' quando fornecido pelo backend", async () => {
      const mockQuotaFn = vi
        .fn()
        .mockImplementation(async (): Promise<GetPreviewQuotaOutput> => ({
          remaining: 0,
          blockedReason: "ip",
        }));

      const { result } = renderHook(
        () => usePreviewQuota({ getPreviewQuotaFn: mockQuotaFn }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.blockedReason).toBe("ip");
      expect(result.current.isBlocked).toBe(true);
      expect(result.current.blockedMessage).toContain("conexão local");
    });

    it("deve refletir motivo de bloqueio 'global' quando teto diário for atingido", async () => {
      const mockQuotaFn = vi
        .fn()
        .mockImplementation(async (): Promise<GetPreviewQuotaOutput> => ({
          remaining: 0,
          blockedReason: "global",
        }));

      const { result } = renderHook(
        () => usePreviewQuota({ getPreviewQuotaFn: mockQuotaFn }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.blockedReason).toBe("global");
      expect(result.current.isBlocked).toBe(true);
      expect(result.current.blockedMessage).toContain("esgotadas por hoje");
    });
  });
});
