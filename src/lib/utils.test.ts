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
    expect(formatBRL(990)).toBe("R$ 9,90");
  });

  it("formats zero cents", () => {
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("formats large amounts", () => {
    expect(formatBRL(125050)).toBe("R$ 1.250,50");
  });
});
