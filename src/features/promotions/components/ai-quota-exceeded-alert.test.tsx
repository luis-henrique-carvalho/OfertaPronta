// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiQuotaExceededAlert } from "./ai-quota-exceeded-alert";

describe("AiQuotaExceededAlert Component", () => {
  it("deve renderizar mensagem de visitante com CTA de pagamento quando hasLastDraft = true", () => {
    const onCheckout = vi.fn();
    render(
      <AiQuotaExceededAlert
        reason="visitor"
        hasLastDraft={true}
        onCheckout={onCheckout}
      />,
    );

    expect(
      screen.getByText(
        /Você já usou suas prévias grátis de hoje\. Libere este card sem marca d'água por R\$ 9,90/i,
      ),
    ).toBeDefined();

    const checkoutBtn = screen.getByTestId("btn-quota-checkout");
    expect(checkoutBtn).toBeDefined();
    expect(checkoutBtn.textContent).toContain("Liberar por R$ 9,90");

    fireEvent.click(checkoutBtn);
    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("não deve renderizar botão de checkout quando hasLastDraft = false", () => {
    const onCheckout = vi.fn();
    render(
      <AiQuotaExceededAlert
        reason="visitor"
        hasLastDraft={false}
        onCheckout={onCheckout}
      />,
    );

    expect(
      screen.getByText(
        /Limite de 2 prévias diárias atingido para este dispositivo\/navegador/i,
      ),
    ).toBeDefined();
    expect(screen.queryByTestId("btn-quota-checkout")).toBeNull();
  });

  it("deve renderizar mensagem contextual para motivo 'ip'", () => {
    render(<AiQuotaExceededAlert reason="ip" hasLastDraft={false} />);

    expect(screen.getByText(/Limite de rede local atingido/i)).toBeDefined();
    expect(
      screen.getByText(
        /Limite de prévias gratuitas atingido para sua rede local/i,
      ),
    ).toBeDefined();
  });

  it("deve renderizar mensagem contextual para motivo 'global'", () => {
    render(<AiQuotaExceededAlert reason="global" hasLastDraft={false} />);

    expect(
      screen.getAllByText(/Prévias grátis esgotadas por hoje/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/Limite diário do serviço atingido\. Volte amanhã\./i),
    ).toBeDefined();
  });

  it("deve exibir estado de carregamento no botão durante o início de checkout", () => {
    render(
      <AiQuotaExceededAlert
        reason="visitor"
        hasLastDraft={true}
        onCheckout={vi.fn()}
        isInitiatingCheckout={true}
      />,
    );

    const btn = screen.getByTestId("btn-quota-checkout");
    expect(btn.getAttribute("disabled")).toBeDefined();
    expect(screen.getByText(/Iniciando Pix\.\.\./i)).toBeDefined();
  });
});
