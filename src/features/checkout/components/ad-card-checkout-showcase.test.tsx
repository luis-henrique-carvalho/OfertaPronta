// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AdCardCheckoutShowcase } from "./ad-card-checkout-showcase";

describe("AdCardCheckoutShowcase Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza mockup estruturado do card quando previewCardImageUrl for nulo (Critério 3)", () => {
    render(
      <AdCardCheckoutShowcase
        previewCardImageUrl={null}
        offerTitle="Picanha Bovina Premium"
        businessName="Açougue & Cia"
        promoPrice="R$ 59,90"
        targetAspectRatio="feed"
        amountCents={990}
      />,
    );

    // Placeholder estruturado presente
    expect(screen.getByTestId("card-mockup-placeholder")).toBeDefined();

    // Nome da loja e título da oferta destacados
    expect(screen.getByTestId("mockup-business-name").textContent).toContain(
      "Açougue & Cia",
    );
    expect(screen.getByTestId("mockup-offer-title").textContent).toContain(
      "Picanha Bovina Premium",
    );

    // Preço promocional em destaque
    expect(screen.getByTestId("mockup-promo-price").textContent).toBe(
      "R$ 59,90",
    );

    // Selo de vidro/blur: Sparkles + "Arte gerada por IA após o Pix"
    expect(screen.getByTestId("mockup-ai-badge")).toBeDefined();
    expect(screen.getByText("Arte gerada por IA após o Pix")).toBeDefined();

    // Indicador de proporção Feed
    expect(screen.getByText("Feed 4:5")).toBeDefined();
  });

  it("renderiza mockup estruturado para formato Story (9:16)", () => {
    render(
      <AdCardCheckoutShowcase
        previewCardImageUrl={undefined}
        offerTitle="Pizza Calabresa Especial"
        businessName="Pizzaria Bella"
        promoPrice="R$ 44,90"
        targetAspectRatio="story"
      />,
    );

    expect(screen.getByTestId("card-mockup-placeholder")).toBeDefined();
    expect(screen.getByTestId("mockup-offer-title").textContent).toContain(
      "Pizza Calabresa Especial",
    );
    expect(screen.getByText("Story 9:16")).toBeDefined();
    expect(screen.getByText("Arte gerada por IA após o Pix")).toBeDefined();
  });

  it("renderiza imagem real quando previewCardImageUrl estiver presente", () => {
    const mockImageUrl =
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
    render(
      <AdCardCheckoutShowcase
        previewCardImageUrl={mockImageUrl}
        offerTitle="Salada Caesar Especial"
        businessName="Restaurante Verde"
        targetAspectRatio="feed"
      />,
    );

    // Não deve renderizar o placeholder de mockup
    expect(screen.queryByTestId("card-mockup-placeholder")).toBeNull();

    // Deve renderizar a imagem
    const img = screen.getByRole("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe(mockImageUrl);
  });
});
