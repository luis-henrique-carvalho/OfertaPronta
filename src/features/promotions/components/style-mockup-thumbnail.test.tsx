// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  StyleMockupThumbnail,
  type StyleMockupSpec,
  type LayoutVariant,
} from "./style-mockup-thumbnail";

describe("StyleMockupThumbnail", () => {
  const variants: {
    variant: LayoutVariant;
    spec: StyleMockupSpec;
    expectedBadge: string;
  }[] = [
    {
      variant: "retail-burst",
      spec: {
        layoutVariant: "retail-burst",
        badgeText: "Super Oferta",
        bgColor: "#EF4444",
        textColor: "#FFFFFF",
        accentColor: "#FBBF24",
      },
      expectedBadge: "SUPER OFERTA",
    },
    {
      variant: "fresh-organic",
      spec: {
        layoutVariant: "fresh-organic",
        badgeText: "Hortifrúti Natural",
        bgColor: "#059669",
        textColor: "#FFFFFF",
        accentColor: "#10B981",
      },
      expectedBadge: "HORTIFRÚTI NATURAL",
    },
    {
      variant: "dark-luxury",
      spec: {
        layoutVariant: "dark-luxury",
        badgeText: "Gourmet Nobre",
        bgColor: "#111827",
        textColor: "#FDE68A",
        accentColor: "#F59E0B",
      },
      expectedBadge: "GOURMET NOBRE",
    },
    {
      variant: "rustic-wood",
      spec: {
        layoutVariant: "rustic-wood",
        badgeText: "Forno a Lenha",
        bgColor: "#451A03",
        textColor: "#FEF3C7",
        accentColor: "#D97706",
      },
      expectedBadge: "FORNO A LENHA",
    },
    {
      variant: "clean-minimal",
      spec: {
        layoutVariant: "clean-minimal",
        badgeText: "Clean & Chic",
        bgColor: "#F8FAFC",
        textColor: "#0F172A",
        accentColor: "#64748B",
      },
      expectedBadge: "CLEAN & CHIC",
    },
    {
      variant: "neon-urban",
      spec: {
        layoutVariant: "neon-urban",
        badgeText: "Fade & Street",
        bgColor: "#090D16",
        textColor: "#FFFFFF",
        accentColor: "#8B5CF6",
      },
      expectedBadge: "FADE & STREET",
    },
  ];

  describe("Renderização de cada uma das 6 variantes visuais de nicho comercial", () => {
    variants.forEach(({ variant, spec, expectedBadge }) => {
      it(`renderiza com sucesso a variante visual '${variant}' com SVG e badge correta`, () => {
        const { container } = render(<StyleMockupThumbnail mockup={spec} />);

        const root = screen.getByRole("img");
        expect(root).toBeDefined();
        expect(root.getAttribute("data-layout-variant")).toBe(variant);
        expect(root.getAttribute("data-testid")).toBe(
          `style-mockup-${variant}`,
        );

        // Valida que o SVG está presente e possui viewBox 4:5
        const svg = container.querySelector("svg");
        expect(svg).toBeDefined();
        expect(svg?.getAttribute("viewBox")).toBe("0 0 200 250");

        // Valida que o texto do badge está presente no SVG
        expect(container.textContent).toContain(expectedBadge);

        // Valida presença de elementos vetoriais esperados
        const rects = container.querySelectorAll("rect");
        expect(rects.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Acessibilidade e Semântica", () => {
    it("utiliza role='img' e aria-label padrão baseado na variante e badge", () => {
      const spec: StyleMockupSpec = {
        layoutVariant: "retail-burst",
        badgeText: "Encarte do Dia",
        bgColor: "#EF4444",
        textColor: "#FFFFFF",
        accentColor: "#FBBF24",
      };

      render(<StyleMockupThumbnail mockup={spec} />);

      const el = screen.getByRole("img", {
        name: "Amostra visual do estilo retail-burst: Encarte do Dia",
      });
      expect(el).toBeDefined();
    });

    it("respeita ariaLabel customizado fornecido via props", () => {
      const spec: StyleMockupSpec = {
        layoutVariant: "dark-luxury",
        badgeText: "Cortes Nobres",
        bgColor: "#111827",
        textColor: "#FDE68A",
        accentColor: "#F59E0B",
      };

      render(
        <StyleMockupThumbnail
          mockup={spec}
          ariaLabel="Estilo visual sofisticado para carnes"
        />,
      );

      const el = screen.getByRole("img", {
        name: "Estilo visual sofisticado para carnes",
      });
      expect(el).toBeDefined();
    });

    it("aplica classes customizadas através da prop className", () => {
      const spec: StyleMockupSpec = {
        layoutVariant: "clean-minimal",
        badgeText: "Estética",
        bgColor: "#F8FAFC",
        textColor: "#0F172A",
        accentColor: "#64748B",
      };

      const { container } = render(
        <StyleMockupThumbnail
          mockup={spec}
          className="custom-test-class shadow-2xl"
        />,
      );

      const root = container.firstElementChild as HTMLElement;
      expect(root.classList.contains("custom-test-class")).toBe(true);
      expect(root.classList.contains("shadow-2xl")).toBe(true);
      expect(root.classList.contains("aspect-[4/5]")).toBe(true);
    });
  });

  describe("Garantia de Performance Local e Isolamento (Zero Requisições)", () => {
    it("não renderiza nenhuma tag <img> remota", () => {
      const spec: StyleMockupSpec = {
        layoutVariant: "rustic-wood",
        badgeText: "Artesanal",
        bgColor: "#451A03",
        textColor: "#FEF3C7",
        accentColor: "#D97706",
      };

      const { container } = render(<StyleMockupThumbnail mockup={spec} />);
      const imgTags = container.querySelectorAll("img");
      expect(imgTags.length).toBe(0);
    });

    it("não dispara requisições de rede (fetch ou XMLHttpRequest) durante a renderização", () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const spec: StyleMockupSpec = {
        layoutVariant: "neon-urban",
        badgeText: "Neon Night",
        bgColor: "#090D16",
        textColor: "#FFFFFF",
        accentColor: "#8B5CF6",
      };

      render(<StyleMockupThumbnail mockup={spec} />);
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe("Resiliência a Variantes Desconhecidas", () => {
    it("renderiza fallback gracioso seguro caso uma variante inesperada seja informada", () => {
      const invalidSpec = {
        layoutVariant: "variante-inexistente" as unknown as LayoutVariant,
        badgeText: "Promoção",
        bgColor: "#EF4444",
        textColor: "#FFFFFF",
        accentColor: "#FBBF24",
      };

      const { container } = render(
        <StyleMockupThumbnail mockup={invalidSpec} />,
      );
      expect(container.querySelector("svg")).toBeDefined();
      expect(container.textContent).toContain("PROMOÇÃO");
    });
  });
});
