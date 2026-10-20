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

describe("OrderDeliveryView Component (Redesign Simplificado)", () => {
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

  it("renders compact status bar, unified hero preview and dynamic download button correctly", () => {
    render(<OrderDeliveryView initialDetails={mockDeliveryDetails} />, {
      wrapper: createWrapper(),
    });

    // 1. Barra compacta de status
    expect(screen.getByText("Pagamento Confirmado")).toBeDefined();
    expect(screen.getByText("Quarta da Pizza")).toBeDefined();
    expect(screen.getByText(/Pizzaria Bela Napoli/)).toBeDefined();

    // 2. Abas do Hero
    expect(screen.getByRole("tab", { name: /Feed/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Story/i })).toBeDefined();

    // 3. Botão primário dinâmico sincronizado com a aba ativa inicial (Feed)
    expect(
      screen.getByRole("button", { name: "Baixar Feed em HD" }),
    ).toBeDefined();

    // 4. Ações de WhatsApp e Copiar Link integradas no Hero
    expect(
      screen.getByRole("button", { name: "Salvar no WhatsApp" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Copiar link permanente" }),
    ).toBeDefined();

    // 5. Painel simplificado com chips rápidos de intenção
    expect(screen.getByText("Precisa de algum ajuste na arte?")).toBeDefined();
    expect(screen.getByText("3 de 3 ajustes restantes")).toBeDefined();
    expect(screen.getByRole("button", { name: /Mudar Preço/i })).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Corrigir Título/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Cores & Estilo/i }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /Outro Ajuste/i })).toBeDefined();
  });

  it("synchronizes the dynamic primary download button when switching tabs between Feed and Story", () => {
    render(<OrderDeliveryView initialDetails={mockDeliveryDetails} />, {
      wrapper: createWrapper(),
    });

    // Inicialmente no Feed
    expect(
      screen.getByRole("button", { name: "Baixar Feed em HD" }),
    ).toBeDefined();
    expect(screen.getByAltText(/Arte de Feed/i)).toBeDefined();

    // Clica na aba Story
    const storyTab = screen.getByRole("tab", { name: /Story/i });
    fireEvent.click(storyTab);

    // O botão primário dinâmico agora sincroniza para "Baixar Story em HD"
    expect(
      screen.getByRole("button", { name: "Baixar Story em HD" }),
    ).toBeDefined();
    expect(screen.getByAltText(/Arte de Story/i)).toBeDefined();
  });

  it("triggers download action for active format when clicking primary download button", async () => {
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
      name: "Baixar Feed em HD",
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

  it("copies permanent order URL when clicking copy button with visual feedback", async () => {
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

  it("switches refinement chips and applies AI adjustment reactively", async () => {
    const updatedDetails: DeliveryDetailsResult = {
      ...mockDeliveryDetails,
      offerTitle: "Quarta da Pizza Família",
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

    // Clica no chip Corrigir Título
    const titleChip = screen.getByRole("button", { name: /Corrigir Título/i });
    fireEvent.click(titleChip);

    const titleInput = screen.getByLabelText("Novo Título da Oferta");
    fireEvent.change(titleInput, {
      target: { value: "Quarta da Pizza Família" },
    });

    const submitBtn = screen.getByRole("button", {
      name: "Gerar Ajuste com IA",
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegenFn).toHaveBeenCalledWith({
        data: {
          orderId: mockDeliveryDetails.orderId,
          offerTitle: "Quarta da Pizza Família",
        },
      });
    });

    // O status no topo e o contador de cotas atualizam reativamente
    expect(
      screen.getAllByText("Quarta da Pizza Família").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2 de 3 ajustes restantes")).toBeDefined();
  });

  it("displays warm welcoming message and new offer button when quota is exhausted or window expired", () => {
    const exhaustedDetails: DeliveryDetailsResult = {
      ...mockDeliveryDetails,
      canRegenerate: false,
      regenerationsUsed: 3,
      remainingRegenerations: 0,
    };

    const mockNavigateHome = vi.fn();

    render(
      <OrderDeliveryView
        initialDetails={exhaustedDetails}
        onNavigateHome={mockNavigateHome}
      />,
      { wrapper: createWrapper() },
    );

    // Mensagem calorosa acolhedora
    expect(
      screen.getByText("Suas artes estão prontas e salvas!"),
    ).toBeDefined();
    expect(
      screen.getByText(/Você aproveitou todos os 3 ajustes inclusos no pedido/),
    ).toBeDefined();

    // Botão destacado para criar nova oferta
    const newOfferBtn = screen.getByRole("button", {
      name: "Criar Nova Oferta",
    });
    expect(newOfferBtn).toBeDefined();

    fireEvent.click(newOfferBtn);
    expect(mockNavigateHome).toHaveBeenCalledTimes(1);
  });
});
