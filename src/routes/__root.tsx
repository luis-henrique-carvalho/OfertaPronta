// shadcn-ignore: root html document shell
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

import { getDefaultCampaignPlan } from "@/lib/campaign-catalog";

export interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1",
      },
      {
        title: "OfertaPronta • Criação Instantânea de Promoções para Instagram",
      },
      {
        name: "description",
        content: `Sua promoção pronta para postar no Instagram em menos de 90 segundos. ${getDefaultCampaignPlan().formattedPrice} via Pix, sem cadastro.`,
      },
    ],
    links: [
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
  }),
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});

function RootComponent() {
  const context = Route.useRouteContext();
  const client = context?.queryClient ?? getQueryClient();

  return (
    <QueryClientProvider client={client}>
      <html lang="pt-BR" className="scroll-smooth">
        <head>
          <HeadContent />
        </head>
        <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-white">
          <Outlet />
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  );
}
