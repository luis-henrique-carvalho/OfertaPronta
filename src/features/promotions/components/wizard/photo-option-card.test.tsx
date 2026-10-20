// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PhotoOptionCard } from "./photo-option-card";
import { Camera } from "lucide-react";

describe("PhotoOptionCard", () => {
  const defaultProps = {
    icon: <Camera data-testid="camera-icon" className="size-5" />,
    title: "Foto do Produto",
    description: "Foto real da roupa ou produto",
    image: null,
    onRemoveClick: vi.fn(),
  };

  it("renderiza o estado inicial vazio com título, ícone, descrição e botão de upload", () => {
    render(<PhotoOptionCard {...defaultProps} badgeText="Recomendado" />);

    expect(screen.getByTestId("photo-option-card")).toBeDefined();
    expect(screen.getByTestId("camera-icon")).toBeDefined();
    expect(screen.getByText("Foto do Produto")).toBeDefined();
    expect(screen.getByText("Recomendado")).toBeDefined();
    expect(screen.getByText("Foto real da roupa ou produto")).toBeDefined();
    expect(screen.getByTestId("photo-option-upload-button")).toBeDefined();
    expect(screen.queryByTestId("photo-option-image-preview")).toBeNull();
    expect(screen.queryByTestId("photo-option-remove-button")).toBeNull();
    expect(screen.queryByTestId("photo-option-success-badge")).toBeNull();
  });

  it("chama onUploadClick quando fornecido e o botão de upload for clicado", () => {
    const onUploadClick = vi.fn();

    render(<PhotoOptionCard {...defaultProps} onUploadClick={onUploadClick} />);

    const uploadButton = screen.getByTestId("photo-option-upload-button");
    fireEvent.click(uploadButton);

    expect(onUploadClick).toHaveBeenCalledTimes(1);
  });

  it("aciona o input de arquivo oculto quando onUploadClick não for fornecido", () => {
    render(<PhotoOptionCard {...defaultProps} />);

    const fileInput = screen.getByTestId(
      "photo-option-file-input",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    const uploadButton = screen.getByTestId("photo-option-upload-button");
    fireEvent.click(uploadButton);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("o input de arquivo nativo permanece oculto e inacessível ao tab index", () => {
    render(<PhotoOptionCard {...defaultProps} />);

    const fileInput = screen.getByTestId(
      "photo-option-file-input",
    ) as HTMLInputElement;

    expect(fileInput.className).toContain("hidden");
    expect(fileInput.className).toContain("sr-only");
    expect(fileInput.getAttribute("aria-hidden")).toBe("true");
    expect(fileInput.getAttribute("tabindex")).toBe("-1");
  });

  it("chama onFileSelect e onImageChange ao selecionar um arquivo válido", async () => {
    const onFileSelect = vi.fn();
    const onImageChange = vi.fn();

    render(
      <PhotoOptionCard
        {...defaultProps}
        onFileSelect={onFileSelect}
        onImageChange={onImageChange}
      />,
    );

    const fileInput = screen.getByTestId("photo-option-file-input");
    const testFile = new File(["fake-image-content"], "produto.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, {
      target: { files: [testFile] },
    });

    expect(onFileSelect).toHaveBeenCalledWith(testFile);

    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalledTimes(1);
    });
  });

  it("renderiza miniatura, botão de remoção e badge de sucesso quando imagem estiver presente", () => {
    const onRemoveClick = vi.fn();
    const testImage = "data:image/png;base64,sampleimage";

    render(
      <PhotoOptionCard
        {...defaultProps}
        image={testImage}
        imageAlt="Foto da Roupa"
        onRemoveClick={onRemoveClick}
      />,
    );

    const preview = screen.getByTestId(
      "photo-option-image-preview",
    ) as HTMLImageElement;
    expect(preview).toBeDefined();
    expect(preview.getAttribute("src")).toBe(testImage);
    expect(preview.getAttribute("alt")).toBe("Foto da Roupa");

    const removeButton = screen.getByTestId("photo-option-remove-button");
    expect(removeButton).toBeDefined();
    expect(removeButton.getAttribute("aria-label")).toBe(
      "Remover Foto da Roupa",
    );

    expect(screen.getByTestId("photo-option-success-badge")).toBeDefined();
    expect(screen.getByText("Enviado")).toBeDefined();

    // Botão de upload deve estar ausente
    expect(screen.queryByTestId("photo-option-upload-button")).toBeNull();

    // Clicar em remover dispara o callback
    fireEvent.click(removeButton);
    expect(onRemoveClick).toHaveBeenCalledTimes(1);
  });

  it("suporta prop imageDataUrl como alternativa a image", () => {
    const testImage = "data:image/jpeg;base64,dataurlsample";

    render(<PhotoOptionCard {...defaultProps} imageDataUrl={testImage} />);

    const preview = screen.getByTestId(
      "photo-option-image-preview",
    ) as HTMLImageElement;
    expect(preview.getAttribute("src")).toBe(testImage);
  });

  it("aplica fit cover por padrão para produtos e contain para logos", () => {
    const testImage = "data:image/png;base64,sample";

    const { rerender } = render(
      <PhotoOptionCard {...defaultProps} image={testImage} fit="cover" />,
    );

    let preview = screen.getByTestId("photo-option-image-preview");
    expect(preview.className).toContain("object-cover");
    expect(preview.className).not.toContain("object-contain");

    rerender(
      <PhotoOptionCard {...defaultProps} image={testImage} fit="contain" />,
    );

    preview = screen.getByTestId("photo-option-image-preview");
    expect(preview.className).toContain("object-contain");
    expect(preview.className).toContain("bg-muted");

    // Também suporta isContainPreview boolean
    rerender(
      <PhotoOptionCard
        {...defaultProps}
        image={testImage}
        isContainPreview={true}
      />,
    );

    preview = screen.getByTestId("photo-option-image-preview");
    expect(preview.className).toContain("object-contain");
  });
});
