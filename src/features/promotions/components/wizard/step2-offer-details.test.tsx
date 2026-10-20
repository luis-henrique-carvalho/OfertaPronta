// @vitest-environment happy-dom
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step2OfferDetails } from "./step2-offer-details";
import { CREATION_CATALOG } from "../../data/creation-catalog";

const mockSegmentData = CREATION_CATALOG.fashion;

describe("Step2OfferDetails - Máscara Monetária no Preço da Promoção", () => {
  it("renderiza o input de preço com máscara monetária e formata digitação", () => {
    function TestWrapper() {
      const [promoPrice, setPromoPrice] = useState("");
      return (
        <Step2OfferDetails
          segmentData={mockSegmentData}
          intent="promo"
          businessName="Boutique Flor"
          offerTitle="Vestido Elegance"
          promoPrice={promoPrice}
          onIntentChange={vi.fn()}
          onCustomIntentTextChange={vi.fn()}
          onBusinessNameChange={vi.fn()}
          onOfferTitleChange={vi.fn()}
          onPromoPriceChange={setPromoPrice}
        />
      );
    }

    render(<TestWrapper />);

    const priceInput = screen.getByTestId(
      "input-promo-price",
    ) as HTMLInputElement;
    expect(priceInput).toBeDefined();
    expect(priceInput.value).toBe("");

    // Digita sequência '8' -> '9' -> '9' -> '0'
    fireEvent.change(priceInput, { target: { value: "8" } });
    expect(priceInput.value).toBe("R$ 0,08");

    fireEvent.change(priceInput, { target: { value: "R$ 0,089" } });
    expect(priceInput.value).toBe("R$ 0,89");

    fireEvent.change(priceInput, { target: { value: "R$ 0,899" } });
    expect(priceInput.value).toBe("R$ 8,99");

    fireEvent.change(priceInput, { target: { value: "R$ 8,990" } });
    expect(priceInput.value).toBe("R$ 89,90");
  });

  it("formata valor inicial passado sem prefixo monetário", () => {
    render(
      <Step2OfferDetails
        segmentData={mockSegmentData}
        intent="promo"
        businessName="Boutique Flor"
        offerTitle="Vestido Elegance"
        promoPrice="89,90"
        onIntentChange={vi.fn()}
        onCustomIntentTextChange={vi.fn()}
        onBusinessNameChange={vi.fn()}
        onOfferTitleChange={vi.fn()}
        onPromoPriceChange={vi.fn()}
      />,
    );

    const priceInput = screen.getByTestId(
      "input-promo-price",
    ) as HTMLInputElement;
    expect(priceInput.value).toBe("R$ 89,90");
  });

  it("suporta colagem de número inteiro (ex: 89 -> R$ 89,00)", () => {
    function TestWrapper() {
      const [promoPrice, setPromoPrice] = useState("");
      return (
        <Step2OfferDetails
          segmentData={mockSegmentData}
          intent="promo"
          businessName="Boutique Flor"
          offerTitle="Vestido Elegance"
          promoPrice={promoPrice}
          onIntentChange={vi.fn()}
          onCustomIntentTextChange={vi.fn()}
          onBusinessNameChange={vi.fn()}
          onOfferTitleChange={vi.fn()}
          onPromoPriceChange={setPromoPrice}
        />
      );
    }

    render(<TestWrapper />);
    const priceInput = screen.getByTestId(
      "input-promo-price",
    ) as HTMLInputElement;

    fireEvent.paste(priceInput, {
      clipboardData: { getData: () => "89" },
    });
    expect(priceInput.value).toBe("R$ 89,00");
  });
});
