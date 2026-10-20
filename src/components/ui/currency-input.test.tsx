// @vitest-environment happy-dom
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyInput } from "./currency-input";

describe("CurrencyInput", () => {
  it("renderiza corretamente com placeholder", () => {
    render(
      <CurrencyInput
        placeholder="R$ 0,00"
        data-testid="currency-input"
        id="promo-price"
      />,
    );

    const input = screen.getByTestId("currency-input") as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.placeholder).toBe("R$ 0,00");
    expect(input.value).toBe("");
    expect(input.getAttribute("inputmode")).toBe("numeric");
  });

  it("formata valor inicial se fornecido sem prefixo ou com valor", () => {
    render(<CurrencyInput value="89,90" data-testid="currency-input" />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;
    expect(input.value).toBe("R$ 89,90");
  });

  it("formata digitação sequencial de dígitos como moeda BRL (centavo shift)", () => {
    function ControlledTest() {
      const [val, setVal] = useState("");
      return (
        <CurrencyInput
          data-testid="currency-input"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      );
    }

    render(<ControlledTest />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;

    // Digita '8' -> R$ 0,08
    fireEvent.change(input, { target: { value: "8" } });
    expect(input.value).toBe("R$ 0,08");

    // Digita '9' -> R$ 0,89
    fireEvent.change(input, { target: { value: "R$ 0,089" } });
    expect(input.value).toBe("R$ 0,89");

    // Digita '9' -> R$ 8,99
    fireEvent.change(input, { target: { value: "R$ 0,899" } });
    expect(input.value).toBe("R$ 8,99");

    // Digita '0' -> R$ 89,90
    fireEvent.change(input, { target: { value: "R$ 8,990" } });
    expect(input.value).toBe("R$ 89,90");
  });

  it("permite apagar via Backspace até esvaziar o campo", () => {
    function ControlledTest() {
      const [val, setVal] = useState("R$ 89,90");
      return (
        <CurrencyInput
          data-testid="currency-input"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      );
    }

    render(<ControlledTest />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;
    expect(input.value).toBe("R$ 89,90");

    // Backspace no último caractere ('0')
    fireEvent.change(input, { target: { value: "R$ 89,9" } });
    expect(input.value).toBe("R$ 8,99");

    // Backspace repetido
    fireEvent.change(input, { target: { value: "R$ 8,9" } });
    expect(input.value).toBe("R$ 0,89");

    fireEvent.change(input, { target: { value: "R$ 0,8" } });
    expect(input.value).toBe("R$ 0,08");

    fireEvent.change(input, { target: { value: "R$ 0,0" } });
    expect(input.value).toBe("");
  });

  it("trata colagem (paste) inteligente de inteiros e decimais", () => {
    function ControlledTest() {
      const [val, setVal] = useState("");
      return (
        <CurrencyInput
          data-testid="currency-input"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      );
    }

    render(<ControlledTest />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;

    // Cola '89' (sem centavos) -> vira R$ 89,00
    fireEvent.paste(input, {
      clipboardData: { getData: () => "89" },
    });
    expect(input.value).toBe("R$ 89,00");

    // Cola '49,90' -> vira R$ 49,90
    fireEvent.paste(input, {
      clipboardData: { getData: () => "49,90" },
    });
    expect(input.value).toBe("R$ 49,90");
  });

  it("propaga atributos de acessibilidade e estados desabilitados", () => {
    render(
      <CurrencyInput
        data-testid="currency-input"
        disabled
        aria-invalid="true"
        aria-label="Preço promocional"
      />,
    );

    const input = screen.getByTestId("currency-input") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-label")).toBe("Preço promocional");
  });
});
