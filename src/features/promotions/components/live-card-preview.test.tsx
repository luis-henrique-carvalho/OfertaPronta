// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveCardPreview } from "./live-card-preview";

describe("LiveCardPreview - Image Rendering Compatibility", () => {
  it("renderiza imagem com URL HTTPS pública de CDN mantendo o aspect ratio", () => {
    render(
      <LiveCardPreview
        businessSegment="supermarket"
        businessName="Mercado Teste"
        offerTitle="Oferta Especial"
        promoPrice="R$ 19,90"
        previewCardImageUrl="https://r2.cdn.ofertapronta.com.br/previews/draft-123/preview.png"
        targetAspectRatio="feed"
      />,
    );

    const img = screen.getByAltText("Oferta Especial") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toBe(
      "https://r2.cdn.ofertapronta.com.br/previews/draft-123/preview.png",
    );
  });

  it("renderiza imagem com Data URL Base64 legada sem quebra", () => {
    const base64Url =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    render(
      <LiveCardPreview
        businessSegment="burger-shop"
        businessName="Burger House"
        offerTitle="Smash Combo"
        promoPrice="R$ 29,90"
        previewCardImageUrl={base64Url}
        targetAspectRatio="story"
      />,
    );

    const img = screen.getByAltText("Smash Combo") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toBe(base64Url);
  });
});
