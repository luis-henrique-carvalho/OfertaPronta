// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductImageUploaderCard } from "./product-image-uploader-card";

describe("ProductImageUploaderCard", () => {
  const defaultProps = {
    productImageDataUrl: undefined,
    imageError: null,
    onProductImageChange: vi.fn(),
    onFileUpload: vi.fn(),
  };

  it("renderiza o estado inicial vazio com botão acessível de upload", () => {
    render(<ProductImageUploaderCard {...defaultProps} />);

    expect(screen.getByTestId("product-image-uploader-card")).toBeDefined();
    expect(screen.getByText("Foto Real da Sua Oferta")).toBeDefined();
    expect(screen.getByTestId("upload-product-image-button")).toBeDefined();
    expect(screen.queryByTestId("product-image-preview")).toBeNull();
  });

  it("aciona o input de arquivo oculto ao clicar no botão de upload", () => {
    render(<ProductImageUploaderCard {...defaultProps} />);

    const fileInput = screen.getByTestId(
      "product-image-file-input",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    const uploadButton = screen.getByTestId("upload-product-image-button");
    fireEvent.click(uploadButton);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("chama onFileUpload quando um arquivo é selecionado no input", () => {
    const onFileUpload = vi.fn();
    render(
      <ProductImageUploaderCard
        {...defaultProps}
        onFileUpload={onFileUpload}
      />,
    );

    const fileInput = screen.getByTestId("product-image-file-input");
    const testFile = new File(["dummy"], "produto.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput, {
      target: { files: [testFile] },
    });

    expect(onFileUpload).toHaveBeenCalledTimes(1);
  });

  it("renderiza o preview da imagem e botão de remoção quando imageDataUrl for informada", () => {
    const onProductImageChange = vi.fn();
    const testUrl = "data:image/jpeg;base64,samplephoto";

    render(
      <ProductImageUploaderCard
        {...defaultProps}
        productImageDataUrl={testUrl}
        onProductImageChange={onProductImageChange}
      />,
    );

    const preview = screen.getByTestId(
      "product-image-preview",
    ) as HTMLImageElement;
    expect(preview.src).toBe(testUrl);

    const removeBtn = screen.getByTestId("remove-product-image-button");
    expect(removeBtn).toBeDefined();

    fireEvent.click(removeBtn);
    expect(onProductImageChange).toHaveBeenCalledWith(undefined);
  });

  it("exibe mensagem de erro acessível com role='alert' quando imageError for informado", () => {
    render(
      <ProductImageUploaderCard
        {...defaultProps}
        imageError="A imagem selecionada ultrapassa o limite de 4MB."
      />,
    );

    const alert = screen.getByTestId("product-image-error");
    expect(alert).toBeDefined();
    expect(alert.getAttribute("role")).toBe("alert");
    expect(
      screen.getByText("A imagem selecionada ultrapassa o limite de 4MB."),
    ).toBeDefined();
  });
});
