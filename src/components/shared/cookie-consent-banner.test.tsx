// @vitest-environment happy-dom
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  CookieConsentBanner,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_ACCEPTED,
} from "./cookie-consent-banner";

function createStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

describe("CookieConsentBanner", () => {
  let storageMock: ReturnType<typeof createStorageMock>;

  beforeEach(() => {
    storageMock = createStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: storageMock,
      configurable: true,
      writable: true,
    });
    vi.clearAllMocks();
  });

  it("renderiza o banner com o texto explicativo e o botão 'Entendi' no primeiro acesso", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Usamos cookies para melhorar sua experiência e métricas de anúncios.",
        ),
      ).toBeDefined();
    });

    const button = screen.getByRole("button", { name: /entendi/i });
    expect(button).toBeDefined();
  });

  it("ao clicar em 'Entendi', grava a chave no localStorage e oculta o banner", async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /entendi/i })).toBeDefined();
    });

    const button = screen.getByRole("button", { name: /entendi/i });
    fireEvent.click(button);

    expect(storageMock.setItem).toHaveBeenCalledWith(
      COOKIE_CONSENT_KEY,
      COOKIE_CONSENT_ACCEPTED,
    );

    await waitFor(() => {
      expect(
        screen.queryByText(
          "Usamos cookies para melhorar sua experiência e métricas de anúncios.",
        ),
      ).toBeNull();
    });
  });

  it("não renderiza o banner se o usuário já consentiu anteriormente", async () => {
    storageMock.getItem.mockReturnValue(COOKIE_CONSENT_ACCEPTED);

    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.queryByText(
          "Usamos cookies para melhorar sua experiência e métricas de anúncios.",
        ),
      ).toBeNull();
    });
  });

  it("lida graciosamente com falha de leitura no localStorage", async () => {
    storageMock.getItem.mockImplementation(() => {
      throw new Error("SecurityError: localStorage is disabled");
    });

    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /entendi/i })).toBeDefined();
    });
  });

  it("lida graciosamente com falha de escrita no localStorage ao clicar em 'Entendi'", async () => {
    storageMock.setItem.mockImplementation(() => {
      throw new Error("SecurityError: localStorage is disabled");
    });

    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /entendi/i })).toBeDefined();
    });

    const button = screen.getByRole("button", { name: /entendi/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.queryByText(
          "Usamos cookies para melhorar sua experiência e métricas de anúncios.",
        ),
      ).toBeNull();
    });
  });
});
