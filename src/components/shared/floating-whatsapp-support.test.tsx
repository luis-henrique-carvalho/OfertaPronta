// @vitest-environment happy-dom
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FloatingWhatsappSupport } from "./floating-whatsapp-support";
import * as legalModule from "@/lib/legal-company";

describe("FloatingWhatsappSupport", () => {
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

  it("renderiza o botão flutuante acessível com o link oficial de suporte do WhatsApp", async () => {
    render(<FloatingWhatsappSupport isMobile={false} pathname="/" />);

    await waitFor(() => {
      const link = screen.getByRole("link", {
        name: /atendimento via whatsapp/i,
      });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toContain(
        "https://wa.me/5511999999999",
      );
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    });
  });

  it("oculta o botão flutuante quando está no mobile e na rota /criar", async () => {
    render(<FloatingWhatsappSupport isMobile={true} pathname="/criar" />);

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /atendimento via whatsapp/i }),
      ).toBeNull();
    });
  });

  it("oculta o botão flutuante quando está no mobile e na rota /checkout/:id", async () => {
    render(
      <FloatingWhatsappSupport
        isMobile={true}
        pathname="/checkout/dafa0872-287a-4df4-8504-07cc3aefe960"
      />,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /atendimento via whatsapp/i }),
      ).toBeNull();
    });
  });

  it("renderiza o botão no desktop mesmo quando estiver na rota /checkout/:id", async () => {
    render(
      <FloatingWhatsappSupport
        isMobile={false}
        pathname="/checkout/dafa0872-287a-4df4-8504-07cc3aefe960"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /atendimento via whatsapp/i }),
      ).toBeDefined();
    });
  });

  it("renderiza o botão no desktop mesmo quando estiver na rota /criar", async () => {
    render(<FloatingWhatsappSupport isMobile={false} pathname="/criar" />);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /atendimento via whatsapp/i }),
      ).toBeDefined();
    });
  });

  it("renderiza o botão no mobile em rotas diferentes de /criar (ex: /)", async () => {
    render(<FloatingWhatsappSupport isMobile={true} pathname="/" />);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /atendimento via whatsapp/i }),
      ).toBeDefined();
    });
  });

  it("possui atributos de acessibilidade e classes de posicionamento no canto inferior direito", async () => {
    render(<FloatingWhatsappSupport isMobile={false} pathname="/" />);

    await waitFor(() => {
      const link = screen.getByRole("link", {
        name: /atendimento via whatsapp/i,
      });
      expect(link.getAttribute("aria-label")).toBe("Atendimento via WhatsApp");
      // Elemento deve ter classes de fixed bottom-4 right-4 z-40
      expect(link.className).toContain("fixed");
      expect(link.className).toContain("bottom-4");
      expect(link.className).toContain("right-4");
      expect(link.className).toContain("z-40");
    });
  });
});
