// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PreviewView } from "./preview-view";
import type { DraftClientDto } from "../data/offer-brief.schema";

describe("PreviewView Component", () => {
  afterEach(() => {
    cleanup();
  });

  const mockDraft: DraftClientDto = {
    id: "draft-last-123",
    businessSegment: "supermarket",
    targetAspectRatio: "feed",
    businessName: "Supermercado Exemplo",
    offerTitle: "Arroz Tipo 1 5kg",
    promoPrice: "R$ 19,90",
    cardIntent: "promo",
    previewCardImageUrl: "data:image/png;base64,watermarkedImage",
    aiGenerationCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("renderiza a prévia protegida normalmente quando isLimitReached for falso", () => {
    render(<PreviewView draft={mockDraft} />);

    expect(screen.getByTestId("preview-view")).toBeDefined();
    expect(screen.getByAltText("Arroz Tipo 1 5kg")).toBeDefined();
    expect(screen.queryByTestId("ai-quota-exceeded-alert")).toBeNull();
  });

  it("exibe lastDraft com marca d'água e CTA 'Liberar por R$ 9,90' quando LIMIT_REACHED tiver lastDraft", () => {
    const handleCheckout = vi.fn();

    render(
      <PreviewView
        draft={null}
        lastDraft={mockDraft}
        isLimitReached={true}
        limitReason="visitor"
        onCheckout={handleCheckout}
      />,
    );

    // Alerta de cota atingida
    expect(screen.getByTestId("ai-quota-exceeded-alert")).toBeDefined();
    expect(
      screen.getByText(
        /Você já usou suas prévias grátis de hoje\. Libere este card sem marca d'água por R\$ 9,90\./i,
      ),
    ).toBeDefined();

    // Imagem do lastDraft renderizada
    expect(screen.getByAltText("Arroz Tipo 1 5kg")).toBeDefined();

    // Botões com texto de liberação
    const checkoutButtons = screen.getAllByRole("button", {
      name: /Liberar por R\$ 9,90/i,
    });
    expect(checkoutButtons.length).toBeGreaterThanOrEqual(1);

    // Clicar no botão aciona onCheckout
    fireEvent.click(checkoutButtons[0]!);
    expect(handleCheckout).toHaveBeenCalledTimes(1);
  });

  it("exibe texto de bloqueio de IP no alerta quando reason for 'ip'", () => {
    render(
      <PreviewView
        draft={null}
        lastDraft={mockDraft}
        isLimitReached={true}
        limitReason="ip"
      />,
    );

    expect(screen.getByText(/Limite de rede local atingido/i)).toBeDefined();
    expect(
      screen.getByText(
        /Você já usou suas prévias grátis de hoje\. Libere este card sem marca d'água por R\$ 9,90\./i,
      ),
    ).toBeDefined();
  });

  it("exibe texto de teto global no alerta quando reason for 'global'", () => {
    render(
      <PreviewView
        draft={null}
        lastDraft={mockDraft}
        isLimitReached={true}
        limitReason="global"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: /Prévias grátis esgotadas por hoje/i,
      }),
    ).toBeDefined();
    expect(
      screen.getByText(/Libere este card por R\$ 9,90 ou volte amanhã\./i),
    ).toBeDefined();
  });

  it("exibe apenas mensagem informativa e NENHUM botão de checkout quando LIMIT_REACHED não tiver lastDraft", () => {
    render(
      <PreviewView
        draft={null}
        lastDraft={null}
        isLimitReached={true}
        limitReason="visitor"
        onCheckout={vi.fn()}
      />,
    );

    // Alerta informativo presente
    expect(screen.getByTestId("ai-quota-exceeded-alert")).toBeDefined();
    expect(
      screen.getByText(
        /Limite de 2 prévias diárias atingido para este dispositivo\/navegador/i,
      ),
    ).toBeDefined();

    // Nenhum botão de checkout visível (nem no alerta, nem na action bar)
    expect(screen.queryByTestId("btn-quota-checkout")).toBeNull();
    expect(screen.queryByTestId("btn-preview-checkout")).toBeNull();
  });
});
