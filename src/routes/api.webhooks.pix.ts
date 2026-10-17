import { createFileRoute } from "@tanstack/react-router";
import { pushinPayWebhookSchema } from "../features/checkout/data/checkout.schemas";
import { PixCheckoutService } from "../features/checkout/server/services/pix-checkout.service";

/**
 * Handler puro e testável para requisições de webhook Pix da Pushin Pay.
 */
export async function handlePixWebhookRequest(
  request: Request,
  service: PixCheckoutService = new PixCheckoutService(),
): Promise<Response> {
  try {
    let rawText = "";
    try {
      rawText = await request.text();
    } catch {
      // Ignora erro ao ler texto
    }

    // Pings de teste/conectividade do gateway com corpo vazio
    if (!rawText || rawText.trim() === "") {
      return Response.json(
        {
          success: true,
          message: "Pushin Pay webhook ping probe acknowledged",
        },
        { status: 200 },
      );
    }

    let rawBody: unknown;
    try {
      rawBody = JSON.parse(rawText);
    } catch {
      return Response.json(
        { error: "Corpo da requisição JSON inválido" },
        { status: 400 },
      );
    }

    // Se for probe de teste do painel da Pushin Pay (ex: {}, { test: true }, { event: "test" } ou sem "id")
    if (
      typeof rawBody === "object" &&
      rawBody !== null &&
      (!("id" in rawBody) ||
        "test" in rawBody ||
        ("event" in rawBody &&
          (rawBody as Record<string, unknown>).event === "test"))
    ) {
      return Response.json(
        { success: true, message: "Pushin Pay test probe acknowledged" },
        { status: 200 },
      );
    }

    const parsedPayload = pushinPayWebhookSchema.safeParse(rawBody);

    if (!parsedPayload.success) {
      return Response.json(
        {
          success: true,
          ignored: true,
          message: "Payload não é um evento de pagamento Pix conhecido",
        },
        { status: 200 },
      );
    }

    const secretHeader =
      request.headers.get("x-webhook-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      undefined;

    const result = await service.handleWebhookPayment(
      parsedPayload.data,
      secretHeader,
    );

    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao processar webhook";
    return Response.json({ error: message }, { status: 400 });
  }
}

export const Route = createFileRoute("/api/webhooks/pix")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json(
          { status: "ok", endpoint: "/api/webhooks/pix" },
          { status: 200 },
        );
      },
      POST: async ({ request }: { request: Request }) => {
        return handlePixWebhookRequest(request);
      },
    },
  },
});
