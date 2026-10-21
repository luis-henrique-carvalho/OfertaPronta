// @vitest-environment happy-dom
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step4StyleAndPalette } from "./step4-style-and-palette";
import { CREATION_CATALOG } from "../../data/creation-catalog";

const mockSegmentData = CREATION_CATALOG.fashion;

describe("Step4StyleAndPalette", () => {
  it("renderiza a seção de personalização e ajustes com label e textarea", () => {
    render(
      <Step4StyleAndPalette
        segmentData={mockSegmentData}
        businessName="Boutique Flor"
        offerTitle="Vestido Elegance"
        onSelectStyle={vi.fn()}
        onCustomStyleNoteChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        /Quer personalizar o estilo ou fazer algum ajuste\? \(Opcional\)/i,
      ),
    ).toBeDefined();

    expect(
      screen.getByText(
        /Escolha uma paleta rápida ou escreva suas preferências de estilo/i,
      ),
    ).toBeDefined();

    const textarea = screen.getByTestId(
      "input-custom-palette",
    ) as HTMLTextAreaElement;
    expect(textarea).toBeDefined();
    expect(textarea.placeholder).toContain("Paleta: Preto e Dourado");
  });

  it("permite selecionar uma paleta e adiciona 'Paleta: [cores]' preservando as opiniões do usuário", () => {
    function TestWrapper() {
      const [note, setNote] = useState("");
      return (
        <Step4StyleAndPalette
          segmentData={mockSegmentData}
          businessName="Boutique Flor"
          offerTitle="Vestido Elegance"
          customStyleNote={note}
          onSelectStyle={vi.fn()}
          onCustomStyleNoteChange={setNote}
        />
      );
    }

    render(<TestWrapper />);

    const textarea = screen.getByTestId(
      "input-custom-palette",
    ) as HTMLTextAreaElement;
    const blackGoldChip = screen.getByTestId("palette-chip-black-gold");
    const redYellowChip = screen.getByTestId("palette-chip-red-yellow");

    // 1. Clica no chip Preto e Dourado
    fireEvent.click(blackGoldChip);
    expect(textarea.value).toBe("Paleta: Preto e Dourado");
    expect(blackGoldChip.getAttribute("aria-pressed")).toBe("true");

    // 2. Usuário digita uma instrução/opinião adicional
    fireEvent.change(textarea, {
      target: {
        value: "Paleta: Preto e Dourado. Quero um estilo rústico com madeira",
      },
    });
    expect(textarea.value).toBe(
      "Paleta: Preto e Dourado. Quero um estilo rústico com madeira",
    );

    // 3. Usuário troca para a paleta Vermelho & Amarelo: substitui a paleta mas preserva a instrução
    fireEvent.click(redYellowChip);
    expect(textarea.value).toBe(
      "Paleta: Vermelho e Amarelo. Quero um estilo rústico com madeira",
    );
    expect(redYellowChip.getAttribute("aria-pressed")).toBe("true");
    expect(blackGoldChip.getAttribute("aria-pressed")).toBe("false");

    // 4. Usuário clica no chip Vermelho & Amarelo novamente para desmarcar: remove a paleta e mantém a opinião
    fireEvent.click(redYellowChip);
    expect(textarea.value).toBe("Quero um estilo rústico com madeira");
    expect(redYellowChip.getAttribute("aria-pressed")).toBe("false");
  });

  it("adiciona 'Paleta: [cores]' se o usuário já havia digitado uma instrução prévia", () => {
    function TestWrapper() {
      const [note, setNote] = useState(
        "Gostaria de iluminação suave de estúdio",
      );
      return (
        <Step4StyleAndPalette
          segmentData={mockSegmentData}
          businessName="Boutique Flor"
          offerTitle="Vestido Elegance"
          customStyleNote={note}
          onSelectStyle={vi.fn()}
          onCustomStyleNoteChange={setNote}
        />
      );
    }

    render(<TestWrapper />);

    const textarea = screen.getByTestId(
      "input-custom-palette",
    ) as HTMLTextAreaElement;
    const blueWhiteChip = screen.getByTestId("palette-chip-blue-white");

    fireEvent.click(blueWhiteChip);
    expect(textarea.value).toBe(
      "Paleta: Azul Marinho e Branco. Gostaria de iluminação suave de estúdio",
    );
  });

  it("desmarca os cards predefinidos ao selecionar paleta ou digitar texto, e limpa texto ao clicar em um card", () => {
    function TestWrapper() {
      const [styleId, setStyleId] = useState<string | null>(
        mockSegmentData.styles[0].id,
      );
      const [note, setNote] = useState("");
      return (
        <Step4StyleAndPalette
          segmentData={mockSegmentData}
          selectedStyleId={styleId}
          businessName="Boutique Flor"
          offerTitle="Vestido Elegance"
          customStyleNote={note}
          onSelectStyle={setStyleId}
          onCustomStyleNoteChange={setNote}
        />
      );
    }

    render(<TestWrapper />);

    // 1. Inicialmente sem nota customizada: um card de estilo deve estar selecionado
    expect(screen.queryByTestId("selected-check-icon")).not.toBeNull();

    // 2. Seleciona uma paleta rápida abaixo: os cards de estilo de cima devem perder a seleção
    const redYellowChip = screen.getByTestId("palette-chip-red-yellow");
    fireEvent.click(redYellowChip);

    expect(screen.queryByTestId("selected-check-icon")).toBeNull();

    // 3. Usuário clica em um card de estilo de cima: ele assume a seleção e limpa o campo personalizado
    const styleCards = screen.getAllByTestId("style-mini-post-card");
    fireEvent.click(styleCards[1]);

    // O card clicado agora deve estar selecionado
    expect(screen.queryByTestId("selected-check-icon")).not.toBeNull();

    // O campo personalizado deve ter sido limpo
    const textarea = screen.getByTestId(
      "input-custom-palette",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
    expect(redYellowChip.getAttribute("aria-pressed")).toBe("false");
  });
});
