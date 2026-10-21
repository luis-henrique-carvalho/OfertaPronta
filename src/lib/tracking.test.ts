// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  initTrackingScripts,
  trackPageView,
  trackInitiateCheckout,
  trackPurchase,
} from "./tracking";

describe("tracking module", () => {
  const errorHandler = (e: Event) => {
    e.preventDefault();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.addEventListener("error", errorHandler);
    sessionStorage.clear();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete (window as Window & { fbq?: unknown }).fbq;
    delete (window as Window & { _fbq?: unknown })._fbq;
    delete (window as Window & { dataLayer?: unknown }).dataLayer;
    delete (window as Window & { gtag?: unknown }).gtag;
  });

  afterEach(() => {
    window.removeEventListener("error", errorHandler);
    sessionStorage.clear();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  describe("resiliência e inicialização defensiva", () => {
    it("não deve disparar exceção ao chamar métodos sem scripts configurados (no-op seguro)", () => {
      expect(() => initTrackingScripts()).not.toThrow();
      expect(() => trackPageView("/qualquer-rota")).not.toThrow();
      expect(() => trackInitiateCheckout("order-1", 990)).not.toThrow();
      expect(() => trackPurchase("order-1", 990)).not.toThrow();
    });

    it("deve injetar scripts quando IDs forem informados", () => {
      initTrackingScripts({
        metaPixelId: "123456789",
        googleAdsId: "AW-987654321",
      });

      const metaScript = document.getElementById("meta-pixel-script");
      const googleScript = document.getElementById("google-ads-script");

      expect(metaScript).not.toBeNull();
      expect(googleScript).not.toBeNull();
      expect(typeof window.fbq).toBe("function");
      expect(typeof window.gtag).toBe("function");
    });

    it("não deve duplicar scripts em chamadas consecutivas de inicialização", () => {
      initTrackingScripts({
        metaPixelId: "123456789",
        googleAdsId: "AW-987654321",
      });
      initTrackingScripts({
        metaPixelId: "123456789",
        googleAdsId: "AW-987654321",
      });

      const metaScripts = document.querySelectorAll("#meta-pixel-script");
      const googleScripts = document.querySelectorAll("#google-ads-script");

      expect(metaScripts.length).toBe(1);
      expect(googleScripts.length).toBe(1);
    });
  });

  describe("trackPageView", () => {
    it("deve delegar PageView para fbq e gtag se disponíveis", () => {
      const fbqMock = vi.fn();
      const gtagMock = vi.fn();
      window.fbq = fbqMock;
      window.gtag = gtagMock;

      trackPageView("https://ofertapronta.com/criar");

      expect(fbqMock).toHaveBeenCalledWith("track", "PageView");
      expect(gtagMock).toHaveBeenCalledWith("event", "page_view", {
        page_location: "https://ofertapronta.com/criar",
      });
    });
  });

  describe("trackInitiateCheckout", () => {
    it("deve converter centavos para reais e notificar provedores", () => {
      const fbqMock = vi.fn();
      const gtagMock = vi.fn();
      window.fbq = fbqMock;
      window.gtag = gtagMock;

      trackInitiateCheckout("ord-abc-123", 990);

      expect(fbqMock).toHaveBeenCalledWith(
        "track",
        "InitiateCheckout",
        expect.objectContaining({
          value: 9.9,
          currency: "BRL",
          content_name: "ord-abc-123",
          content_ids: ["ord-abc-123"],
        }),
      );

      expect(gtagMock).toHaveBeenCalledWith(
        "event",
        "begin_checkout",
        expect.objectContaining({
          value: 9.9,
          currency: "BRL",
          transaction_id: "ord-abc-123",
          items: [{ item_id: "ord-abc-123" }],
        }),
      );
    });
  });

  describe("trackPurchase e Idempotência via sessionStorage", () => {
    it("deve despachar evento Purchase na primeira chamada", () => {
      const fbqMock = vi.fn();
      const gtagMock = vi.fn();
      window.fbq = fbqMock;
      window.gtag = gtagMock;

      trackPurchase("ord-paid-001", 990, "tx-pix-123");

      expect(fbqMock).toHaveBeenCalledTimes(1);
      expect(fbqMock).toHaveBeenCalledWith(
        "track",
        "Purchase",
        expect.objectContaining({
          value: 9.9,
          currency: "BRL",
          content_name: "ord-paid-001",
          content_ids: ["ord-paid-001"],
        }),
      );

      expect(gtagMock).toHaveBeenCalledTimes(1);
      expect(gtagMock).toHaveBeenCalledWith(
        "event",
        "purchase",
        expect.objectContaining({
          transaction_id: "tx-pix-123",
          value: 9.9,
          currency: "BRL",
          items: [{ item_id: "ord-paid-001" }],
        }),
      );

      expect(
        sessionStorage.getItem("ofertapronta_purchase_tracked_ord-paid-001"),
      ).toBe("true");
    });

    it("NÃO deve re-disparar Purchase para o mesmo orderId na mesma sessão (idempotência)", () => {
      const fbqMock = vi.fn();
      const gtagMock = vi.fn();
      window.fbq = fbqMock;
      window.gtag = gtagMock;

      // Primeiro disparo
      trackPurchase("ord-paid-001", 990, "tx-pix-123");
      expect(fbqMock).toHaveBeenCalledTimes(1);
      expect(gtagMock).toHaveBeenCalledTimes(1);

      // Segundo disparo (simulando F5 ou re-render da view)
      trackPurchase("ord-paid-001", 990, "tx-pix-123");
      expect(fbqMock).toHaveBeenCalledTimes(1);
      expect(gtagMock).toHaveBeenCalledTimes(1);
    });

    it("deve permitir disparo de Purchase para pedidos distintos", () => {
      const fbqMock = vi.fn();
      const gtagMock = vi.fn();
      window.fbq = fbqMock;
      window.gtag = gtagMock;

      trackPurchase("ord-001", 990);
      trackPurchase("ord-002", 1490);

      expect(fbqMock).toHaveBeenCalledTimes(2);
      expect(gtagMock).toHaveBeenCalledTimes(2);
    });
  });
});
