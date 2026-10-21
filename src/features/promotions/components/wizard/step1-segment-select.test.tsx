// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step1SegmentSelect } from "./step1-segment-select";

describe("Step1SegmentSelect Component", () => {
  it("renderiza todos os segmentos e o seletor de formato com Feed ativo por padrão", () => {
    const handleSelectSegment = vi.fn();
    const handleTargetAspectRatioChange = vi.fn();

    render(
      <Step1SegmentSelect
        segment="supermarket"
        targetAspectRatio="feed"
        onSelectSegment={handleSelectSegment}
        onTargetAspectRatioChange={handleTargetAspectRatioChange}
      />,
    );

    expect(screen.getByText(/Qual é o seu comércio\?/i)).toBeDefined();
    expect(screen.getByText(/Onde você vai postar\?/i)).toBeDefined();

    const feedBtn = screen.getByTestId("aspect-ratio-feed");
    const storyBtn = screen.getByTestId("aspect-ratio-story");

    expect(feedBtn.getAttribute("aria-pressed")).toBe("true");
    expect(storyBtn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(storyBtn);
    expect(handleTargetAspectRatioChange).toHaveBeenCalledWith("story");
  });

  it("permite selecionar outro segmento de negócio", () => {
    const handleSelectSegment = vi.fn();

    render(
      <Step1SegmentSelect
        segment="supermarket"
        onSelectSegment={handleSelectSegment}
      />,
    );

    const pizzeriaBtn = screen.getByTestId("segment-option-pizzeria");
    fireEvent.click(pizzeriaBtn);

    expect(handleSelectSegment).toHaveBeenCalledWith("pizzeria");
  });
});
