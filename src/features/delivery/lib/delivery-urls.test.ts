// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { toAbsoluteOrderUrl } from "./delivery-urls";

describe("toAbsoluteOrderUrl helper", () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("retorna a própria URL se ela já for absoluta com https", () => {
    const url = "https://ofertapronta.com/pedido/123-abc";
    expect(toAbsoluteOrderUrl(url)).toBe(url);
  });

  it("retorna a própria URL se ela já for absoluta com http", () => {
    const url = "http://localhost:3000/pedido/123-abc";
    expect(toAbsoluteOrderUrl(url)).toBe(url);
  });

  it("retorna string vazia se o input for vazio ou falsy", () => {
    expect(toAbsoluteOrderUrl("")).toBe("");
  });

  it("adiciona o origin da window quando o caminho for relativo começando com /", () => {
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        origin: "https://minha-loja.com",
      },
      writable: true,
    });

    expect(
      toAbsoluteOrderUrl("/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24"),
    ).toBe(
      "https://minha-loja.com/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24",
    );
  });

  it("adiciona o origin da window quando o caminho for relativo sem / inicial", () => {
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        origin: "https://minha-loja.com",
      },
      writable: true,
    });

    expect(
      toAbsoluteOrderUrl("pedido/a4959c0e-36df-41fc-92e6-af2420a86a24"),
    ).toBe(
      "https://minha-loja.com/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24",
    );
  });

  it("usa fallback de clientEnv quando window.location.origin não estiver disponível", () => {
    Object.defineProperty(window, "location", {
      value: undefined,
      writable: true,
    });

    const result = toAbsoluteOrderUrl("/pedido/xyz");
    expect(result).toMatch(/^https?:\/\/.+\/pedido\/xyz$/);
  });
});
