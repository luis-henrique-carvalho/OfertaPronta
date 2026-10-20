import { describe, expect, it } from "vitest";
import {
  formatBRL,
  maskCurrency,
  parsePastedCurrency,
  parseCurrencyToCents,
} from "./currency";

describe("formatBRL", () => {
  it("formata centavos corretamente para Real Brasileiro", () => {
    expect(formatBRL(990)).toBe("R$ 9,90");
    expect(formatBRL(8990)).toBe("R$ 89,90");
    expect(formatBRL(0)).toBe("R$ 0,00");
    expect(formatBRL(125050)).toBe("R$ 1.250,50");
  });
});

describe("maskCurrency", () => {
  it("retorna string vazia para valores nulos, vazios ou indefinidos", () => {
    expect(maskCurrency("")).toBe("");
    expect(maskCurrency(null)).toBe("");
    expect(maskCurrency(undefined)).toBe("");
    expect(maskCurrency("   ")).toBe("");
  });

  it("retorna string vazia para zero ou ausência de dígitos válidos", () => {
    expect(maskCurrency("0")).toBe("");
    expect(maskCurrency("00")).toBe("");
    expect(maskCurrency("abc")).toBe("");
  });

  it("aplica fluxo sequencial de centavos (centavo shift) corretamente", () => {
    expect(maskCurrency("8")).toBe("R$ 0,08");
    expect(maskCurrency("89")).toBe("R$ 0,89");
    expect(maskCurrency("899")).toBe("R$ 8,99");
    expect(maskCurrency("8990")).toBe("R$ 89,90");
  });

  it("mantém idempotência quando o valor já está formatado com R$", () => {
    expect(maskCurrency("R$ 89,90")).toBe("R$ 89,90");
    expect(maskCurrency("R$ 1.250,00")).toBe("R$ 1.250,00");
  });

  it("formata valores grandes corretamente com separador de milhar", () => {
    expect(maskCurrency("150000")).toBe("R$ 1.500,00");
    expect(maskCurrency("999999")).toBe("R$ 9.999,99");
  });

  it("suporta sequência de digitação simulando teclado numérico", () => {
    let current = "";
    // Usuário digita 8 -> 9 -> 9 -> 0
    current = maskCurrency(current + "8");
    expect(current).toBe("R$ 0,08");

    current = maskCurrency(current + "9");
    expect(current).toBe("R$ 0,89");

    current = maskCurrency(current + "9");
    expect(current).toBe("R$ 8,99");

    current = maskCurrency(current + "0");
    expect(current).toBe("R$ 89,90");
  });

  it("suporta remoção com tecla Backspace até esvaziar o campo", () => {
    let current = "R$ 89,90";
    current = maskCurrency(current.slice(0, -1)); // remove '0'
    expect(current).toBe("R$ 8,99");

    current = maskCurrency(current.slice(0, -1)); // remove '9'
    expect(current).toBe("R$ 0,89");

    current = maskCurrency(current.slice(0, -1)); // remove '9'
    expect(current).toBe("R$ 0,08");

    current = maskCurrency(current.slice(0, -1)); // remove '8'
    expect(current).toBe("");
  });
});

describe("parsePastedCurrency", () => {
  it("interpreta números inteiros colados sem decimais como reais inteiros", () => {
    expect(parsePastedCurrency("89")).toBe("R$ 89,00");
    expect(parsePastedCurrency("150")).toBe("R$ 150,00");
    expect(parsePastedCurrency("25")).toBe("R$ 25,00");
  });

  it("formata valores colados com vírgula ou ponto decimal", () => {
    expect(parsePastedCurrency("89,90")).toBe("R$ 89,90");
    expect(parsePastedCurrency("89.90")).toBe("R$ 89,90");
    expect(parsePastedCurrency("1250,50")).toBe("R$ 1.250,50");
  });

  it("preserva valores colados já com prefixo monetário", () => {
    expect(parsePastedCurrency("R$ 89,90")).toBe("R$ 89,90");
    expect(parsePastedCurrency("R$ 89")).toBe("R$ 89,00");
  });

  it("retorna vazio se o texto colado não tiver dígitos ou for vazio", () => {
    expect(parsePastedCurrency("")).toBe("");
    expect(parsePastedCurrency("promoção")).toBe("");
  });
});

describe("parseCurrencyToCents", () => {
  it("extrai centavos numéricos corretamente", () => {
    expect(parseCurrencyToCents("R$ 89,90")).toBe(8990);
    expect(parseCurrencyToCents("R$ 9,90")).toBe(990);
    expect(parseCurrencyToCents("")).toBe(0);
    expect(parseCurrencyToCents(null)).toBe(0);
  });
});
