// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdCardUnifiedDeliveryHero } from "./ad-card-unified-delivery-hero";

describe("AdCardUnifiedDeliveryHero Component", () => {
  const defaultProps = {
    orderId: "a4959c0e-36df-41fc-92e6-af2420a86a24",
    feedCardUrl: "https://example.com/feed.png",
    storyCardUrl: "https://example.com/story.png",
    offerTitle: "Costela bovina",
    businessName: "Açougue Boi Nobre",
    businessSegment: "Açougue",
    permanentOrderUrl: "/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24",
    customerWhatsapp: "11999998888",
    onDownload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: {
        origin: "https://ofertapronta.com.br",
      },
      writable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
    window.open = vi.fn();
  });

  it("converte o link relativo em URL absoluta completa com base path no WhatsApp", () => {
    render(<AdCardUnifiedDeliveryHero {...defaultProps} />);

    const whatsappBtn = screen.getByRole("button", {
      name: /Salvar no WhatsApp/i,
    });
    fireEvent.click(whatsappBtn);

    expect(window.open).toHaveBeenCalledTimes(1);
    const calledUrl = (window.open as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;

    // A URL do WhatsApp deve conter o link com o base path completo
    expect(calledUrl).toContain(
      encodeURIComponent(
        "https://ofertapronta.com.br/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24",
      ),
    );
    expect(calledUrl).not.toContain(
      encodeURIComponent("🔗 /pedido/a4959c0e-36df-41fc-92e6-af2420a86a24"),
    );
  });

  it("copia a URL absoluta completa com base path ao clicar em copiar link", async () => {
    render(<AdCardUnifiedDeliveryHero {...defaultProps} />);

    const copyBtn = screen.getByRole("button", {
      name: /Copiar link permanente/i,
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://ofertapronta.com.br/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24",
      );
    });
  });

  it("preserva a URL inalterada quando já fornecida com base path absoluto", () => {
    render(
      <AdCardUnifiedDeliveryHero
        {...defaultProps}
        permanentOrderUrl="https://meudominio.com/pedido/custom-id"
      />,
    );

    const whatsappBtn = screen.getByRole("button", {
      name: /Salvar no WhatsApp/i,
    });
    fireEvent.click(whatsappBtn);

    const calledUrl = (window.open as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;

    expect(calledUrl).toContain(
      encodeURIComponent("https://meudominio.com/pedido/custom-id"),
    );
  });
});
