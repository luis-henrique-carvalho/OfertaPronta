import { eq, and, desc } from "drizzle-orm";
import { db, type AppDatabase } from "../../../../server/db";
import { orders, paymentCharges } from "../../../../server/db/schema/orders";
import { drafts, type Draft } from "../../../../server/db/schema/promotions";
import { serverEnv } from "../../../../config/server-env";
import {
  initiateCheckoutSchema,
  type InitiateCheckoutInput,
  type CheckoutDetailsResult,
  type PushinPayWebhookPayload,
} from "../../data/checkout.schemas";
import { PushinPayService } from "./pushin-pay.service";

/**
 * Módulo profundo PixCheckoutService.
 * Orquestra a máquina de estados transacional de pedidos e cobranças Pix,
 * o congelamento do snapshot imutável, reconciliação ativa e idempotência estrita.
 */
export class PixCheckoutService {
  constructor(
    private readonly pushinPay: PushinPayService = new PushinPayService(),
    private readonly database: AppDatabase = db,
  ) {}

  private buildFrozenSnapshot(
    draft: Draft,
    customerWhatsapp?: string,
  ): Record<string, unknown> {
    return {
      draftId: draft.id,
      businessSegment: draft.businessSegment,
      targetAspectRatio: draft.targetAspectRatio,
      businessName: draft.businessName,
      offerTitle: draft.offerTitle,
      promoPrice: draft.promoPrice,
      originalPrice: draft.originalPrice,
      callToAction: draft.callToAction,
      whatsapp: customerWhatsapp || draft.whatsapp,
      productImageDataUrl: draft.productImageDataUrl,
      referenceImageDataUrl: draft.referenceImageDataUrl,
      stylePresetId: draft.stylePresetId,
      customStyleInstructions: draft.customStyleInstructions,
      previewCardImageUrl: draft.previewCardImageUrl,
      frozenAt: new Date().toISOString(),
    };
  }

  private async findActivePendingOrder(
    draftId: string,
    customerWhatsapp?: string,
  ): Promise<{ orderId: string } | null> {
    const [existingOrder] = await this.database
      .select()
      .from(orders)
      .where(and(eq(orders.draftId, draftId), eq(orders.status, "PENDING")))
      .limit(1);

    if (!existingOrder) {
      return null;
    }

    const [activeCharge] = await this.database
      .select()
      .from(paymentCharges)
      .where(
        and(
          eq(paymentCharges.orderId, existingOrder.id),
          eq(paymentCharges.status, "PENDING"),
        ),
      )
      .orderBy(desc(paymentCharges.createdAt))
      .limit(1);

    if (activeCharge && activeCharge.expiresAt.getTime() > Date.now()) {
      if (
        customerWhatsapp &&
        customerWhatsapp !== existingOrder.customerWhatsapp
      ) {
        await this.database
          .update(orders)
          .set({ customerWhatsapp, updatedAt: new Date() })
          .where(eq(orders.id, existingOrder.id));
      }
      return { orderId: existingOrder.id };
    }

    return null;
  }

  /**
   * Inicia o checkout Pix para um rascunho com prévia gerada.
   * Congela o snapshot imutável, emite a cobrança na Pushin Pay e persiste Order e PaymentCharge.
   */
  async initiateCheckout(
    input: InitiateCheckoutInput,
  ): Promise<{ orderId: string }> {
    const validated = initiateCheckoutSchema.parse(input);

    const [draft] = await this.database
      .select()
      .from(drafts)
      .where(eq(drafts.id, validated.draftId))
      .limit(1);

    if (!draft) {
      throw new Error("Rascunho não encontrado");
    }

    if (!draft.previewCardImageUrl) {
      throw new Error(
        "Não é possível iniciar o checkout sem antes gerar a prévia do card com IA",
      );
    }

    const activeOrder = await this.findActivePendingOrder(
      draft.id,
      validated.customerWhatsapp,
    );
    if (activeOrder) {
      return activeOrder;
    }

    const frozenSnapshot = this.buildFrozenSnapshot(
      draft,
      validated.customerWhatsapp,
    );
    const chargeResult = await this.pushinPay.createCashInCharge({
      valueCents: 990,
    });

    const orderId = await this.database.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          draftId: draft.id,
          status: "PENDING",
          amountCents: 990,
          frozenSnapshot,
          customerWhatsapp:
            validated.customerWhatsapp || draft.whatsapp || null,
          customerEmail: validated.customerEmail || null,
          aiRegenerationCount: 0,
        })
        .returning({ id: orders.id });

      await tx.insert(paymentCharges).values({
        orderId: newOrder.id,
        txId: chargeResult.txId,
        status: "PENDING",
        qrCodeImageUrl: chargeResult.qrCodeBase64,
        copiaECola: chargeResult.copiaECola,
        amountCents: 990,
        expiresAt: chargeResult.expiresAt,
        rawPayload: chargeResult as unknown as Record<string, unknown>,
      });

      return newOrder.id;
    });

    return { orderId };
  }

  /**
   * Recupera os detalhes do checkout para renderização no frontend.
   */
  async getCheckoutDetails(orderId: string): Promise<CheckoutDetailsResult> {
    const [order] = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    const [latestCharge] = await this.database
      .select()
      .from(paymentCharges)
      .where(eq(paymentCharges.orderId, orderId))
      .orderBy(desc(paymentCharges.createdAt))
      .limit(1);

    return {
      orderId: order.id,
      draftId: order.draftId || "",
      status: order.status as "PENDING" | "PAID" | "EXPIRED" | "CANCELLED",
      amountCents: order.amountCents,
      customerWhatsapp: order.customerWhatsapp || undefined,
      customerEmail: order.customerEmail || undefined,
      frozenSnapshot:
        order.frozenSnapshot as CheckoutDetailsResult["frozenSnapshot"],
      charge: latestCharge
        ? {
            txId: latestCharge.txId,
            copiaECola: latestCharge.copiaECola,
            qrCodeBase64: latestCharge.qrCodeImageUrl || "",
            expiresAt: latestCharge.expiresAt.toISOString(),
            status: latestCharge.status,
          }
        : null,
    };
  }

  /**
   * Processa a notificação de webhook da Pushin Pay com idempotência estrita
   * e validação de segurança de valor recebido (990 centavos).
   */
  async handleWebhookPayment(
    payload: PushinPayWebhookPayload,
    secretHeader?: string,
  ): Promise<{
    processed: boolean;
    orderId?: string;
    alreadyPaid?: boolean;
    ignored?: boolean;
    reason?: string;
  }> {
    const expectedSecret =
      serverEnv.PUSHIN_PAY_WEBHOOK_SECRET ||
      process.env.PUSHIN_PAY_WEBHOOK_SECRET;

    if (expectedSecret && secretHeader !== expectedSecret) {
      throw new Error("Assinatura/Secret do Webhook inválido");
    }

    const [charge] = await this.database
      .select()
      .from(paymentCharges)
      .where(eq(paymentCharges.txId, String(payload.id)))
      .limit(1);

    if (!charge) {
      return {
        processed: false,
        ignored: true,
        reason: `Cobrança com txId ${payload.id} não encontrada no banco`,
      };
    }

    // Idempotência estrita: se a cobrança já estiver paga, encerra com sucesso sem mutação redundante
    if (charge.status === "PAID") {
      return { processed: true, orderId: charge.orderId, alreadyPaid: true };
    }

    if (payload.status === "paid") {
      if (Number(payload.value) !== 990) {
        throw new Error(
          `Valor recebido (${payload.value}) divergente do esperado (990 centavos)`,
        );
      }

      const now = payload.paid_at ? new Date(payload.paid_at) : new Date();

      await this.database.transaction(async (tx) => {
        await tx
          .update(paymentCharges)
          .set({
            status: "PAID",
            paidAt: now,
            updatedAt: new Date(),
          })
          .where(eq(paymentCharges.id, charge.id));

        await tx
          .update(orders)
          .set({
            status: "PAID",
            paidAt: now,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, charge.orderId));
      });

      return { processed: true, orderId: charge.orderId };
    }

    return { processed: false, orderId: charge.orderId };
  }

  /**
   * Consulta o status do pagamento para polling em tempo real.
   * Se o status local ainda for PENDING, efetua reconciliação ativa pontual na API da Pushin Pay.
   */
  async checkPaymentStatus(
    orderId: string,
  ): Promise<{ status: string; isPaid: boolean }> {
    const [order] = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    if (order.status === "PAID") {
      return { status: "PAID", isPaid: true };
    }

    const [charge] = await this.database
      .select()
      .from(paymentCharges)
      .where(eq(paymentCharges.orderId, orderId))
      .orderBy(desc(paymentCharges.createdAt))
      .limit(1);

    if (charge && charge.status === "PENDING") {
      // Checa se expirou por tempo
      if (new Date() > charge.expiresAt) {
        await this.database
          .update(paymentCharges)
          .set({ status: "EXPIRED", updatedAt: new Date() })
          .where(eq(paymentCharges.id, charge.id));
        return { status: "EXPIRED", isPaid: false };
      }

      // Reconciliação ativa com a API da Pushin Pay
      try {
        const remoteTx = await this.pushinPay.getTransactionStatus(charge.txId);
        if (remoteTx.status === "paid" && remoteTx.valueCents === 990) {
          const now = remoteTx.paidAt || new Date();
          await this.database.transaction(async (tx) => {
            await tx
              .update(paymentCharges)
              .set({ status: "PAID", paidAt: now, updatedAt: new Date() })
              .where(eq(paymentCharges.id, charge.id));

            await tx
              .update(orders)
              .set({ status: "PAID", paidAt: now, updatedAt: new Date() })
              .where(eq(orders.id, orderId));
          });
          return { status: "PAID", isPaid: true };
        }
      } catch {
        // Falha transitória na checagem remota não interrompe o polling
      }
    }

    return { status: order.status, isPaid: false };
  }

  /**
   * Reemite cobrança Pix caso a anterior tenha expirado (>30 minutos).
   */
  async regenerateExpiredCharge(
    orderId: string,
  ): Promise<CheckoutDetailsResult> {
    const [order] = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    if (order.status === "PAID") {
      throw new Error("Pedido já está pago; não é possível reemitir cobrança");
    }

    const newCharge = await this.pushinPay.createCashInCharge({
      valueCents: 990,
    });

    await this.database.transaction(async (tx) => {
      await tx
        .update(paymentCharges)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(
          and(
            eq(paymentCharges.orderId, orderId),
            eq(paymentCharges.status, "PENDING"),
          ),
        );

      await tx.insert(paymentCharges).values({
        orderId: order.id,
        txId: newCharge.txId,
        status: "PENDING",
        qrCodeImageUrl: newCharge.qrCodeBase64,
        copiaECola: newCharge.copiaECola,
        amountCents: 990,
        expiresAt: newCharge.expiresAt,
        rawPayload: newCharge as unknown as Record<string, unknown>,
      });

      await tx
        .update(orders)
        .set({ status: "PENDING", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    });

    return this.getCheckoutDetails(orderId);
  }

  /**
   * Atualiza o WhatsApp de contato do cliente no pedido para resgate futuro do link.
   */
  async updateCustomerWhatsapp(
    orderId: string,
    whatsapp: string,
  ): Promise<void> {
    await this.database
      .update(orders)
      .set({ customerWhatsapp: whatsapp, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }
}
