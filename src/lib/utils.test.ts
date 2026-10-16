import { describe, expect, it } from "vitest";
import { cn, formatBRL } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2 py-1", "bg-red-500")).toBe("px-2 py-1 bg-red-500");
  });

  it("handles tailwind class conflicts using twMerge", () => {
    expect(cn("px-2 text-sm", "px-4 text-lg")).toBe("px-4 text-lg");
  });

  it("handles conditional classes and falsy values", () => {
    const isPrimary = false;
    const isLarge = true;
    expect(
      cn(
        "base-class",
        isPrimary && "text-primary",
        isLarge && "text-xl",
        null,
        undefined,
      ),
    ).toBe("base-class text-xl");
  });
});

describe("formatBRL utility", () => {
  it("formats cents into standard BRL currency representation", () => {
    const formatted = formatBRL(990);
    // Replace non-breaking space if Intl uses NBSP
    const normalized = formatted.replace(/\u00a0/g, " ");
    expect(normalized).toBe("R$ 9,90");
  });

  it("formats zero cents", () => {
    const formatted = formatBRL(0);
    const normalized = formatted.replace(/\u00a0/g, " ");
    expect(normalized).toBe("R$ 0,00");
  });

  it("formats large amounts", () => {
    const formatted = formatBRL(125050);
    const normalized = formatted.replace(/\u00a0/g, " ");
    expect(normalized).toBe("R$ 1.250,50");
  });
});
