// @vitest-environment happy-dom
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingFooter } from "./landing-footer";
import * as legalModule from "@/lib/legal-company";

describe("LandingFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(legalModule, "getCompanyLegalProfile").mockReturnValue({
      legalName: "OfertaPronta Tecnologia Ltda",
      tradeName: "OfertaPronta",
      cnpj: "12.345.678/0001-90",
      contactEmail: "suporte@ofertapronta.com.br",
      supportWhatsapp: "+55 11 98888-7777",
      supportWhatsappUrl:
        "https://wa.me/5511988887777?text=Ol%C3%A1!%20Preciso%20de%20ajuda.",
      addressCityState: "São Paulo - SP",
    });
  });

  it("renderiza a Razão Social, CNPJ formatado e e-mail de contato", () => {
    render(<LandingFooter />);

    expect(screen.getByText(/OfertaPronta Tecnologia Ltda/i)).toBeDefined();
    expect(screen.getByText(/12\.345\.678\/0001-90/i)).toBeDefined();
    expect(screen.getByText(/suporte@ofertapronta\.com\.br/i)).toBeDefined();
  });

  it("renderiza links funcionais para Termos de Uso e Política de Privacidade", () => {
    render(<LandingFooter />);

    const termosLink = screen.getByRole("link", { name: /termos de uso/i });
    expect(termosLink.getAttribute("href")).toBe("/termos");

    const privacidadeLink = screen.getByRole("link", {
      name: /política de privacidade/i,
    });
    expect(privacidadeLink.getAttribute("href")).toBe("/privacidade");
  });

  it("renderiza link direto de atendimento para o WhatsApp de suporte", () => {
    render(<LandingFooter />);

    const whatsappLink = screen.getByRole("link", {
      name: /suporte whatsapp/i,
    });
    expect(whatsappLink.getAttribute("href")).toContain(
      "https://wa.me/5511988887777",
    );
    expect(whatsappLink.getAttribute("target")).toBe("_blank");
    expect(whatsappLink.getAttribute("rel")).toContain("noopener");
  });
});
