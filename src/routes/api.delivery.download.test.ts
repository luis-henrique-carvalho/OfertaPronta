import { describe, it, expect, vi } from "vitest";
import { handleDeliveryDownloadRequest } from "./api.delivery.download";
import {
  DeliveryError,
  type DeliveryService,
} from "../features/delivery/server/services/delivery.service";

describe("Delivery Download HTTP Route Handler (api.delivery.download)", () => {
  const validOrderId = "123e4567-e89b-12d3-a456-426614174000";

  it("should return HTTP 400 when query parameters are missing", async () => {
    const request = new Request("http://localhost/api/delivery/download", {
      method: "GET",
    });

    const response = await handleDeliveryDownloadRequest(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_PARAMETERS");
    expect(body.error).toContain("orderId");
  });

  it("should return HTTP 400 when format is invalid", async () => {
    const request = new Request(
      `http://localhost/api/delivery/download?orderId=${validOrderId}&format=invalid_format`,
      { method: "GET" },
    );

    const response = await handleDeliveryDownloadRequest(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_PARAMETERS");
  });

  it("should return HTTP 200 with binary buffer and attachment headers on happy path", async () => {
    const fakeBuffer = Buffer.from("fake-png-binary-content");
    const mockService = {
      getExportBinary: vi.fn().mockResolvedValue({
        buffer: fakeBuffer,
        contentType: "image/png",
        filename: `ofertapronta-feed-${validOrderId}.png`,
      }),
    } as unknown as DeliveryService;

    const request = new Request(
      `http://localhost/api/delivery/download?orderId=${validOrderId}&format=feed`,
      { method: "GET" },
    );

    const response = await handleDeliveryDownloadRequest(request, mockService);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Content-Disposition")).toBe(
      `attachment; filename="ofertapronta-feed-${validOrderId}.png"`,
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-transform");

    const arrayBuffer = await response.arrayBuffer();
    expect(Buffer.from(arrayBuffer).toString()).toBe("fake-png-binary-content");
    expect(mockService.getExportBinary).toHaveBeenCalledWith(
      validOrderId,
      "feed",
      { recordDownload: true },
    );
  });

  it("should return HTTP 200 with inline Content-Disposition when inline=true is passed", async () => {
    const fakeBuffer = Buffer.from("fake-png-binary-content");
    const mockService = {
      getExportBinary: vi.fn().mockResolvedValue({
        buffer: fakeBuffer,
        contentType: "image/png",
        filename: `ofertapronta-feed-${validOrderId}.png`,
      }),
    } as unknown as DeliveryService;

    const request = new Request(
      `http://localhost/api/delivery/download?orderId=${validOrderId}&format=feed&inline=true`,
      { method: "GET" },
    );

    const response = await handleDeliveryDownloadRequest(request, mockService);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Content-Disposition")).toBe("inline");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(mockService.getExportBinary).toHaveBeenCalledWith(
      validOrderId,
      "feed",
      { recordDownload: false },
    );
  });

  it("should return HTTP 403 when order is not paid (ORDER_NOT_PAID)", async () => {
    const mockService = {
      getExportBinary: vi
        .fn()
        .mockRejectedValue(
          new DeliveryError("Pedido não está pago", "ORDER_NOT_PAID", 403),
        ),
    } as unknown as DeliveryService;

    const request = new Request(
      `http://localhost/api/delivery/download?orderId=${validOrderId}&format=feed`,
      { method: "GET" },
    );

    const response = await handleDeliveryDownloadRequest(request, mockService);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("ORDER_NOT_PAID");
    expect(body.error).toContain("Pedido não está pago");
  });

  it("should return HTTP 404 when order or exports are not found", async () => {
    const mockService = {
      getExportBinary: vi
        .fn()
        .mockRejectedValue(
          new DeliveryError("Pedido não encontrado", "ORDER_NOT_FOUND", 404),
        ),
    } as unknown as DeliveryService;

    const request = new Request(
      `http://localhost/api/delivery/download?orderId=${validOrderId}&format=story`,
      { method: "GET" },
    );

    const response = await handleDeliveryDownloadRequest(request, mockService);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe("ORDER_NOT_FOUND");
  });

  it("should return HTTP 500 when unexpected error occurs", async () => {
    const mockService = {
      getExportBinary: vi.fn().mockRejectedValue(new Error("Disk IO failure")),
    } as unknown as DeliveryService;

    const request = new Request(
      `http://localhost/api/delivery/download?orderId=${validOrderId}&format=feed`,
      { method: "GET" },
    );

    const response = await handleDeliveryDownloadRequest(request, mockService);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.error).toBe("Disk IO failure");
  });
});
