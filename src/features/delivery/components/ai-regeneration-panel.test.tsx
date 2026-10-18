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
import { AiRegenerationPanel } from "./ai-regeneration-panel";
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
  businessName: "Pizzaria Bella",
  businessSegment: "Pizzaria",
  paidAt: new Date().toISOString(),
  regenerationWindowEndsAt: new Date(Date.now() + 1800000).toISOString(),
  canRegenerate: true,
  regenerationsUsed: 0,
  maxRegenerations: 3,
  remainingRegenerations: 3,
  feedCardUrl: "https://example.com/feed.png",
  storyCardUrl: "https://example.com/story.png",
  downloadCount: 0,
  customerWhatsapp: "11988887777",
  permanentOrderUrl:
    "https://ofertapronta.com/pedido/6ba7b810-9dad-11d1-80b4-00c04fd430c8",
};

describe("AiRegenerationPanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders regeneration quota and timer correctly", () => {
    render(
      <AiRegenerationPanel
        orderId={mockDeliveryDetails.orderId}
        offerTitle={mockDeliveryDetails.offerTitle}
        canRegenerate={mockDeliveryDetails.canRegenerate}
        regenerationsUsed={mockDeliveryDetails.regenerationsUsed}
        maxRegenerations={mockDeliveryDetails.maxRegenerations}
        remainingRegenerations={mockDeliveryDetails.remainingRegenerations}
        regenerationWindowEndsAt={mockDeliveryDetails.regenerationWindowEndsAt}
        onRegenerationSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText("Refinar com Inteligência Artificial"),
    ).toBeDefined();
    expect(screen.getByText("Ajustes restantes: 3 de 3")).toBeDefined();
    expect(screen.getByLabelText("Título da Promoção")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Aplicar Ajuste com IA" }),
    ).toBeDefined();
  });

  it("submits refinement request and triggers success callback with updated details", async () => {
    const updatedDetails: DeliveryDetailsResult = {
      ...mockDeliveryDetails,
      offerTitle: "Quarta da Pizza em Dobro",
      regenerationsUsed: 1,
      remainingRegenerations: 2,
    };

    const mockRegenFn = vi.fn().mockResolvedValue(updatedDetails);
    const onRegenerationSuccess = vi.fn();

    render(
      <AiRegenerationPanel
        orderId={mockDeliveryDetails.orderId}
        offerTitle={mockDeliveryDetails.offerTitle}
        canRegenerate={mockDeliveryDetails.canRegenerate}
        regenerationsUsed={0}
        maxRegenerations={3}
        remainingRegenerations={3}
        regenerationWindowEndsAt={mockDeliveryDetails.regenerationWindowEndsAt}
        onRegenerationSuccess={onRegenerationSuccess}
        regenerationFn={mockRegenFn}
      />,
      { wrapper: createWrapper() },
    );

    const titleInput = screen.getByLabelText("Título da Promoção");
    fireEvent.change(titleInput, {
      target: { value: "Quarta da Pizza em Dobro" },
    });

    const promoPriceInput = screen.getByLabelText(/Preço Promocional/i);
    fireEvent.change(promoPriceInput, { target: { value: "R$ 44,90" } });

    const submitBtn = screen.getByRole("button", {
      name: "Aplicar Ajuste com IA",
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegenFn).toHaveBeenCalledWith({
        data: {
          orderId: mockDeliveryDetails.orderId,
          offerTitle: "Quarta da Pizza em Dobro",
          promoPrice: "R$ 44,90",
        },
      });
      expect(onRegenerationSuccess).toHaveBeenCalledWith(updatedDetails);
    });

    expect(
      screen.getByText("Seu card foi refinado com sucesso pela IA!"),
    ).toBeDefined();
  });

  it("renders disabled state when remainingRegenerations is 0", () => {
    render(
      <AiRegenerationPanel
        orderId={mockDeliveryDetails.orderId}
        offerTitle={mockDeliveryDetails.offerTitle}
        canRegenerate={false}
        regenerationsUsed={3}
        maxRegenerations={3}
        remainingRegenerations={0}
        regenerationWindowEndsAt={mockDeliveryDetails.regenerationWindowEndsAt}
        onRegenerationSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText("Limite de Ajustes Atingido")).toBeDefined();
    expect(
      screen.getByText(/Você utilizou todos os 3 ajustes inclusos no pedido/),
    ).toBeDefined();
    expect(screen.queryByLabelText("Título da Promoção")).toBeNull();
  });

  it("renders expired state when 30 min window has passed", () => {
    const expiredEndsAt = new Date(Date.now() - 60000).toISOString();

    render(
      <AiRegenerationPanel
        orderId={mockDeliveryDetails.orderId}
        offerTitle={mockDeliveryDetails.offerTitle}
        canRegenerate={true}
        regenerationsUsed={1}
        maxRegenerations={3}
        remainingRegenerations={2}
        regenerationWindowEndsAt={expiredEndsAt}
        onRegenerationSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText("Janela de Ajustes com IA Encerrada"),
    ).toBeDefined();
    expect(
      screen.getByText(
        /A janela de 30 minutos para ajustes com IA foi encerrada/,
      ),
    ).toBeDefined();
  });
});
