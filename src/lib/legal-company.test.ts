import { describe, it, expect } from "vitest";
import {
  formatCnpj,
  buildWhatsappSupportUrl,
  getCompanyLegalProfile,
} from "./legal-company";

describe("legal-company module", () => {
  describe("formatCnpj", () => {
    it("deve formatar 14 dígitos numéricos para o padrão XX.XXX.XXX/XXXX-XX", () => {
      expect(formatCnpj("00000000000100")).toBe("00.000.000/0001-00");
      expect(formatCnpj("12345678000195")).toBe("12.345.678/0001-95");
    });

    it("deve manter CNPJ que já está devidamente formatado", () => {
      expect(formatCnpj("00.000.000/0001-00")).toBe("00.000.000/0001-00");
      expect(formatCnpj("12.345.678/0001-95")).toBe("12.345.678/0001-95");
    });

    it("deve retornar o valor limpo se não possuir exatamente 14 dígitos", () => {
      expect(formatCnpj("12345")).toBe("12345");
      expect(formatCnpj("")).toBe("");
    });
  });

  describe("buildWhatsappSupportUrl", () => {
    it("deve sanitizar caracteres não numéricos do telefone", () => {
      const url = buildWhatsappSupportUrl("+55 (11) 99999-9999");
      expect(url).toBe("https://wa.me/5511999999999");
    });

    it("deve incluir texto codificado em URI quando informado", () => {
      const url = buildWhatsappSupportUrl(
        "+55 (11) 99999-9999",
        "Olá! Preciso de ajuda com meu pedido.",
      );
      expect(url).toBe(
        `https://wa.me/5511999999999?text=${encodeURIComponent(
          "Olá! Preciso de ajuda com meu pedido.",
        )}`,
      );
    });

    it("deve omitir parâmetro de texto se vazio ou não informado", () => {
      expect(buildWhatsappSupportUrl("5511999999999", "")).toBe(
        "https://wa.me/5511999999999",
      );
      expect(buildWhatsappSupportUrl("5511999999999", "   ")).toBe(
        "https://wa.me/5511999999999",
      );
    });
  });

  describe("getCompanyLegalProfile", () => {
    it("deve retornar perfil com fallbacks determinísticos quando variáveis de ambiente não forem informadas", () => {
      const profile = getCompanyLegalProfile();

      expect(profile.legalName).toBe("OfertaPronta Tecnologia Ltda");
      expect(profile.tradeName).toBe("OfertaPronta");
      expect(profile.cnpj).toBe("00.000.000/0001-00");
      expect(profile.contactEmail).toBe("contato@ofertapronta.com.br");
      expect(profile.supportWhatsapp).toBe("+55 11 99999-9999");
      expect(profile.supportWhatsappUrl).toContain(
        "https://wa.me/5511999999999",
      );
      expect(profile.supportWhatsappUrl).toContain(
        encodeURIComponent(
          "Olá! Preciso de ajuda com meu pedido no OfertaPronta.",
        ),
      );
      expect(profile.addressCityState).toBe("São Paulo - SP");
    });

    it("deve respeitar overrides de configuração fornecidos", () => {
      const customProfile = getCompanyLegalProfile({
        legalName: "Empresa Customizada Ltda",
        tradeName: "Empresa Custom",
        cnpj: "98765432000110",
        contactEmail: "suporte@empresa.com",
        supportWhatsapp: "+55 (21) 98888-7777",
        addressCityState: "Rio de Janeiro - RJ",
      });

      expect(customProfile.legalName).toBe("Empresa Customizada Ltda");
      expect(customProfile.tradeName).toBe("Empresa Custom");
      expect(customProfile.cnpj).toBe("98.765.432/0001-10");
      expect(customProfile.contactEmail).toBe("suporte@empresa.com");
      expect(customProfile.supportWhatsapp).toBe("+55 (21) 98888-7777");
      expect(customProfile.supportWhatsappUrl).toContain(
        "https://wa.me/5521988887777",
      );
      expect(customProfile.addressCityState).toBe("Rio de Janeiro - RJ");
    });
  });
});
