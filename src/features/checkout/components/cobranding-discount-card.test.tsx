// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CobrandingDiscountCard } from "./cobranding-discount-card";

describe("CobrandingDiscountCard Component", () => {
  it("renders with default values and off state", () => {
    const handleToggle = vi.fn();
    render(
      <CobrandingDiscountCard isAccepted={false} onToggle={handleToggle} />,
    );

    expect(screen.getByText(/Economize R\$\s*2,97/)).toBeDefined();
    expect(screen.getByText("30% OFF")).toBeDefined();
    expect(
      screen.getByText("Ativar assinatura de marca no rodapé"),
    ).toBeDefined();
    expect(screen.getAllByText(/R\$\s*6,93/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/R\$\s*9,90/)).toBeDefined();
    expect(screen.getByText(/Design por @ofertapronta/)).toBeDefined();

    const switchEl = screen.getByRole("switch", {
      name: "Ativar assinatura de marca no rodapé",
    });
    expect(switchEl).toBeDefined();
    expect(switchEl.getAttribute("data-state")).toBe("unchecked");
    expect(switchEl.hasAttribute("disabled")).toBe(false);
  });

  it("renders on state when isAccepted is true", () => {
    const handleToggle = vi.fn();
    render(
      <CobrandingDiscountCard isAccepted={true} onToggle={handleToggle} />,
    );

    const switchEl = screen.getByRole("switch", {
      name: "Ativar assinatura de marca no rodapé",
    });
    expect(switchEl.getAttribute("data-state")).toBe("checked");
  });

  it("calls onToggle(true) when clicking the switch in off state", () => {
    const handleToggle = vi.fn();
    render(
      <CobrandingDiscountCard isAccepted={false} onToggle={handleToggle} />,
    );

    const switchEl = screen.getByRole("switch", {
      name: "Ativar assinatura de marca no rodapé",
    });
    fireEvent.click(switchEl);

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it("calls onToggle(false) when clicking the switch in on state", () => {
    const handleToggle = vi.fn();
    render(
      <CobrandingDiscountCard isAccepted={true} onToggle={handleToggle} />,
    );

    const switchEl = screen.getByRole("switch", {
      name: "Ativar assinatura de marca no rodapé",
    });
    fireEvent.click(switchEl);

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith(false);
  });

  it("disables switch and displays loader when isUpdating is true", () => {
    const handleToggle = vi.fn();
    render(
      <CobrandingDiscountCard
        isAccepted={false}
        isUpdating={true}
        onToggle={handleToggle}
      />,
    );

    const switchEl = screen.getByRole("switch", {
      name: "Ativar assinatura de marca no rodapé",
    });
    expect(switchEl.hasAttribute("disabled")).toBe(true);
    expect(screen.getByTestId("cobranding-spinner")).toBeDefined();

    fireEvent.click(switchEl);
    expect(handleToggle).not.toHaveBeenCalled();
  });

  it("disables switch when disabled prop is true", () => {
    const handleToggle = vi.fn();
    render(
      <CobrandingDiscountCard
        isAccepted={false}
        disabled={true}
        onToggle={handleToggle}
      />,
    );

    const switchEl = screen.getByRole("switch", {
      name: "Ativar assinatura de marca no rodapé",
    });
    expect(switchEl.hasAttribute("disabled")).toBe(true);

    fireEvent.click(switchEl);
    expect(handleToggle).not.toHaveBeenCalled();
  });

  it("renders custom discount percent, prices, and credit text", () => {
    const handleToggle = vi.fn();
    render(
      <CobrandingDiscountCard
        isAccepted={true}
        discountPercent={20}
        originalAmountCents={1500}
        creditText="Feito por @minhaloja"
        onToggle={handleToggle}
      />,
    );

    expect(screen.getByText("20% OFF")).toBeDefined();
    // 20% de 1500 = 300 centavos = R$ 3,00
    expect(screen.getByText(/Economize R\$\s*3,00/)).toBeDefined();
    // Preço com desconto: 1200 centavos = R$ 12,00
    expect(screen.getAllByText(/R\$\s*12,00/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Feito por @minhaloja/)).toBeDefined();
  });
});
