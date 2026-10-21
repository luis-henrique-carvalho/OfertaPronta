// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OrderWhatsappShareCard } from "./order-whatsapp-share-card";

describe("OrderWhatsappShareCard Component", () => {
  const defaultProps = {
    orderId: "a4959c0e-36df-41fc-92e6-af2420a86a24",
    offerTitle: "Costela bovina",
    permanentOrderUrl: "/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24",
    customerWhatsapp: "11999998888",
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

  it("exibe a URL absoluta com base path na interface", () => {
    render(<OrderWhatsappShareCard {...defaultProps} />);

    expect(
      screen.getByText(
        "Link permanente: https://ofertapronta.com.br/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24",
      ),
    ).toBeDefined();
  });

  it("monta mensagem com URL absoluta completa com base path ao abrir WhatsApp", () => {
    render(<OrderWhatsappShareCard {...defaultProps} />);

    const whatsappBtn = screen.getByRole("button", {
      name: /Enviar artes para meu WhatsApp/i,
    });
    fireEvent.click(whatsappBtn);

    expect(window.open).toHaveBeenCalledTimes(1);
    const calledUrl = (window.open as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;

    expect(calledUrl).toContain(
      encodeURIComponent(
        "https://ofertapronta.com.br/pedido/a4959c0e-36df-41fc-92e6-af2420a86a24",
      ),
    );
    expect(calledUrl).not.toContain(
      encodeURIComponent("🔗 /pedido/a4959c0e-36df-41fc-92e6-af2420a86a24"),
    );
  });

  it("copia a URL absoluta completa ao clicar no botão copiar", async () => {
    render(<OrderWhatsappShareCard {...defaultProps} />);

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
});
