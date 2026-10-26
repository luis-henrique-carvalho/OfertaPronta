// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckoutHeader } from "./checkout-header";
import * as legalModule from "@/lib/legal-company";

describe("CheckoutHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(legalModule, "getCompanyLegalProfile").mockReturnValue({
      legalName: "OfertaPronta Tecnologia Ltda",
      tradeName: "OfertaPronta",
      cnpj: "00.000.000/0001-00",
      contactEmail: "contato@ofertapronta.com.br",
      supportWhatsapp: "+55 11 99999-9999",
      supportWhatsappUrl:
        "https://wa.me/5511999999999?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20meu%20pedido%20no%20OfertaPronta.",
      addressCityState: "São Paulo - SP",
    });
  });

  it("renderiza o logo e o botão de ajuda via WhatsApp no cabeçalho", () => {
    render(<CheckoutHeader />);

    expect(screen.getByText("Oferta")).toBeDefined();
    expect(screen.getByText("Pronta")).toBeDefined();

    const whatsappLink = screen.getByRole("link", {
      name: /ajuda via whatsapp/i,
    });
    expect(whatsappLink).toBeDefined();
    expect(whatsappLink.getAttribute("href")).toContain(
      "https://wa.me/5511999999999",
    );
    expect(whatsappLink.getAttribute("target")).toBe("_blank");
  });

  it("chama onNavigateBack quando o botão voltar é clicado", () => {
    const handleNavigateBack = vi.fn();

    render(<CheckoutHeader onNavigateBack={handleNavigateBack} />);

    const backButton = screen.getByRole("button", { name: /voltar/i });
    expect(backButton).toBeDefined();

    fireEvent.click(backButton);
    expect(handleNavigateBack).toHaveBeenCalledTimes(1);
  });
});
