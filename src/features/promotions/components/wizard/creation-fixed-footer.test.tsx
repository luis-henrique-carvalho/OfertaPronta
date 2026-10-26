// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CreationFixedFooter } from "./creation-fixed-footer";

describe("CreationFixedFooter Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza botão 'Continuar e Gerar Card' ativo e mensagem informativa quando cota esgotada (Passo 4)", () => {
    const handleGenerate = vi.fn();
    const handleBack = vi.fn();
    const handleNext = vi.fn();

    render(
      <CreationFixedFooter
        step={4}
        quotaBlocked={true}
        onBack={handleBack}
        onNext={handleNext}
        onGenerate={handleGenerate}
      />,
    );

    // Mensagem amigável presente
    const notice = screen.getByText(
      /Você usou suas 2 prévias grátis de hoje\. Confirme o Pix \(R\$ 9,90\) e nossa IA criará seu card logo após o pagamento\./i,
    );
    expect(notice).toBeDefined();

    // Botão de geração ativo e com texto correto
    const generateBtn = screen.getByTestId("btn-wizard-generate");
    expect(generateBtn).toBeDefined();
    expect(generateBtn.hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("Continuar e Gerar Card")).toBeDefined();

    // Clique dispara onGenerate
    fireEvent.click(generateBtn);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  it("exibe estado de carregamento 'Iniciando Pix...' desabilitado quando isCheckingOut for true", () => {
    render(
      <CreationFixedFooter
        step={4}
        quotaBlocked={true}
        isCheckingOut={true}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );

    const generateBtn = screen.getByTestId("btn-wizard-generate");
    expect(generateBtn.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Iniciando Pix\.\.\./i)).toBeDefined();
  });

  it("renderiza botão padrão 'Gerar Meu Card' quando cota não está bloqueada (Passo 4)", () => {
    render(
      <CreationFixedFooter
        step={4}
        quotaBlocked={false}
        quotaLabel="2 prévias grátis restantes hoje"
        onBack={vi.fn()}
        onNext={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );

    expect(screen.getByText("Gerar Meu Card")).toBeDefined();
    expect(screen.getByText("2 prévias grátis restantes hoje")).toBeDefined();
    const generateBtn = screen.getByTestId("btn-wizard-generate");
    expect(generateBtn.hasAttribute("disabled")).toBe(false);
  });

  it("renderiza botão 'Continuar' nos passos intermediários", () => {
    const handleNext = vi.fn();
    render(
      <CreationFixedFooter
        step={2}
        isStep2Valid={true}
        onBack={vi.fn()}
        onNext={handleNext}
        onGenerate={vi.fn()}
      />,
    );

    const nextBtn = screen.getByTestId("btn-wizard-next");
    expect(nextBtn).toBeDefined();
    expect(screen.getByText("Continuar")).toBeDefined();
    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });
});
