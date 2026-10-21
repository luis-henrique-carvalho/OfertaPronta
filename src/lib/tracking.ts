import { clientEnv } from "@/config/client-env";

export interface TrackingEventParams {
  orderId?: string;
  amountCents?: number;
  txId?: string;
  currency?: string;
}

export interface InitTrackingOptions {
  metaPixelId?: string;
  googleAdsId?: string;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type FbqInternal = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: (...args: unknown[]) => void;
};

/**
 * Inicializa de forma defensiva e assíncrona os scripts de rastreamento do Meta Pixel
 * e Google Ads gtag somente quando IDs correspondentes estiverem configurados.
 * Seguro contra SSR (Node.js) e ambientes sem DOM.
 */
export function initTrackingScripts(options?: InitTrackingOptions): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const metaPixelId =
    options?.metaPixelId ?? clientEnv.VITE_PUBLIC_META_PIXEL_ID;
  const googleAdsId =
    options?.googleAdsId ?? clientEnv.VITE_PUBLIC_GOOGLE_ADS_ID;

  // Inicialização defensiva do Meta Pixel
  if (metaPixelId && !document.getElementById("meta-pixel-script")) {
    if (!window.fbq) {
      const fbqQueue: FbqInternal = function (...args: unknown[]) {
        if (fbqQueue.callMethod) {
          fbqQueue.callMethod(...args);
        } else {
          fbqQueue.queue.push(args);
        }
      };
      if (!window._fbq) {
        window._fbq = fbqQueue;
      }
      fbqQueue.push = fbqQueue;
      fbqQueue.loaded = true;
      fbqQueue.version = "2.0";
      fbqQueue.queue = [];
      window.fbq = fbqQueue;
    }

    const script = document.createElement("script");
    script.id = "meta-pixel-script";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onerror = () => {};
    try {
      document.head.appendChild(script);
    } catch {
      // no-op
    }

    window.fbq("init", metaPixelId);
  }

  // Inicialização defensiva do Google Ads (gtag)
  if (googleAdsId && !document.getElementById("google-ads-script")) {
    window.dataLayer = window.dataLayer || [];
    function gtagFn(...args: unknown[]) {
      window.dataLayer?.push(args);
    }
    if (!window.gtag) {
      window.gtag = gtagFn;
    }

    const script = document.createElement("script");
    script.id = "google-ads-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`;
    script.onerror = () => {};
    try {
      document.head.appendChild(script);
    } catch {
      // no-op
    }

    window.gtag("js", new Date());
    window.gtag("config", googleAdsId);
  }
}

/**
 * Dispara evento de visualização de página de forma segura e resiliente.
 */
export function trackPageView(pageUrl?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
    if (typeof window.gtag === "function") {
      window.gtag(
        "event",
        "page_view",
        pageUrl ? { page_location: pageUrl } : {},
      );
    }
  } catch {
    // no-op silencioso
  }
}

/**
 * Notifica o início do fluxo de pagamento (InitiateCheckout / begin_checkout)
 * convertendo centavos em reais com precisão.
 */
export function trackInitiateCheckout(
  orderId: string,
  amountCents: number,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const value = Number((amountCents / 100).toFixed(2));

    if (typeof window.fbq === "function") {
      window.fbq("track", "InitiateCheckout", {
        value,
        currency: "BRL",
        content_name: orderId,
        content_ids: [orderId],
      });
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "begin_checkout", {
        value,
        currency: "BRL",
        transaction_id: orderId,
        items: [{ item_id: orderId }],
      });
    }
  } catch {
    // no-op silencioso
  }
}

/**
 * Notifica a conversão de compra (Purchase / purchase) com proteção estrita
 * de idempotência via sessionStorage para evitar duplicação em refresh de página.
 */
export function trackPurchase(
  orderId: string,
  amountCents: number,
  txId?: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = `ofertapronta_purchase_tracked_${orderId}`;

  try {
    if (window.sessionStorage) {
      const alreadyTracked = window.sessionStorage.getItem(storageKey);
      if (alreadyTracked === "true") {
        return;
      }
      window.sessionStorage.setItem(storageKey, "true");
    }
  } catch {
    // Fallback silencioso se sessionStorage estiver indisponível
  }

  try {
    const value = Number((amountCents / 100).toFixed(2));

    if (typeof window.fbq === "function") {
      window.fbq("track", "Purchase", {
        value,
        currency: "BRL",
        content_name: orderId,
        content_ids: [orderId],
      });
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "purchase", {
        transaction_id: txId || orderId,
        value,
        currency: "BRL",
        items: [{ item_id: orderId }],
      });
    }
  } catch {
    // no-op silencioso
  }
}
