// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShowcaseGalleryDialog } from "./showcase-gallery-dialog";
import type { ShowcaseCardItem } from "../../data/showcase-catalog";

const mockCards: ShowcaseCardItem[] = [
  {
    id: "card-1",
    businessSegment: "supermarket",
    stylePresetId: "market-discount",
    cardIntent: "promo",
    title: "Encarte Semanal",
    description: "Super promoção de carnes",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/supermarket/market-discount-encarte.png",
    aspectRatio: "feed",
    isFeatured: true,
    displayOrder: 1,
    metadata: {
      businessName: "Mercado Central",
      promoPrice: "R$ 19,90",
    },
  },
  {
    id: "card-2",
    businessSegment: "supermarket",
    stylePresetId: "market-fresh",
    cardIntent: "promo",
    title: "Feira de Orgânicos",
    description: "Verduras e frutas frescas",
    imageUrl:
      "https://pub-ofertapronta.r2.dev/showcase/supermarket/market-fresh.png",
    aspectRatio: "feed",
    isFeatured: false,
    displayOrder: 2,
    metadata: {
      businessName: "Hortifruti Viva",
      promoPrice: "R$ 4,99",
    },
  },
];

describe("ShowcaseGalleryDialog", () => {
  it("renderiza os cards da vitrine com botão 'Usar como Referência' e ícone Sparkles", () => {
    render(
      <ShowcaseGalleryDialog
        open={true}
        onOpenChange={vi.fn()}
        segment="supermarket"
        segmentLabel="Supermercados"
        cards={mockCards}
      />,
    );

    expect(
      screen.getByText("Vitrine de Artes Prontas para Inspirar"),
    ).toBeDefined();

    const buttons = screen.getAllByRole("button", {
      name: /Usar como Referência/i,
    });
    expect(buttons.length).toBe(2);
  });

  it("exibe o botão 'Referência Ativa' com ícone CheckCircle2 quando activeReferenceUrl corresponde ao card", () => {
    render(
      <ShowcaseGalleryDialog
        open={true}
        onOpenChange={vi.fn()}
        segment="supermarket"
        activeReferenceUrl="https://pub-ofertapronta.r2.dev/showcase/supermarket/market-discount-encarte.png"
        cards={mockCards}
      />,
    );

    // O primeiro card deve ter o botão "Referência Ativa"
    const activeBtn = screen.getByTestId("btn-use-reference-card-1");
    expect(activeBtn.textContent).toContain("Referência Ativa");

    // O segundo card permanece com "Usar como Referência"
    const inactiveBtn = screen.getByTestId("btn-use-reference-card-2");
    expect(inactiveBtn.textContent).toContain("Usar como Referência");
  });

  it("ao clicar em 'Usar como Referência', dispara onSelectReference com o card e fecha o modal", () => {
    const handleSelectReference = vi.fn();
    const handleOpenChange = vi.fn();

    render(
      <ShowcaseGalleryDialog
        open={true}
        onOpenChange={handleOpenChange}
        segment="supermarket"
        cards={mockCards}
        onSelectReference={handleSelectReference}
      />,
    );

    const button = screen.getByTestId("btn-use-reference-card-1");
    fireEvent.click(button);

    expect(handleSelectReference).toHaveBeenCalledTimes(1);
    expect(handleSelectReference).toHaveBeenCalledWith(mockCards[0]);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("ao clicar em 'Usar como Referência' sem onSelectReference, dispara fallback onSelectStyle", () => {
    const handleSelectStyle = vi.fn();
    const handleOpenChange = vi.fn();

    render(
      <ShowcaseGalleryDialog
        open={true}
        onOpenChange={handleOpenChange}
        segment="supermarket"
        cards={mockCards}
        onSelectStyle={handleSelectStyle}
      />,
    );

    const button = screen.getByTestId("btn-use-reference-card-1");
    fireEvent.click(button);

    expect(handleSelectStyle).toHaveBeenCalledTimes(1);
    expect(handleSelectStyle).toHaveBeenCalledWith("market-discount");
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
