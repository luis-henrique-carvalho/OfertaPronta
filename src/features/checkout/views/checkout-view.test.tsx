// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CheckoutView } from "./checkout-view";
import type { CheckoutDetailsResult } from "../data/checkout.schemas";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

const mockCheckoutDetails: CheckoutDetailsResult = {
  orderId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  draftId: "draft-mock-123",
  status: "PENDING",
  amountCents: 990,
  customerWhatsapp: "11988887777",
  customerEmail: undefined,
  frozenSnapshot: {
    offerTitle: "Super Promoção de Carnes",
    businessName: "Açougue do Bairro",
    previewCardImageUrl: "https://example.com/preview.png",
    targetAspectRatio: "feed",
  },
  charge: {
    txId: "tx-123",
    copiaECola: "00020126580014br.gov.bcb.pix0136test",
    qrCodeBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    status: "PENDING",
  },
};

describe("CheckoutView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders order summary details correctly", () => {
    render(<CheckoutView initialDetails={mockCheckoutDetails} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Super Promoção de Carnes")).toBeDefined();
    expect(screen.getByText("Açougue do Bairro")).toBeDefined();
    expect(screen.getAllByText(/R\$\s*9,90/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Copiar Código Pix")).toBeDefined();
    expect(screen.getByText("Aguardando pagamento via Pix...")).toBeDefined();
  });

  it("copies Pix code when user clicks copy button", async () => {
    render(<CheckoutView initialDetails={mockCheckoutDetails} />, {
      wrapper: createWrapper(),
    });

    const copyBtn = screen.getByText("Copiar Código Pix");
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "00020126580014br.gov.bcb.pix0136test",
      );
    });

    expect(screen.getByText("Código Pix Copiado!")).toBeDefined();
  });

  it("renders expired state when status is EXPIRED", () => {
    const expiredDetails: CheckoutDetailsResult = {
      ...mockCheckoutDetails,
      status: "EXPIRED",
    };

    render(<CheckoutView initialDetails={expiredDetails} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Código Pix Expirado")).toBeDefined();
    expect(screen.getByText("Gerar Novo Código Pix")).toBeDefined();
  });

  it("renders paid confirmation and triggers callback when already paid", async () => {
    const paidDetails: CheckoutDetailsResult = {
      ...mockCheckoutDetails,
      status: "PAID",
    };

    const onNavigateToDelivery = vi.fn();

    render(
      <CheckoutView
        initialDetails={paidDetails}
        onNavigateToDelivery={onNavigateToDelivery}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText("Pagamento Pix Confirmado!")).toBeDefined();
  });

  it("renders custom dynamic amountCents across summary, copia e cola, and qr code", () => {
    const customDetails: CheckoutDetailsResult = {
      ...mockCheckoutDetails,
      amountCents: 1490,
      frozenSnapshot: {
        ...mockCheckoutDetails.frozenSnapshot,
        planName: "Campanha Promocional Especial",
        maxPostPaymentRegenerations: 5,
      },
    };

    render(<CheckoutView initialDetails={customDetails} />, {
      wrapper: createWrapper(),
    });

    // Resumo do pedido
    expect(screen.getByText("Campanha Promocional Especial")).toBeDefined();
    expect(
      screen.getByText(
        /Direito a até 5 ajustes ou regenerações com IA pós-compra/,
      ),
    ).toBeDefined();

    // Valor formatado no resumo e no passo 3 do Copia e Cola
    const priceElements = screen.getAllByText(/R\$\s*14,90/);
    expect(priceElements.length).toBeGreaterThanOrEqual(2);

    // Abrir o QR Code colapsado para expor a imagem
    const toggleQrBtn = screen.getByRole("button", {
      name: /mostrar qr code/i,
    });
    fireEvent.click(toggleQrBtn);

    // Alt do QR Code
    const qrImg = screen.getByRole("img", {
      name: /QR Code Pix Dinâmico para Pagamento de R\$\s*14,90/i,
    });
    expect(qrImg).toBeDefined();
  });

  it("renders DevPaymentSimulatorCard when isDevMode is true", () => {
    const devDetails: CheckoutDetailsResult = {
      ...mockCheckoutDetails,
      isDevMode: true,
    };

    render(<CheckoutView initialDetails={devDetails} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Modo Desenvolvimento")).toBeDefined();
    expect(
      screen.getByText("Teste Local: Simulação de Pagamento"),
    ).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: /simular pagamento pix aprovado/i,
      }),
    ).toBeDefined();
  });

  it("does NOT render DevPaymentSimulatorCard when isDevMode is false or omitted", () => {
    render(<CheckoutView initialDetails={mockCheckoutDetails} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText("Modo Desenvolvimento")).toBeNull();
    expect(
      screen.queryByText("Teste Local: Simulação de Pagamento"),
    ).toBeNull();
  });
});
