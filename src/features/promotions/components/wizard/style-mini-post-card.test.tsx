// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StyleMiniPostCard } from "./style-mini-post-card";
import {
  getCreationSegment,
  type StyleVisualOption,
} from "../../data/creation-catalog";

describe("StyleMiniPostCard", () => {
  const fashionSegment = getCreationSegment("fashion");
  const testStyle: StyleVisualOption = fashionSegment.styles[0]; // fashion-boutique

  const defaultProps = {
    style: testStyle,
    segmentData: fashionSegment,
    isSelected: false,
    businessName: "",
    offerTitle: "",
    promoPrice: "",
    productImageDataUrl: null,
    onSelect: vi.fn(),
  };

  it("renderiza o mini-post interpolando os placeholders padrão do segmento quando dados do comerciante estiverem vazios", () => {
    render(<StyleMiniPostCard {...defaultProps} />);

    // Nome da loja padrão de fashion
    expect(
      screen.getByText(fashionSegment.placeholders.businessName),
    ).toBeDefined();

    // Título da oferta padrão
    expect(
      screen.getByText(fashionSegment.placeholders.offerTitle),
    ).toBeDefined();

    // Sem preço preenchido: exibe mensagem alternativa amigável
    expect(screen.getByText("Confira na loja")).toBeDefined();

    // Nome do estilo e tag no rodapé
    expect(screen.getByText(testStyle.name)).toBeDefined();
    expect(screen.getByText(testStyle.tag)).toBeDefined();

    // Não deve exibir o ícone de selecionado
    expect(screen.queryByTestId("selected-check-icon")).toBeNull();
  });

  it("interpola os dados reais do comerciante quando fornecidos", () => {
    render(
      <StyleMiniPostCard
        {...defaultProps}
        businessName="Loja da Maria"
        offerTitle="Vestido Longo Verão"
        promoPrice="R$ 149,90"
      />,
    );

    expect(screen.getByText("Loja da Maria")).toBeDefined();
    expect(screen.getByText("Vestido Longo Verão")).toBeDefined();
    expect(screen.getByText("R$ 149,90")).toBeDefined();
    expect(screen.queryByText("Confira na loja")).toBeNull();
  });

  it("suporta aliases title e price como alternativas para offerTitle e promoPrice", () => {
    render(
      <StyleMiniPostCard
        style={testStyle}
        segmentData={fashionSegment}
        isSelected={false}
        businessName="Boutique Elegance"
        title="Camisa de Seda"
        price="R$ 199,00"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Boutique Elegance")).toBeDefined();
    expect(screen.getByText("Camisa de Seda")).toBeDefined();
    expect(screen.getByText("R$ 199,00")).toBeDefined();
  });

  it("renderiza imagem do produto no centro e overlay estético de fundo quando productImageDataUrl estiver presente", () => {
    const testImage = "data:image/jpeg;base64,mockedbase64image";

    render(
      <StyleMiniPostCard {...defaultProps} productImageDataUrl={testImage} />,
    );

    const images = screen.getAllByRole("img", { hidden: true });
    expect(images.length).toBeGreaterThanOrEqual(1);

    const productPreview = screen.getByAltText("Preview do produto");
    expect(productPreview).toBeDefined();
    expect(productPreview.getAttribute("src")).toBe(testImage);
  });

  it("suporta alias productImage quando productImageDataUrl não for passado", () => {
    const testImage = "data:image/png;base64,samplepng";

    render(<StyleMiniPostCard {...defaultProps} productImage={testImage} />);

    const productPreview = screen.getByAltText("Preview do produto");
    expect(productPreview.getAttribute("src")).toBe(testImage);
  });

  it("aplica estilos visuais e atributos de acessibilidade quando selecionado", () => {
    const onSelect = vi.fn();

    render(
      <StyleMiniPostCard
        {...defaultProps}
        isSelected={true}
        onSelect={onSelect}
      />,
    );

    const card = screen.getByRole("button");
    expect(card.getAttribute("aria-pressed")).toBe("true");
    expect(card.className).toContain("border-primary");
    expect(card.className).toContain("ring-2");
    expect(card.className).toContain("ring-primary");

    // Ícone de confirmação visível quando isSelected === true
    expect(screen.getByTestId("selected-check-icon")).toBeDefined();
  });

  it("chama onSelect ao clicar no cartão", () => {
    const onSelect = vi.fn();

    render(<StyleMiniPostCard {...defaultProps} onSelect={onSelect} />);

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("chama onSelect via teclado ao pressionar Enter ou Espaço", () => {
    const onSelect = vi.fn();

    render(<StyleMiniPostCard {...defaultProps} onSelect={onSelect} />);

    const card = screen.getByRole("button");

    fireEvent.keyDown(card, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);

    // Tecla qualquer não deve disparar
    fireEvent.keyDown(card, { key: "Tab" });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("renderiza os swatches da paleta cromática do estilo no rodapé", () => {
    render(<StyleMiniPostCard {...defaultProps} />);

    const paletteContainer = screen.getByLabelText(
      `Paleta de cores ${testStyle.tag}`,
    );
    expect(paletteContainer).toBeDefined();

    // Deve conter os 3 círculos de cores da paleta
    expect(paletteContainer.children).toHaveLength(3);
  });
});
