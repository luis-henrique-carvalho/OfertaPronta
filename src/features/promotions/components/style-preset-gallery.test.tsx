// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StylePresetGallery } from "./style-preset-gallery";
import { getSegmentPresets } from "../data/style-presets-catalog";

describe("StylePresetGallery", () => {
  const defaultProps = {
    segment: "supermarket" as const,
    stylePresetId: "market-discount",
    referenceImageDataUrl: undefined,
    customStyleInstructions: "",
    imageError: null,
    onStylePresetChange: vi.fn(),
    onReferenceImageChange: vi.fn(),
    onCustomStyleInstructionsChange: vi.fn(),
    onFileUpload: vi.fn(),
  };

  const switchTab = (tabElement: HTMLElement) => {
    fireEvent.keyDown(tabElement, { key: "Enter", code: "Enter" });
  };

  it("renderiza por padrão a aba 'Estilos Prontos (Galeria)' ativa com os 4 cartões do segmento", () => {
    render(<StylePresetGallery {...defaultProps} />);

    // Aba ativa
    const tabPresets = screen.getByTestId("tab-presets");
    expect(tabPresets.getAttribute("data-state")).toBe("active");
    expect(screen.getByTestId("tab-content-presets")).toBeDefined();

    // 4 cartões de supermercado presentes
    const supermarketPresets = getSegmentPresets("supermarket");
    expect(supermarketPresets).toHaveLength(4);

    supermarketPresets.forEach((preset) => {
      const card = screen.getByTestId(`preset-card-${preset.id}`);
      expect(card).toBeDefined();
      expect(screen.getByText(preset.label)).toBeDefined();

      // Miniatura vetorial presente dentro do próprio cartão
      expect(
        card.querySelector(
          `[data-testid="style-mockup-${preset.mockup.layoutVariant}"]`,
        ),
      ).not.toBeNull();
    });
  });

  it("renderiza os estilos corretos ao trocar o segmento (ex: pizzaria)", () => {
    render(
      <StylePresetGallery
        {...defaultProps}
        segment="pizzeria"
        stylePresetId="pizza-rustic-wood"
      />,
    );

    const pizzeriaPresets = getSegmentPresets("pizzeria");
    expect(pizzeriaPresets).toHaveLength(4);

    pizzeriaPresets.forEach((preset) => {
      expect(screen.getByTestId(`preset-card-${preset.id}`)).toBeDefined();
      expect(screen.getByText(preset.label)).toBeDefined();
    });
  });

  it("exibe destaque visual, anel e checkmark no estilo selecionado", () => {
    render(
      <StylePresetGallery {...defaultProps} stylePresetId="market-discount" />,
    );

    const selectedCard = screen.getByTestId("preset-card-market-discount");
    expect(selectedCard.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByTestId("preset-selected-badge-market-discount"),
    ).toBeDefined();

    const otherCard = screen.getByTestId("preset-card-market-fresh");
    expect(otherCard.getAttribute("aria-pressed")).toBe("false");
    expect(
      screen.queryByTestId("preset-selected-badge-market-fresh"),
    ).toBeNull();
  });

  it("seleção em 1 toque: clicar no cartão dispara onStylePresetChange com o id do preset", () => {
    const onStylePresetChange = vi.fn();
    render(
      <StylePresetGallery
        {...defaultProps}
        onStylePresetChange={onStylePresetChange}
      />,
    );

    const targetCard = screen.getByTestId("preset-card-market-fresh");
    fireEvent.click(targetCard);

    expect(onStylePresetChange).toHaveBeenCalledWith("market-fresh");
  });

  it("exclusividade mútua: clicar em um estilo quando há imagem de referência prévia limpa a referência", () => {
    const onStylePresetChange = vi.fn();
    const onReferenceImageChange = vi.fn();

    render(
      <StylePresetGallery
        {...defaultProps}
        referenceImageDataUrl="data:image/png;base64,samplephoto"
        onStylePresetChange={onStylePresetChange}
        onReferenceImageChange={onReferenceImageChange}
      />,
    );

    // Como havia referência manual, o componente iniciou na aba de arte própria.
    // O microempresário decide voltar para a galeria e escolher um preset:
    switchTab(screen.getByTestId("tab-presets"));

    const targetCard = screen.getByTestId("preset-card-market-premium");
    fireEvent.click(targetCard);

    expect(onStylePresetChange).toHaveBeenCalledWith("market-premium");
    expect(onReferenceImageChange).toHaveBeenCalledWith(undefined);
  });

  it("permite alternar para a aba 'Enviar Arte Própria' e exibe o uploader", () => {
    render(<StylePresetGallery {...defaultProps} />);

    const tabCustom = screen.getByTestId("tab-custom-reference");
    switchTab(tabCustom);

    expect(tabCustom.getAttribute("data-state")).toBe("active");
    expect(screen.getByTestId("upload-reference-image-button")).toBeDefined();
    expect(
      screen.getByText("Enviar arte ou print de referência"),
    ).toBeDefined();
  });

  it("exclusividade mútua no upload: enviar arte própria limpa o stylePresetId ativo", () => {
    const onStylePresetChange = vi.fn();
    const onReferenceImageChange = vi.fn();

    // Mock do onFileUpload chamando o callback de sucesso com a dataUrl
    const onFileUpload = vi.fn((_e, onSuccess) => {
      onSuccess("data:image/jpeg;base64,newreference");
    });

    render(
      <StylePresetGallery
        {...defaultProps}
        stylePresetId="market-discount"
        onStylePresetChange={onStylePresetChange}
        onReferenceImageChange={onReferenceImageChange}
        onFileUpload={onFileUpload}
      />,
    );

    // Alterna para aba de arte própria
    switchTab(screen.getByTestId("tab-custom-reference"));

    const fileInput = screen.getByTestId("reference-image-file-input");
    const testFile = new File(["sample"], "ref.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(onFileUpload).toHaveBeenCalledTimes(1);
    expect(onReferenceImageChange).toHaveBeenCalledWith(
      "data:image/jpeg;base64,newreference",
    );
    expect(onStylePresetChange).toHaveBeenCalledWith(undefined);
  });

  it("exibe preview e botão de remoção na aba de arte própria quando referenceImageDataUrl for informada", () => {
    const onReferenceImageChange = vi.fn();
    const sampleUrl = "data:image/jpeg;base64,activecustom";

    render(
      <StylePresetGallery
        {...defaultProps}
        referenceImageDataUrl={sampleUrl}
        onReferenceImageChange={onReferenceImageChange}
      />,
    );

    // Aba de arte própria deve estar ativa se referenceImageDataUrl estiver informada
    expect(
      screen.getByTestId("tab-custom-reference").getAttribute("data-state"),
    ).toBe("active");

    const preview = screen.getByTestId(
      "reference-image-preview",
    ) as HTMLImageElement;
    expect(preview.src).toBe(sampleUrl);

    const removeBtn = screen.getByTestId("remove-reference-image-button");
    expect(removeBtn).toBeDefined();

    fireEvent.click(removeBtn);
    expect(onReferenceImageChange).toHaveBeenCalledWith(undefined);
  });

  it("exibe mensagem de erro na aba de arte própria quando imageError for passado", () => {
    render(
      <StylePresetGallery
        {...defaultProps}
        imageError="Formato de imagem não suportado."
      />,
    );

    switchTab(screen.getByTestId("tab-custom-reference"));

    const errorAlert = screen.getByTestId("reference-image-error");
    expect(errorAlert).toBeDefined();
    expect(errorAlert.getAttribute("role")).toBe("alert");
    expect(screen.getByText("Formato de imagem não suportado.")).toBeDefined();
  });

  it("permite abrir o diálogo de detalhes do estilo e escolher o estilo através dele", () => {
    const onStylePresetChange = vi.fn();
    render(
      <StylePresetGallery
        {...defaultProps}
        onStylePresetChange={onStylePresetChange}
      />,
    );

    const infoBtn = screen.getByTestId("preset-info-button-market-discount");
    fireEvent.click(infoBtn);

    // Diálogo aberto com detalhes (Linguagem do Comerciante)
    expect(screen.getByText("Aparência:")).toBeDefined();
    expect(screen.getByText("Cores:")).toBeDefined();
    expect(screen.getByText("Sensação pro seu cliente:")).toBeDefined();
    expect(screen.getByText("Ideal para:")).toBeDefined();

    const chooseBtn = screen.getByTestId(
      "dialog-choose-preset-market-discount",
    );
    expect(chooseBtn).toBeDefined();
    fireEvent.click(chooseBtn);

    expect(onStylePresetChange).toHaveBeenCalledWith("market-discount");
  });

  it("expande as instruções customizadas e emite onCustomStyleInstructionsChange ao digitar", () => {
    const onCustomInstructionsChange = vi.fn();
    render(
      <StylePresetGallery
        {...defaultProps}
        onCustomStyleInstructionsChange={onCustomInstructionsChange}
      />,
    );

    const toggleBtn = screen.getByTestId("toggle-custom-instructions-button");
    fireEvent.click(toggleBtn);

    const textarea = screen.getByTestId("custom-instructions-textarea");
    expect(textarea).toBeDefined();

    fireEvent.change(textarea, {
      target: { value: "Fundo com fumaça escura" },
    });
    expect(onCustomInstructionsChange).toHaveBeenCalledWith(
      "Fundo com fumaça escura",
    );
  });

  it("cumpre os requisitos de acessibilidade ARIA e touch targets mínimos (≥ 44px)", () => {
    render(<StylePresetGallery {...defaultProps} />);

    // Abas possuem role='tab'
    const tab1 = screen.getByTestId("tab-presets");
    const tab2 = screen.getByTestId("tab-custom-reference");
    expect(tab1.getAttribute("role")).toBe("tab");
    expect(tab2.getAttribute("role")).toBe("tab");

    // Todos os botões de presets têm touch target de tamanho adequado e aria-pressed
    getSegmentPresets("supermarket").forEach((preset) => {
      const card = screen.getByTestId(`preset-card-${preset.id}`);
      expect(card.getAttribute("aria-pressed")).toBeDefined();
      expect(card.className).toContain("min-h-[220px]");

      const infoBtn = screen.getByTestId(`preset-info-button-${preset.id}`);
      expect(infoBtn.className).toContain("min-h-[44px]");
      expect(infoBtn.className).toContain("min-w-[44px]");
    });

    // Botão de expandir instruções
    const toggleBtn = screen.getByTestId("toggle-custom-instructions-button");
    expect(toggleBtn.className).toContain("min-h-[44px]");
  });
});
