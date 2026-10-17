import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../../../server/db";
import { orders, paymentCharges } from "../../../../server/db/schema/orders";
import { eq } from "drizzle-orm";
import {
  saveOfferDraft,
  updateDraftPreviewCard,
} from "../../../promotions/server/services/drafts.service";
import { PixCheckoutService } from "./pix-checkout.service";
import type {
  PushinPayService,
  PixChargeResult,
  TransactionStatusResult,
} from "./pushin-pay.service";

class FakePushinPayService implements Partial<PushinPayService> {
  public chargesCreated: Array<{ valueCents: number; webhookUrl?: string }> =
    [];
  public txQueries: string[] = [];
  public nextChargeResult?: PixChargeResult;
  public nextStatusResult?: TransactionStatusResult;
  public shouldFailCharge = false;

  async createCashInCharge(input: {
    valueCents: number;
    webhookUrl?: string;
  }): Promise<PixChargeResult> {
    if (this.shouldFailCharge) {
      throw new Error("Pushin Pay API Unavailable");
    }
    this.chargesCreated.push(input);
    if (this.nextChargeResult) {
      return this.nextChargeResult;
    }
    return {
      txId: `tx_fake_${crypto.randomUUID()}`,
      copiaECola:
        "00020126580014br.gov.bcb.pix0136fake-pix-copia-cola52040000530398654049.905802BR5913OFERTAPRONTA6009SAO PAULO62070503***6304ABCD",
      qrCodeBase64: "data:image/png;base64,fakeQrCodeBase64Png",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      status: "created",
    };
  }

  async getTransactionStatus(txId: string): Promise<TransactionStatusResult> {
    this.txQueries.push(txId);
    if (this.nextStatusResult) {
      return this.nextStatusResult;
    }
    return {
      txId,
      status: "created",
      valueCents: 990,
    };
  }
}

describe("PixCheckoutService Deep Module", () => {
  let fakePushinPay: FakePushinPayService;
  let service: PixCheckoutService;

  beforeEach(() => {
    fakePushinPay = new FakePushinPayService();
    service = new PixCheckoutService(
      fakePushinPay as unknown as PushinPayService,
      db,
    );
  });

  describe("initiateCheckout", () => {
    it("should throw error when draft does not exist", async () => {
      await expect(
        service.initiateCheckout({
          draftId: "non-existent-draft-id",
        }),
      ).rejects.toThrow("Rascunho não encontrado");
    });

    it("should throw error when draft has no generated AI preview", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "supermarket",
        businessName: "Mercado Central",
        offerTitle: "Arroz 5kg Tipo 1",
        promoPrice: "R$ 21,90",
      });

      await expect(
        service.initiateCheckout({
          draftId: draft.id,
        }),
      ).rejects.toThrow(
        "Não é possível iniciar o checkout sem antes gerar a prévia do card com IA",
      );
    });

    it("should freeze immutable snapshot, create order with 990 cents, issue Pix charge and return orderId", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "burger-shop",
        businessName: "Smash Burguer",
        offerTitle: "Combo Duplo Cheddar + Batata",
        promoPrice: "R$ 34,90",
        originalPrice: "R$ 44,90",
        callToAction: "Peça pelo WhatsApp!",
        whatsapp: "11988887777",
      });

      const watermarkedPreview =
        "data:image/webp;base64,mockWatermarkedCardPreview";
      await updateDraftPreviewCard(draft.id, watermarkedPreview);

      const beforeCall = new Date().toISOString();
      const result = await service.initiateCheckout({
        draftId: draft.id,
        customerWhatsapp: "11999998888",
        customerEmail: "cliente@teste.com",
      });

      expect(result.orderId).toBeDefined();
      expect(typeof result.orderId).toBe("string");

      // Verify created order in database
      const [orderRow] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, result.orderId));

      expect(orderRow).toBeDefined();
      expect(orderRow.draftId).toBe(draft.id);
      expect(orderRow.status).toBe("PENDING");
      expect(orderRow.amountCents).toBe(990);
      expect(orderRow.customerWhatsapp).toBe("11999998888");
      expect(orderRow.customerEmail).toBe("cliente@teste.com");
      expect(orderRow.aiRegenerationCount).toBe(0);
      expect(orderRow.paidAt).toBeNull();

      // Verify immutable frozenSnapshot
      const snapshot = orderRow.frozenSnapshot as Record<string, unknown>;
      expect(snapshot).toBeDefined();
      expect(snapshot.draftId).toBe(draft.id);
      expect(snapshot.businessSegment).toBe("burger-shop");
      expect(snapshot.businessName).toBe("Smash Burguer");
      expect(snapshot.offerTitle).toBe("Combo Duplo Cheddar + Batata");
      expect(snapshot.promoPrice).toBe("R$ 34,90");
      expect(snapshot.originalPrice).toBe("R$ 44,90");
      expect(snapshot.previewCardImageUrl).toBe(watermarkedPreview);
      expect(snapshot.frozenAt).toBeDefined();
      expect(String(snapshot.frozenAt) >= beforeCall).toBe(true);

      // Verify payment charge in database
      const [chargeRow] = await db
        .select()
        .from(paymentCharges)
        .where(eq(paymentCharges.orderId, result.orderId));

      expect(chargeRow).toBeDefined();
      expect(chargeRow.status).toBe("PENDING");
      expect(chargeRow.amountCents).toBe(990);
      expect(chargeRow.txId).toBeDefined();
      expect(chargeRow.copiaECola).toContain("br.gov.bcb.pix");
      expect(chargeRow.qrCodeImageUrl).toContain("data:image/png;base64,");
      expect(chargeRow.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("getCheckoutDetails", () => {
    it("should retrieve full checkout details with order and active charge", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "pizzeria",
        businessName: "Pizzaria Napoli",
        offerTitle: "Pizza Calabresa",
        promoPrice: "R$ 39,90",
      });
      await updateDraftPreviewCard(
        draft.id,
        "data:image/webp;base64,previewCardImage",
      );

      const { orderId } = await service.initiateCheckout({
        draftId: draft.id,
        customerWhatsapp: "11987654321",
      });

      const details = await service.getCheckoutDetails(orderId);

      expect(details.orderId).toBe(orderId);
      expect(details.draftId).toBe(draft.id);
      expect(details.status).toBe("PENDING");
      expect(details.amountCents).toBe(990);
      expect(details.customerWhatsapp).toBe("11987654321");
      expect(details.frozenSnapshot).toBeDefined();
      expect(details.charge).not.toBeNull();
      expect(details.charge?.txId).toBeDefined();
      expect(details.charge?.copiaECola).toBeDefined();
      expect(details.charge?.qrCodeBase64).toBeDefined();
      expect(details.charge?.status).toBe("PENDING");
    });

    it("should throw error when order does not exist", async () => {
      await expect(
        service.getCheckoutDetails(crypto.randomUUID()),
      ).rejects.toThrow("Pedido não encontrado");
    });
  });

  describe("handleWebhookPayment (Strict Idempotency & Safety Validation)", () => {
    it("should process valid paid webhook, updating order and charge to PAID atomically", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "beauty-salon",
        businessName: "Salão Bella",
        offerTitle: "Corte + Escova",
        promoPrice: "R$ 60,00",
      });
      await updateDraftPreviewCard(
        draft.id,
        "data:image/webp;base64,previewSalon",
      );

      const { orderId } = await service.initiateCheckout({ draftId: draft.id });
      const details = await service.getCheckoutDetails(orderId);
      const txId = details.charge!.txId;

      const paidIso = "2026-10-16T16:00:00.000Z";
      const webhookResult = await service.handleWebhookPayment({
        id: txId,
        status: "paid",
        value: 990,
        paid_at: paidIso,
      });

      expect(webhookResult.processed).toBe(true);
      expect(webhookResult.orderId).toBe(orderId);

      // Verify in DB
      const [orderRow] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      expect(orderRow.status).toBe("PAID");
      expect(orderRow.paidAt?.toISOString()).toBe(paidIso);

      const [chargeRow] = await db
        .select()
        .from(paymentCharges)
        .where(eq(paymentCharges.orderId, orderId));
      expect(chargeRow.status).toBe("PAID");
      expect(chargeRow.paidAt?.toISOString()).toBe(paidIso);
    });

    it("should be strictly idempotent: secondary identical webhook returns success without re-processing or failing", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "local-retail",
        businessName: "Loja Central",
        offerTitle: "Camiseta Básica",
        promoPrice: "R$ 29,90",
      });
      await updateDraftPreviewCard(
        draft.id,
        "data:image/webp;base64,previewRetail",
      );

      const { orderId } = await service.initiateCheckout({ draftId: draft.id });
      const details = await service.getCheckoutDetails(orderId);
      const txId = details.charge!.txId;

      // First webhook
      const firstResult = await service.handleWebhookPayment({
        id: txId,
        status: "paid",
        value: 990,
      });
      expect(firstResult.processed).toBe(true);
      expect(firstResult.alreadyPaid).toBeUndefined();

      // Second duplicate webhook
      const secondResult = await service.handleWebhookPayment({
        id: txId,
        status: "paid",
        value: 990,
      });
      expect(secondResult.processed).toBe(true);
      expect(secondResult.alreadyPaid).toBe(true);
      expect(secondResult.orderId).toBe(orderId);
    });

    it("should reject webhook with divergent value (e.g. 500 cents) and NOT mark order as PAID", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "restaurant",
        businessName: "Restaurante Sabor",
        offerTitle: "Almoço Executivo",
        promoPrice: "R$ 25,00",
      });
      await updateDraftPreviewCard(
        draft.id,
        "data:image/webp;base64,previewRest",
      );

      const { orderId } = await service.initiateCheckout({ draftId: draft.id });
      const details = await service.getCheckoutDetails(orderId);
      const txId = details.charge!.txId;

      // Tampered value: 500 cents instead of 990
      await expect(
        service.handleWebhookPayment({
          id: txId,
          status: "paid",
          value: 500,
        }),
      ).rejects.toThrow(
        "Valor recebido (500) divergente do esperado (990 centavos)",
      );

      // Verify order is still PENDING
      const [orderRow] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      expect(orderRow.status).toBe("PENDING");
      expect(orderRow.paidAt).toBeNull();
    });

    it("should validate webhook secret when PUSHIN_PAY_WEBHOOK_SECRET is configured", async () => {
      const originalSecret = process.env.PUSHIN_PAY_WEBHOOK_SECRET;
      process.env.PUSHIN_PAY_WEBHOOK_SECRET = "super_secret_webhook_token";

      try {
        const draft = await saveOfferDraft({
          businessSegment: "restaurant",
          businessName: "Restaurante Sabor",
          offerTitle: "Almoço",
          promoPrice: "R$ 25,00",
        });
        await updateDraftPreviewCard(
          draft.id,
          "data:image/webp;base64,preview",
        );
        const { orderId } = await service.initiateCheckout({
          draftId: draft.id,
        });
        const details = await service.getCheckoutDetails(orderId);
        const txId = details.charge!.txId;

        // Call with wrong secret
        await expect(
          service.handleWebhookPayment(
            { id: txId, status: "paid", value: 990 },
            "wrong_secret",
          ),
        ).rejects.toThrow("Assinatura/Secret do Webhook inválido");

        // Call with correct secret
        const validResult = await service.handleWebhookPayment(
          { id: txId, status: "paid", value: 990 },
          "super_secret_webhook_token",
        );
        expect(validResult.processed).toBe(true);
      } finally {
        if (originalSecret !== undefined) {
          process.env.PUSHIN_PAY_WEBHOOK_SECRET = originalSecret;
        } else {
          delete process.env.PUSHIN_PAY_WEBHOOK_SECRET;
        }
      }
    });
  });

  describe("checkPaymentStatus (Active Reconciliation via Polling)", () => {
    it("should return isPaid: true immediately if order is already PAID in database", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "pizzeria",
        businessName: "Pizzaria Roma",
        offerTitle: "Pizza 4 Queijos",
        promoPrice: "R$ 45,00",
      });
      await updateDraftPreviewCard(draft.id, "data:image/webp;base64,preview");
      const { orderId } = await service.initiateCheckout({ draftId: draft.id });
      const details = await service.getCheckoutDetails(orderId);

      await service.handleWebhookPayment({
        id: details.charge!.txId,
        status: "paid",
        value: 990,
      });

      const check = await service.checkPaymentStatus(orderId);
      expect(check.status).toBe("PAID");
      expect(check.isPaid).toBe(true);
      // Remote Pushin Pay should NOT have been queried since local DB was already PAID
      expect(fakePushinPay.txQueries.length).toBe(0);
    });

    it("should actively reconcile from Pushin Pay API if local is PENDING and remote returns paid", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "supermarket",
        businessName: "Mercado Express",
        offerTitle: "Café 500g",
        promoPrice: "R$ 15,90",
      });
      await updateDraftPreviewCard(draft.id, "data:image/webp;base64,preview");
      const { orderId } = await service.initiateCheckout({ draftId: draft.id });
      const details = await service.getCheckoutDetails(orderId);
      const txId = details.charge!.txId;

      // Configure fake Pushin Pay to return paid on remote query (simulating delayed webhook)
      fakePushinPay.nextStatusResult = {
        txId,
        status: "paid",
        valueCents: 990,
        paidAt: new Date("2026-10-16T17:00:00.000Z"),
      };

      const check = await service.checkPaymentStatus(orderId);
      expect(check.status).toBe("PAID");
      expect(check.isPaid).toBe(true);
      expect(fakePushinPay.txQueries).toContain(txId);

      // Verify that DB was actively updated to PAID
      const [orderRow] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      expect(orderRow.status).toBe("PAID");
      expect(orderRow.paidAt).toBeDefined();
    });

    it("should mark charge as EXPIRED when expiresAt is in the past and status is PENDING", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "burger-shop",
        businessName: "Burger Fast",
        offerTitle: "X-Burger",
        promoPrice: "R$ 18,00",
      });
      await updateDraftPreviewCard(draft.id, "data:image/webp;base64,preview");
      const { orderId } = await service.initiateCheckout({ draftId: draft.id });

      // Manually simulate past expiration date on payment charge
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute in the past
      await db
        .update(paymentCharges)
        .set({ expiresAt: pastDate })
        .where(eq(paymentCharges.orderId, orderId));

      const check = await service.checkPaymentStatus(orderId);
      expect(check.status).toBe("EXPIRED");
      expect(check.isPaid).toBe(false);

      const [chargeRow] = await db
        .select()
        .from(paymentCharges)
        .where(eq(paymentCharges.orderId, orderId));
      expect(chargeRow.status).toBe("EXPIRED");
    });
  });

  describe("regenerateExpiredCharge", () => {
    it("should generate a new Pix charge for an expired order and preserve orderId and frozenSnapshot", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "beauty-salon",
        businessName: "Espaço Vip",
        offerTitle: "Manicure",
        promoPrice: "R$ 30,00",
      });
      await updateDraftPreviewCard(draft.id, "data:image/webp;base64,preview");
      const { orderId } = await service.initiateCheckout({ draftId: draft.id });
      const initialDetails = await service.getCheckoutDetails(orderId);
      const initialTxId = initialDetails.charge!.txId;

      // Mark first charge as expired
      await db
        .update(paymentCharges)
        .set({ status: "EXPIRED" })
        .where(eq(paymentCharges.txId, initialTxId));

      // Regenerate charge
      const regenerated = await service.regenerateExpiredCharge(orderId);

      expect(regenerated.orderId).toBe(orderId);
      expect(regenerated.status).toBe("PENDING");
      expect(regenerated.charge).not.toBeNull();
      expect(regenerated.charge?.txId).not.toBe(initialTxId);
      expect(regenerated.charge?.status).toBe("PENDING");

      // Verify that old charge remains EXPIRED and new charge is PENDING
      const charges = await db
        .select()
        .from(paymentCharges)
        .where(eq(paymentCharges.orderId, orderId));

      expect(charges.length).toBe(2);
      const oldCharge = charges.find((c) => c.txId === initialTxId);
      const newCharge = charges.find(
        (c) => c.txId === regenerated.charge?.txId,
      );
      expect(oldCharge?.status).toBe("EXPIRED");
      expect(newCharge?.status).toBe("PENDING");
    });

    it("should throw error if attempting to regenerate a charge for an already PAID order", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "pizzeria",
        businessName: "Pizza Test",
        offerTitle: "Pizza",
        promoPrice: "R$ 30,00",
      });
      await updateDraftPreviewCard(draft.id, "data:image/webp;base64,preview");
      const { orderId } = await service.initiateCheckout({ draftId: draft.id });
      const details = await service.getCheckoutDetails(orderId);

      await service.handleWebhookPayment({
        id: details.charge!.txId,
        status: "paid",
        value: 990,
      });

      await expect(service.regenerateExpiredCharge(orderId)).rejects.toThrow(
        "Pedido já está pago; não é possível reemitir cobrança",
      );
    });
  });

  describe("updateCustomerWhatsapp", () => {
    it("should update the customer whatsapp contact on the order", async () => {
      const draft = await saveOfferDraft({
        businessSegment: "local-retail",
        businessName: "Lojinha",
        offerTitle: "Produto X",
        promoPrice: "R$ 10,00",
      });
      await updateDraftPreviewCard(draft.id, "data:image/webp;base64,preview");
      const { orderId } = await service.initiateCheckout({ draftId: draft.id });

      await service.updateCustomerWhatsapp(orderId, "11977776666");

      const [orderRow] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      expect(orderRow.customerWhatsapp).toBe("11977776666");
    });
  });
});
