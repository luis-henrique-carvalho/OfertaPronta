import { createFileRoute } from "@tanstack/react-router";
import { pushinPayWebhookSchema } from "../features/checkout/data/checkout.schemas";
import { PixCheckoutService } from "../features/checkout/server/services/pix-checkout.service";
import { createServerLogger } from "../server/logger";

const log = createServerLogger("routes.api.webhooks.pix");

function parseWebhookText(rawText: string): {
  body: unknown;
  isPingProbe: boolean;
  isTestProbe: boolean;
  isJson: boolean;
} {
  if (!rawText || rawText.trim() === "") {
    return {
      body: null,
      isPingProbe: true,
      isTestProbe: false,
      isJson: true,
    };
  }

  try {
    const parsed = JSON.parse(rawText);
    const isTestProbe =
      typeof parsed === "object" &&
      parsed !== null &&
      (!("id" in parsed) ||
        "test" in parsed ||
        ("event" in parsed &&
          (String((parsed as Record<string, unknown>).event)
            .toLowerCase()
            .includes("test") ||
            String((parsed as Record<string, unknown>).event)
              .toLowerCase()
              .includes("med"))));
    return {
      body: parsed,
      isPingProbe: false,
      isTestProbe,
      isJson: true,
    };
  } catch {
    return {
      body: null,
      isPingProbe: false,
      isTestProbe: false,
      isJson: false,
    };
  }
}

/**
 * Handler puro e testável para requisições de webhook Pix da Pushin Pay.
 */
export async function handlePixWebhookRequest(
  request: Request,
  service: PixCheckoutService = new PixCheckoutService(),
): Promise<Response> {
  const method = request.method;
  const url = request.url;
  const headers = Object.fromEntries(request.headers.entries());

  log.info("Webhook Pix recebido", { method, url, headers });

  try {
    const rawText = (await request.text().catch(() => "")) || "";

    const { body, isPingProbe, isTestProbe, isJson } =
      parseWebhookText(rawText);

    if (isPingProbe) {
      log.info("Ping probe detectado no webhook Pix");
      return Response.json(
        {
          success: true,
          message: "Pushin Pay webhook ping probe acknowledged",
        },
        { status: 200 },
      );
    }

    if (!isJson) {
      log.warn("Corpo da requisição de webhook não é JSON válido");
      return Response.json(
        { error: "Corpo da requisição JSON inválido" },
        { status: 400 },
      );
    }

    if (isTestProbe) {
      log.info("Test probe detectado no webhook Pix");
      return Response.json(
        {
          success: true,
          message: "Pushin Pay test probe acknowledged",
        },
        { status: 200 },
      );
    }

    const parsedPayload = pushinPayWebhookSchema.safeParse(body);
    if (!parsedPayload.success) {
      log.info("Payload recebido não é evento Pix conhecido", {
        validationError: parsedPayload.error.flatten(),
      });
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

    log.info("Processando evento Pix de transação", {
      txId: parsedPayload.data.id,
      status: parsedPayload.data.status,
      value: parsedPayload.data.value,
    });

    const result = await service.handleWebhookPayment(
      parsedPayload.data,
      secretHeader,
    );

    log.info("Evento Pix processado com sucesso", {
      txId: parsedPayload.data.id,
      result,
    });

    return Response.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao processar webhook";
    log.error("Erro ao processar webhook Pix", error, { method, url });
    return Response.json({ error: message }, { status: 400 });
  }
}

export const Route = createFileRoute("/api/webhooks/pix")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        log.info("GET recebido na rota de webhook Pix", { url: request.url });
        return Response.json(
          { status: "ok", endpoint: "/api/webhooks/pix" },
          { status: 200 },
        );
      },
      POST: async ({ request }: { request: Request }) => {
        return handlePixWebhookRequest(request);
      },
      HEAD: async () => {
        log.info("HEAD recebido na rota de webhook Pix");
        return new Response(null, { status: 200 });
      },
      OPTIONS: async ({ request }: { request?: Request }) => {
        log.info("OPTIONS recebido na rota de webhook Pix");
        return new Response(null, {
          status: 200,
          headers: {
            Allow: "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Origin":
              request?.headers.get("origin") || "*",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, x-webhook-secret, Authorization",
          },
        });
      },
    },
  },
});
