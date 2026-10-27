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

  it("renderiza o botão gatilho da vitrine com badge e texto destacado", () => {
    render(
      <Step4StyleAndPalette
        segmentData={mockSegmentData}
        businessName="Boutique Flor"
        offerTitle="Vestido Elegance"
        onSelectStyle={vi.fn()}
        onCustomStyleNoteChange={vi.fn()}
      />,
    );

    const showcaseBtn = screen.getByTestId("btn-open-showcase-gallery");
    expect(showcaseBtn).toBeDefined();
    expect(showcaseBtn.textContent).toContain(
      "Ver Exemplos Reais Criados por IA",
    );
    expect(screen.getByText("Inspiração")).toBeDefined();
  });

  it("abre a vitrine ShowcaseGalleryDialog e permite selecionar um estilo em 1 toque", () => {
    const handleSelectStyle = vi.fn();
    render(
      <Step4StyleAndPalette
        segmentData={mockSegmentData}
        businessName="Boutique Flor"
        offerTitle="Vestido Elegance"
        onSelectStyle={handleSelectStyle}
        onCustomStyleNoteChange={vi.fn()}
      />,
    );

    // 1. Clica no botão para abrir a vitrine
    const showcaseBtn = screen.getByTestId("btn-open-showcase-gallery");
    fireEvent.click(showcaseBtn);

    // 2. O modal abre e exibe o grid de cards da vitrine
    expect(screen.getByTestId("showcase-cards-grid")).toBeDefined();
    expect(
      screen.getByText("Vitrine de Artes Prontas para Inspirar"),
    ).toBeDefined();

    // 3. Clica em "Usar como Referência" no primeiro card de exemplo da vitrine
    const useStyleButtons = screen.getAllByRole("button", {
      name: /Usar como Referência|Referência Ativa|Usar este Estilo|Estilo Selecionado/i,
    });
    expect(useStyleButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(useStyleButtons[0]);

    // 4. Verifica que onSelectStyle foi acionado com o preset ID do card
    expect(handleSelectStyle).toHaveBeenCalledTimes(1);
    expect(handleSelectStyle).toHaveBeenCalledWith(expect.any(String));
  });

  it("abre a vitrine e aciona onSelectReference com o card selecionado ao clicar em 'Usar como Referência'", () => {
    const handleSelectReference = vi.fn();
    render(
      <Step4StyleAndPalette
        segmentData={mockSegmentData}
        businessName="Boutique Flor"
        offerTitle="Vestido Elegance"
        onSelectStyle={vi.fn()}
        onSelectReference={handleSelectReference}
        onCustomStyleNoteChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("btn-open-showcase-gallery"));

    const useRefButtons = screen.getAllByRole("button", {
      name: /Usar como Referência/i,
    });
    expect(useRefButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(useRefButtons[0]);

    expect(handleSelectReference).toHaveBeenCalledTimes(1);
    expect(handleSelectReference).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        stylePresetId: expect.any(String),
        imageUrl: expect.stringMatching(/^https?:\/\//),
      }),
    );
  });

  it("renderiza o banner 'Referência da Vitrine Ativa' com miniatura, badges e texto orientativo quando referenceImageDataUrl for da vitrine", () => {
    const handleClearReference = vi.fn();

    render(
      <Step4StyleAndPalette
        segmentData={mockSegmentData}
        selectedStyleId={mockSegmentData.styles[0].id}
        businessName="Boutique Flor"
        offerTitle="Vestido Elegance"
        referenceImageDataUrl="https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/fashion/fashion-elegance.png"
        onSelectStyle={vi.fn()}
        onClearReference={handleClearReference}
        onCustomStyleNoteChange={vi.fn()}
      />,
    );

    // Banner presente
    const banner = screen.getByTestId("active-reference-banner");
    expect(banner).toBeDefined();

    // Badges e textos orientativos
    expect(screen.getByText("Referência Ativa")).toBeDefined();
    expect(screen.getByText("Inspiração da Vitrine")).toBeDefined();
    expect(screen.getByText("Referência da Vitrine Ativa")).toBeDefined();
    expect(
      screen.getByText(
        /A IA usará esta arte para guiar a iluminação, composição e paleta de cores do seu card/i,
      ),
    ).toBeDefined();

    // Miniatura da imagem
    const img = screen.getByAltText("Referência ativa") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toBe(
      "https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/fashion/fashion-elegance.png",
    );

    // Botões de ação
    const changeBtn = screen.getByTestId("btn-change-showcase-reference");
    expect(changeBtn).toBeDefined();
    expect(changeBtn.textContent).toContain("Trocar na Vitrine");

    const removeBtn = screen.getByTestId("btn-remove-reference");
    expect(removeBtn).toBeDefined();
    expect(removeBtn.textContent).toContain("Remover Referência");

    // Acionar remoção de referência
    fireEvent.click(removeBtn);
    expect(handleClearReference).toHaveBeenCalledTimes(1);

    // Acionar troca na vitrine abre o diálogo
    fireEvent.click(changeBtn);
    expect(screen.getByTestId("showcase-cards-grid")).toBeDefined();
  });

  it("sincroniza o grid de estilos destacando o estilo correspondente quando uma referência da vitrine estiver ativa", () => {
    const targetStyle = mockSegmentData.styles[1];

    render(
      <Step4StyleAndPalette
        segmentData={mockSegmentData}
        selectedStyleId={targetStyle.id}
        businessName="Boutique Flor"
        offerTitle="Vestido Elegance"
        referenceImageDataUrl="https://pub-bb1f4a04aa2b49728b1eb1ac9ed6d7ff.r2.dev/showcase/fashion/fashion-elegance.png"
        onSelectStyle={vi.fn()}
        onCustomStyleNoteChange={vi.fn()}
      />,
    );

    // O estilo correspondente do catálogo deve estar destacado/selecionado no grid
    const styleCards = screen.getAllByTestId("style-mini-post-card");
    const targetCard = styleCards[1];
    expect(targetCard.getAttribute("aria-pressed")).toBe("true");

    // O primeiro estilo deve estar desmarcado
    expect(styleCards[0].getAttribute("aria-pressed")).toBe("false");
  });
});
