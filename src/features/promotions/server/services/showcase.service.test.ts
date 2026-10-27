import { describe, expect, it } from "vitest";
import { getShowcaseCards } from "./showcase.service";
import type { AppDatabase } from "@/server/db";

describe("ShowcaseService - getShowcaseCards", () => {
  it("retorna cards curados do catálogo de semente quando o banco retorna lista vazia", async () => {
    // Mock db client que retorna array vazio
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve([]),
          }),
        }),
      }),
    } as unknown as AppDatabase;

    const cards = await getShowcaseCards({ segment: "supermarket" }, mockDb);

    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(cards.every((c) => c.businessSegment === "supermarket")).toBe(true);
    expect(cards[0].title).toBe("Super Encarte da Semana");
  });

  it("normaliza aliases de segmentos como beauty_salon para beauty-salon", async () => {
    const cards = await getShowcaseCards({ segment: "beauty_salon" });

    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(
      cards.every(
        (c) =>
          c.businessSegment === "beauty-salon" ||
          c.businessSegment === "beauty_salon",
      ),
    ).toBe(true);
  });

  it("normaliza aliases de segmentos como burger para burger-shop", async () => {
    const cards = await getShowcaseCards({ segment: "burger" });

    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(
      cards.every(
        (c) =>
          c.businessSegment === "burger-shop" || c.businessSegment === "burger",
      ),
    ).toBe(true);
  });

  it("normaliza aliases de segmentos como retail para local-retail", async () => {
    const cards = await getShowcaseCards({ segment: "retail" });

    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(
      cards.every(
        (c) =>
          c.businessSegment === "local-retail" ||
          c.businessSegment === "retail",
      ),
    ).toBe(true);
  });

  it("nunca retorna lista vazia para os 6 segmentos comerciais padrão", async () => {
    const standardSegments = [
      "supermarket",
      "beauty_salon",
      "pizzeria",
      "burger",
      "restaurant",
      "retail",
    ];

    for (const seg of standardSegments) {
      const cards = await getShowcaseCards({ segment: seg });
      expect(cards.length).toBeGreaterThanOrEqual(3);
      expect(cards[0].imageUrl).toBeDefined();
      expect(cards[0].stylePresetId).toBeDefined();
    }
  });

  it("ordena os cards pelo displayOrder crescente", async () => {
    const cards = await getShowcaseCards({ segment: "pizzeria" });

    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].displayOrder).toBeGreaterThanOrEqual(
        cards[i - 1].displayOrder,
      );
    }
  });

  it("filtra por stylePresetId quando informado", async () => {
    const cards = await getShowcaseCards({
      segment: "supermarket",
      stylePresetId: "market-fresh",
    });

    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(cards[0].stylePresetId).toBe("market-fresh");
  });

  it("retorna registros do banco de dados quando disponíveis", async () => {
    const mockDbCards = [
      {
        id: "db-card-1",
        businessSegment: "supermarket",
        stylePresetId: "market-discount",
        cardIntent: "promo",
        title: "Oferta Exclusiva do Banco",
        description: "Card vindo da tabela showcase_cards",
        imageUrl: "https://r2.cdn.ofertapronta.com.br/showcase/db-card-1.png",
        aspectRatio: "feed",
        isFeatured: true,
        displayOrder: 1,
        metadata: {
          businessName: "Mercado Central",
          promoPrice: "R$ 15,90",
        },
      },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(mockDbCards),
          }),
        }),
      }),
    } as unknown as AppDatabase;

    const cards = await getShowcaseCards({ segment: "supermarket" }, mockDb);

    expect(cards.length).toBe(1);
    expect(cards[0].id).toBe("db-card-1");
    expect(cards[0].title).toBe("Oferta Exclusiva do Banco");
  });

  it("recorre ao catálogo de semente graciosamente se o banco disparar exceção", async () => {
    const brokenDb = {
      select: () => {
        throw new Error("Conexão com PostgreSQL falhou");
      },
    } as unknown as AppDatabase;

    const cards = await getShowcaseCards({ segment: "restaurant" }, brokenDb);

    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(cards[0].title).toBe("Almoço Executivo com Sabor Caseiro");
  });

  it("garante que 100% dos cards do catálogo de semente apontam para o Cloudflare R2 com zero Unsplash", async () => {
    const segments = [
      "supermarket",
      "beauty-salon",
      "pizzeria",
      "burger-shop",
      "restaurant",
      "local-retail",
      "fashion",
    ];

    for (const segment of segments) {
      const cards = await getShowcaseCards({ segment });
      expect(cards.length).toBeGreaterThanOrEqual(3);

      for (const card of cards) {
        expect(card.imageUrl).toContain(
          "https://pub-ofertapronta.r2.dev/showcase/",
        );
        expect(card.imageUrl).not.toContain("images.unsplash.com");
        expect(card.imageUrl.endsWith(".png")).toBe(true);

        // Metadados ricos
        expect(card.title).toBeDefined();
        expect(card.stylePresetId).toBeDefined();
        expect(card.cardIntent).toBeDefined();
        expect(card.metadata).toBeDefined();
        expect(card.metadata?.businessName).toBeDefined();
        expect(card.metadata?.promoPrice).toBeDefined();
        expect(card.metadata?.highlights).toBeInstanceOf(Array);
        expect(card.metadata?.highlights?.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("exporta MOCK_SHOWCASE_IMAGE_DATA_URL como data URL válida de PNG determinístico", async () => {
    const { MOCK_SHOWCASE_IMAGE_DATA_URL } =
      await import("../../data/showcase-catalog");

    expect(MOCK_SHOWCASE_IMAGE_DATA_URL).toBeDefined();
    expect(
      MOCK_SHOWCASE_IMAGE_DATA_URL.startsWith("data:image/png;base64,"),
    ).toBe(true);
    const base64Data = MOCK_SHOWCASE_IMAGE_DATA_URL.replace(
      "data:image/png;base64,",
      "",
    );
    const buffer = Buffer.from(base64Data, "base64");
    expect(buffer.length).toBeGreaterThan(0);
  });
});
