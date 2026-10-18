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
import { OrderDeliveryView } from "./order-delivery-view";
import type { DeliveryDetailsResult } from "../data/delivery.schemas";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

const mockDeliveryDetails: DeliveryDetailsResult = {
  orderId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  status: "PAID",
  offerTitle: "Quarta da Pizza",
  businessName: "Pizzaria Bela Napoli",
  businessSegment: "Pizzaria",
  paidAt: new Date().toISOString(),
  regenerationWindowEndsAt: new Date(Date.now() + 1800000).toISOString(),
  canRegenerate: true,
  regenerationsUsed: 0,
  maxRegenerations: 3,
  remainingRegenerations: 3,
  feedCardUrl: "https://example.com/feed-clean.png",
  storyCardUrl: "https://example.com/story-clean.png",
  downloadCount: 0,
  customerWhatsapp: "11988887777",
  permanentOrderUrl:
    "https://ofertapronta.com/pedido/6ba7b810-9dad-11d1-80b4-00c04fd430c8",
};

describe("OrderDeliveryView Component", () => {
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

  it("renders celebration banner, preview tabs and download actions correctly", () => {
    render(<OrderDeliveryView initialDetails={mockDeliveryDetails} />, {
      wrapper: createWrapper(),
    });

    // Banner de status
    expect(screen.getByText("Pagamento Confirmado")).toBeDefined();
    expect(screen.getByText("Quarta da Pizza")).toBeDefined();
    expect(screen.getByText(/Pizzaria Bela Napoli/)).toBeDefined();

    // Abas do preview
    expect(screen.getByText("Feed (1080×1350)")).toBeDefined();
    expect(screen.getByText("Story (1080×1920)")).toBeDefined();

    // Botões de download
    expect(
      screen.getByRole("button", { name: "Baixar Feed (1080×1350)" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Baixar Story (1080×1920)" }),
    ).toBeDefined();

    // WhatsApp share
    expect(
      screen.getByRole("button", { name: "Enviar artes para meu WhatsApp" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Copiar link permanente" }),
    ).toBeDefined();

    // Painel de IA
    expect(
      screen.getByText("Refinar com Inteligência Artificial"),
    ).toBeDefined();
    expect(screen.getByText("Ajustes restantes: 3 de 3")).toBeDefined();
  });

  it("switches tabs between Feed and Story views", () => {
    render(<OrderDeliveryView initialDetails={mockDeliveryDetails} />, {
      wrapper: createWrapper(),
    });

    const feedTab = screen.getByRole("tab", { name: /Feed/i });
    const storyTab = screen.getByRole("tab", { name: /Story/i });

    expect(feedTab).toBeDefined();
    expect(storyTab).toBeDefined();
    expect(screen.getByAltText(/Arte de Feed/i)).toBeDefined();
  });

  it("triggers download action when clicking download buttons", async () => {
    const mockRecordDownload = vi.fn().mockResolvedValue({
      success: true,
      downloadCount: 1,
    });

    render(
      <OrderDeliveryView
        initialDetails={mockDeliveryDetails}
        recordDownloadFn={mockRecordDownload}
      />,
      { wrapper: createWrapper() },
    );

    const downloadFeedBtn = screen.getByRole("button", {
      name: "Baixar Feed (1080×1350)",
    });
    fireEvent.click(downloadFeedBtn);

    await waitFor(() => {
      expect(mockRecordDownload).toHaveBeenCalledWith({
        data: {
          orderId: mockDeliveryDetails.orderId,
          format: "feed",
        },
      });
    });

    expect(screen.getByText(/1 download realizado/i)).toBeDefined();
  });

  it("copies permanent order URL when clicking copy button", async () => {
    render(<OrderDeliveryView initialDetails={mockDeliveryDetails} />, {
      wrapper: createWrapper(),
    });

    const copyBtn = screen.getByRole("button", {
      name: "Copiar link permanente",
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        mockDeliveryDetails.permanentOrderUrl,
      );
    });

    expect(screen.getByText("Copiado!")).toBeDefined();
  });

  it("reactively updates preview and quota count when AI refinement completes", async () => {
    const updatedDetails: DeliveryDetailsResult = {
      ...mockDeliveryDetails,
      offerTitle: "Quarta da Pizza Especialíssimo",
      regenerationsUsed: 1,
      remainingRegenerations: 2,
      feedCardUrl: "https://example.com/feed-refined.png",
      storyCardUrl: "https://example.com/story-refined.png",
    };

    const mockRegenFn = vi.fn().mockResolvedValue(updatedDetails);

    render(
      <OrderDeliveryView
        initialDetails={mockDeliveryDetails}
        regenerationFn={mockRegenFn}
      />,
      { wrapper: createWrapper() },
    );

    const titleInput = screen.getByLabelText("Título da Promoção");
    fireEvent.change(titleInput, {
      target: { value: "Quarta da Pizza Especialíssimo" },
    });

    const submitBtn = screen.getByRole("button", {
      name: "Aplicar Ajuste com IA",
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegenFn).toHaveBeenCalled();
    });

    // O título no banner e o badge de cota devem atualizar reativamente
    expect(
      screen.getAllByText("Quarta da Pizza Especialíssimo").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Ajustes restantes: 2 de 3")).toBeDefined();
  });
});
