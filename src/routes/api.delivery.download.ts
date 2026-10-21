import { createFileRoute } from "@tanstack/react-router";
import { recordDownloadInputSchema } from "../features/delivery/data/delivery.schemas";
import {
  DeliveryService,
  DeliveryError,
} from "../features/delivery/server/services/delivery.service";
import { createServerLogger } from "../server/logger";

const log = createServerLogger("routes.api.delivery.download");

function createBinaryResponse(
  binary: { filename: string; buffer: Buffer; contentType: string },
  inline: boolean,
): Response {
  const disposition = inline
    ? "inline"
    : `attachment; filename="${binary.filename}"`;

  return new Response(new Uint8Array(binary.buffer), {
    status: 200,
    headers: {
      "Content-Type": binary.contentType,
      "Content-Disposition": disposition,
      "Cache-Control": inline
        ? "public, max-age=86400"
        : "private, no-transform",
    },
  });
}

function handleDownloadError(
  error: unknown,
  orderId: string,
  format: string,
): Response {
  if (error instanceof DeliveryError) {
    log.warn("Falha de negócio ao servir download", {
      orderId,
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
    orderId,
    format,
  });
  return Response.json(
    { error: message, code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

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
  const inline = url.searchParams.get("inline") === "true";

  log.info("Requisição de download recebida", {
    orderId: orderId ?? undefined,
    format: format ?? undefined,
    inline,
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
      { recordDownload: !inline },
    );

    log.info("Servindo arquivo binário de alta resolução", {
      orderId: parsed.data.orderId,
      format: parsed.data.format,
      filename: binary.filename,
      sizeBytes: binary.buffer.length,
      inline,
    });

    return createBinaryResponse(binary, inline);
  } catch (error) {
    return handleDownloadError(error, parsed.data.orderId, parsed.data.format);
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
