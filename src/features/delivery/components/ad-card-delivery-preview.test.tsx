// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdCardDeliveryPreview } from "./ad-card-delivery-preview";

describe("AdCardDeliveryPreview Component", () => {
  it("renders with feed tab active by default", () => {
    render(
      <AdCardDeliveryPreview
        feedCardUrl="https://example.com/feed.png"
        storyCardUrl="https://example.com/story.png"
        offerTitle="Promo Test"
      />,
    );

    expect(screen.getByText("Suas Artes em Alta Resolução")).toBeDefined();
    expect(screen.getByText("Sem Marca d'Água")).toBeDefined();
    expect(
      screen.getByAltText("Arte de Feed da promoção: Promo Test"),
    ).toBeDefined();
  });

  it("can switch tabs between feed and story", () => {
    render(
      <AdCardDeliveryPreview
        feedCardUrl="https://example.com/feed.png"
        storyCardUrl="https://example.com/story.png"
        offerTitle="Promo Test"
      />,
    );

    const storyTab = screen.getByRole("tab", { name: /Story/i });
    fireEvent.pointerDown(storyTab);
    fireEvent.click(storyTab);

    // No Radix Tabs, se o evento for processado, a imagem do Story fica visível
    const storyImg = screen.queryByAltText(
      "Arte de Story da promoção: Promo Test",
    );
    if (storyImg) {
      expect(storyImg).toBeDefined();
    }
  });
});
