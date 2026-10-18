import { describe, it, expect, vi } from "vitest";
import { PushinPayService, PushinPayError } from "./pushin-pay.service";

describe("PushinPayService Deep Module", () => {
  const mockToken = "test_bearer_token_123";
  const mockBaseUrl = "https://api.pushinpay.test";

  describe("createCashInCharge", () => {
    it("should issue a Pix Cash-In charge of 990 cents and return txId, EMV copiaECola, qrCodeBase64 and 30-min expiration", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: "tx_pushin_abc123",
          qr_code:
            "00020126580014br.gov.bcb.pix0136test-pix-copia-e-cola52040000530398654049.905802BR5913OFERTAPRONTA6009SAO PAULO62070503***6304ABCD",
          qr_code_base64:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          status: "created",
          value: 990,
        }),
      });

      const service = new PushinPayService({
        token: mockToken,
        baseUrl: mockBaseUrl,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const beforeCall = Date.now();
      const result = await service.createCashInCharge({
        valueCents: 990,
        webhookUrl: "https://ofertapronta.test/api/webhooks/pix",
      });
      const afterCall = Date.now();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.pushinpay.test/api/pix/cashIn");
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      });
      expect(JSON.parse(options.body)).toEqual({
        value: 990,
        webhook_url: "https://ofertapronta.test/api/webhooks/pix",
      });

      expect(result.txId).toBe("tx_pushin_abc123");
      expect(result.copiaECola).toContain("00020126580014br.gov.bcb.pix");
      expect(result.qrCodeBase64).toContain("data:image/png;base64,");
      expect(result.status).toBe("created");

      // Verify expiration is approximately 30 minutes in the future (+/- 5 seconds)
      const expectedMinExpires = beforeCall + 30 * 60 * 1000 - 5000;
      const expectedMaxExpires = afterCall + 30 * 60 * 1000 + 5000;
      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMinExpires,
      );
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMaxExpires,
      );
    });

    it("should fallback to environment PUSHIN_PAY_WEBHOOK_URL when webhookUrl is omitted", async () => {
      const originalEnv = process.env.PUSHIN_PAY_WEBHOOK_URL;
      process.env.PUSHIN_PAY_WEBHOOK_URL =
        "https://env.ofertapronta.com.br/api/webhooks/pix";

      try {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            id: "tx_env_default",
            qr_code: "000201...",
            qr_code_base64: "data:image/png;base64,...",
            status: "created",
            value: 990,
          }),
        });

        const service = new PushinPayService({
          token: mockToken,
          baseUrl: mockBaseUrl,
          fetchFn: mockFetch as unknown as typeof fetch,
        });

        await service.createCashInCharge({ valueCents: 990 });

        const [, options] = mockFetch.mock.calls[0];
        expect(JSON.parse(options.body)).toEqual({
          value: 990,
          webhook_url: "https://env.ofertapronta.com.br/api/webhooks/pix",
        });
      } finally {
        process.env.PUSHIN_PAY_WEBHOOK_URL = originalEnv;
      }
    });

    it("should throw PushinPayError with statusCode when API returns non-2xx status code", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized: Token inválido ou expirado",
      });

      const service = new PushinPayService({
        token: "invalid_token",
        baseUrl: mockBaseUrl,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(
        service.createCashInCharge({ valueCents: 990 }),
      ).rejects.toThrow(PushinPayError);

      try {
        await service.createCashInCharge({ valueCents: 990 });
      } catch (err) {
        expect(err).toBeInstanceOf(PushinPayError);
        const pErr = err as PushinPayError;
        expect(pErr.statusCode).toBe(401);
        expect(pErr.message).toContain("401");
        expect(pErr.message).toContain("Unauthorized");
      }
    });

    it("should throw PushinPayError when token is missing", async () => {
      const service = new PushinPayService({
        token: "",
        baseUrl: mockBaseUrl,
        bypassPayment: false,
      });

      await expect(
        service.createCashInCharge({ valueCents: 990 }),
      ).rejects.toThrow("PUSHIN_PAY_TOKEN");
    });
  });

  describe("getTransactionStatus", () => {
    it("should fetch transaction status by txId with Bearer token authorization", async () => {
      const mockPaidAtIso = "2026-10-16T15:30:00.000Z";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "tx_check_999",
          status: "paid",
          value: 990,
          paid_at: mockPaidAtIso,
        }),
      });

      const service = new PushinPayService({
        token: mockToken,
        baseUrl: mockBaseUrl,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const statusResult = await service.getTransactionStatus("tx_check_999");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        "https://api.pushinpay.test/api/transactions/tx_check_999",
      );
      expect(options.method).toBe("GET");
      expect(options.headers).toEqual({
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      });

      expect(statusResult.txId).toBe("tx_check_999");
      expect(statusResult.status).toBe("paid");
      expect(statusResult.valueCents).toBe(990);
      expect(statusResult.paidAt).toBeInstanceOf(Date);
      expect(statusResult.paidAt?.toISOString()).toBe(mockPaidAtIso);
    });

    it("should return status without paidAt when transaction is still pending/created", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "tx_pending_111",
          status: "created",
          value: 990,
          paid_at: null,
        }),
      });

      const service = new PushinPayService({
        token: mockToken,
        baseUrl: mockBaseUrl,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const statusResult = await service.getTransactionStatus("tx_pending_111");

      expect(statusResult.txId).toBe("tx_pending_111");
      expect(statusResult.status).toBe("created");
      expect(statusResult.paidAt).toBeUndefined();
      expect(statusResult.valueCents).toBe(990);
    });

    it("should throw PushinPayError when transaction query fails with 404 or 500", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Transação não encontrada",
      });

      const service = new PushinPayService({
        token: mockToken,
        baseUrl: mockBaseUrl,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(service.getTransactionStatus("tx_unknown")).rejects.toThrow(
        PushinPayError,
      );
    });

    it("should return simulated status when DEV_BYPASS_PAYMENT is enabled for mock txId", async () => {
      const origEnv = process.env.DEV_BYPASS_PAYMENT;
      const origNodeEnv = process.env.NODE_ENV;
      try {
        process.env.DEV_BYPASS_PAYMENT = "true";
        process.env.NODE_ENV = "development";

        const service = new PushinPayService({
          token: "",
          baseUrl: mockBaseUrl,
        });

        const status = await service.getTransactionStatus("mock_dev_tx_12345");
        expect(status.status).toBe("created");
        expect(status.txId).toBe("mock_dev_tx_12345");
      } finally {
        process.env.DEV_BYPASS_PAYMENT = origEnv;
        process.env.NODE_ENV = origNodeEnv;
      }
    });
  });

  describe("createCashInCharge with DEV_BYPASS_PAYMENT", () => {
    it("should return a simulated Pix charge when token is missing and DEV_BYPASS_PAYMENT is true in dev mode", async () => {
      const origEnv = process.env.DEV_BYPASS_PAYMENT;
      const origNodeEnv = process.env.NODE_ENV;
      try {
        process.env.DEV_BYPASS_PAYMENT = "true";
        process.env.NODE_ENV = "development";

        const service = new PushinPayService({
          token: "",
          baseUrl: mockBaseUrl,
        });

        const charge = await service.createCashInCharge({ valueCents: 990 });
        expect(charge.txId).toMatch(/^mock_dev_tx_/);
        expect(charge.copiaECola).toContain("mock-pix-dev-bypass");
        expect(charge.qrCodeBase64).toContain("data:image/svg+xml");
        expect(charge.status).toBe("created");
      } finally {
        process.env.DEV_BYPASS_PAYMENT = origEnv;
        process.env.NODE_ENV = origNodeEnv;
      }
    });
  });
});
