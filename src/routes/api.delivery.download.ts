import { createFileRoute } from "@tanstack/react-router";
import { recordDownloadInputSchema } from "../features/delivery/data/delivery.schemas";
import {
  DeliveryService,
  DeliveryError,
} from "../features/delivery/server/services/delivery.service";
import { createServerLogger } from "../server/logger";

const log = createServerLogger("routes.api.delivery.download");

/**
 * Handler puro e testável para download direto de arquivos binários PNG em alta resolução.
 * Valida autenticidade de pedido pago, incrementa métrica de download e injeta headers de attachment.
 */
export async function handleDeliveryDownloadRequest(
  request: Request,
  service?: DeliveryService,
): Promise<Response> {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const format = url.searchParams.get("format");

  log.info("Requisição de download recebida", {
    orderId: orderId ?? undefined,
    format: format ?? undefined,
  });

  const parsed = recordDownloadInputSchema.safeParse({ orderId, format });
  if (!parsed.success) {
    log.warn("Parâmetros inválidos para download", {
      orderId: orderId ?? undefined,
      format: format ?? undefined,
      errors: parsed.error.flatten(),
    });
    return Response.json(
      {
        error:
          "Parâmetros inválidos: orderId (UUID) e format ('feed' ou 'story') são obrigatórios",
        code: "INVALID_PARAMETERS",
      },
      { status: 400 },
    );
  }

  try {
    const s = service ?? new DeliveryService();
    const binary = await s.getExportBinary(
      parsed.data.orderId,
      parsed.data.format,
    );

    log.info("Servindo arquivo binário de alta resolução", {
      orderId: parsed.data.orderId,
      format: parsed.data.format,
      filename: binary.filename,
      sizeBytes: binary.buffer.length,
    });

    return new Response(new Uint8Array(binary.buffer), {
      status: 200,
      headers: {
        "Content-Type": binary.contentType,
        "Content-Disposition": `attachment; filename="${binary.filename}"`,
        "Cache-Control": "private, no-transform",
      },
    });
  } catch (error) {
    if (error instanceof DeliveryError) {
      log.warn("Falha de negócio ao servir download", {
        orderId: parsed.data.orderId,
        code: error.code,
        status: error.status,
        message: error.message,
      });
      return Response.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Erro interno desconhecido ao processar download";
    log.error("Erro inesperado no download", error, {
      orderId: parsed.data.orderId,
      format: parsed.data.format,
    });
    return Response.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/delivery/download")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return handleDeliveryDownloadRequest(request);
      },
      HEAD: async () => {
        return new Response(null, { status: 200 });
      },
      OPTIONS: async ({ request }: { request?: Request }) => {
        return new Response(null, {
          status: 200,
          headers: {
            Allow: "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Origin":
              request?.headers.get("origin") || "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      },
    },
  },
});
