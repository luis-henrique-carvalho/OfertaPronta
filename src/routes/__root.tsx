// shadcn-ignore: root html document shell
import { useEffect } from "react";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import "@/styles/index.css";
import { RootErrorComponent } from "@/components/shared/root-error-component";
import { RootNotFoundComponent } from "@/components/shared/root-not-found-component";
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";
import { FloatingWhatsappSupport } from "@/components/shared/floating-whatsapp-support";
import { initTrackingScripts } from "@/lib/tracking";
import { clientEnv } from "@/config/client-env";
import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";

export interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    const title =
      "OfertaPronta • Cards Publicitários com Inteligência Artificial";
    const description = `Sua promoção pronta para postar no Instagram e WhatsApp em menos de 90 segundos. ${getDefaultCampaignPlan().formattedPrice} via Pix, sem cadastro.`;
    const appUrl =
      clientEnv.VITE_PUBLIC_APP_URL || "https://ofertapronta.com.br";

    return {
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, maximum-scale=1",
        },
        {
          title,
        },
        {
          name: "description",
          content: description,
        },
        // OpenGraph
        {
          property: "og:title",
          content: title,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:url",
          content: appUrl,
        },
        // Twitter Card
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:title",
          content: title,
        },
        {
          name: "twitter:description",
          content: description,
        },
      ],
      links: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        },
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
        },
      ],
    };
  },
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});

function RootComponent() {
  const context = Route.useRouteContext();
  const client = context?.queryClient ?? getQueryClient();

  useEffect(() => {
    initTrackingScripts();
  }, []);

  return (
    <QueryClientProvider client={client}>
      <html lang="pt-BR" className="scroll-smooth">
        <head>
          <HeadContent />
        </head>
        <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-white">
          <Outlet />
          <CookieConsentBanner />
          <FloatingWhatsappSupport />
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  );
}
