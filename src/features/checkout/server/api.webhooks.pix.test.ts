import { describe, it, expect, vi } from "vitest";
import { handlePixWebhookRequest } from "../../../routes/api.webhooks.pix";
import type { PixCheckoutService } from "./services/pix-checkout.service";

describe("Pix Webhook HTTP Route Handler (api.webhooks.pix)", () => {
  it("should return HTTP 400 when request body is not valid JSON", async () => {
    const request = new Request("http://localhost/api/webhooks/pix", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlePixWebhookRequest(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("JSON");
  });

  it("should return HTTP 200 when request body is empty (gateway ping probe)", async () => {
    const request = new Request("http://localhost/api/webhooks/pix", {
      method: "POST",
      body: "",
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlePixWebhookRequest(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("ping probe");
  });

  it("should return HTTP 200 when payload is a test probe without transaction id", async () => {
    const request = new Request("http://localhost/api/webhooks/pix", {
      method: "POST",
      body: JSON.stringify({
        test: true,
        event: "test",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlePixWebhookRequest(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("test probe");
  });

  it("should return HTTP 200 with success when service successfully processes payment", async () => {
    const mockService = {
      handleWebhookPayment: vi.fn().mockResolvedValue({
        processed: true,
        orderId: "order_123",
      }),
    };

    const request = new Request("http://localhost/api/webhooks/pix", {
      method: "POST",
      body: JSON.stringify({
        id: "tx_123",
        status: "paid",
        value: 990,
      }),
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": "my-secret-token",
      },
    });

    const response = await handlePixWebhookRequest(
      request,
      mockService as unknown as PixCheckoutService,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.processed).toBe(true);
    expect(body.orderId).toBe("order_123");

    expect(mockService.handleWebhookPayment).toHaveBeenCalledWith(
      {
        id: "tx_123",
        status: "paid",
        value: 990,
      },
      "my-secret-token",
    );
  });

  it("should return HTTP 400 when service throws security or verification error", async () => {
    const mockService = {
      handleWebhookPayment: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "Valor recebido (500) divergente do esperado (990 centavos)",
          ),
        ),
    };

    const request = new Request("http://localhost/api/webhooks/pix", {
      method: "POST",
      body: JSON.stringify({
        id: "tx_tampered",
        status: "paid",
        value: 500,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlePixWebhookRequest(
      request,
      mockService as unknown as PixCheckoutService,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Valor recebido (500) divergente");
  });
});
