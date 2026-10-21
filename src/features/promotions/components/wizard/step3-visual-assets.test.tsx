// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step3VisualAssets } from "./step3-visual-assets";

describe("Step3VisualAssets", () => {
  it("renderiza os 3 cartões de upload e a opção de criar 100% com IA quando sem imagens", () => {
    const onSkipAllImages = vi.fn();

    render(
      <Step3VisualAssets
        onProductImageChange={vi.fn()}
        onReferenceImageChange={vi.fn()}
        onLogoImageChange={vi.fn()}
        onSkipAllImages={onSkipAllImages}
      />,
    );

    expect(screen.getByText(/Quer enviar alguma imagem\?/i)).toBeDefined();
    expect(screen.getByTestId("photo-card-product")).toBeDefined();
    expect(screen.getByTestId("photo-card-reference")).toBeDefined();
    expect(screen.getByTestId("photo-card-logo")).toBeDefined();

    expect(
      screen.getByText(/Se não tiver fotos, a IA cria tudo para você/i),
    ).toBeDefined();

    // Botão limpo para continuar sem imagem
    const skipButton = screen.getByTestId("btn-skip-all-images");
    expect(skipButton).toBeDefined();
    expect(
      screen.getByText(/Não tenho imagens \(a IA cria tudo\)/i),
    ).toBeDefined();

    // Clica no botão de ação da opção
    fireEvent.click(skipButton);
    expect(onSkipAllImages).toHaveBeenCalledTimes(1);
  });

  it("não exibe a opção de pular se houver alguma imagem carregada", () => {
    render(
      <Step3VisualAssets
        productImageDataUrl="data:image/png;base64,test"
        onProductImageChange={vi.fn()}
        onReferenceImageChange={vi.fn()}
        onLogoImageChange={vi.fn()}
        onSkipAllImages={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("btn-skip-all-images")).toBeNull();
    expect(screen.queryByText(/ou se preferir/i)).toBeNull();
  });
});
