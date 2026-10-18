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
import {
  getCampaignPlanById,
  type CampaignCatalogEnv,
  type CampaignPlan,
} from "../../data/campaign-catalog";
import { PushinPayService, type PixChargeResult } from "./pushin-pay.service";
import { createServerLogger } from "../../../../server/logger";

const log = createServerLogger("checkout.pix-checkout");

function isDevPaymentBypassActive(): boolean {
  const isDev = (process.env.NODE_ENV ?? serverEnv.NODE_ENV) !== "production";
  if (!isDev) return false;
  if (process.env.DEV_BYPASS_PAYMENT !== undefined) {
    return process.env.DEV_BYPASS_PAYMENT === "true";
  }
  return Boolean(serverEnv.DEV_BYPASS_PAYMENT);
}

/**
 * Módulo profundo PixCheckoutService.
 * Orquestra a máquina de estados transacional de pedidos e cobranças Pix,
 * o congelamento do snapshot imutável, reconciliação ativa e idempotência estrita.
 */
export class PixCheckoutService {
  constructor(
    private readonly pushinPay: PushinPayService = new PushinPayService(),
    private readonly database: AppDatabase = db,
    private readonly catalogEnv?: CampaignCatalogEnv,
  ) {}

  private buildFrozenSnapshot(
    draft: Draft,
    plan: CampaignPlan,
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
      cleanMasterImageDataUrl: draft.cleanMasterImageDataUrl,
      planId: plan.id,
      planName: plan.name,
      amountCents: plan.amountCents,
      maxPostPaymentRegenerations: plan.maxPostPaymentRegenerations,
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
    log.info("Iniciando checkout Pix", { draftId: validated.draftId });

    const plan = getCampaignPlanById(
      validated.planId ?? "single_campaign",
      this.catalogEnv,
    );

    if (!plan.isActiveInMvp) {
      throw new Error(
        `O plano "${plan.name}" (${plan.id}) ainda não está habilitado para compra avulsa no MVP`,
      );
    }

    const [draft] = await this.database
      .select()
      .from(drafts)
      .where(eq(drafts.id, validated.draftId))
      .limit(1);

    if (!draft) {
      log.warn("Tentativa de checkout para rascunho inexistente", {
        draftId: validated.draftId,
      });
      throw new Error("Rascunho não encontrado");
    }

    if (!draft.previewCardImageUrl) {
      log.warn("Tentativa de checkout sem prévia de card gerada", {
        draftId: validated.draftId,
      });
      throw new Error(
        "Não é possível iniciar o checkout sem antes gerar a prévia do card com IA",
      );
    }

    const activeOrder = await this.findActivePendingOrder(
      draft.id,
      validated.customerWhatsapp,
    );
    if (activeOrder) {
      log.info("Reutilizando pedido pendente ativo com cobrança válida", {
        orderId: activeOrder.orderId,
        draftId: draft.id,
      });
      return activeOrder;
    }

    const frozenSnapshot = this.buildFrozenSnapshot(
      draft,
      plan,
      validated.customerWhatsapp,
    );
    log.info(
      "Snapshot imutável congelado. Solicitando cobrança Pix à Pushin Pay...",
      {
        draftId: draft.id,
      },
    );
    const chargeResult = await this.pushinPay.createCashInCharge({
      valueCents: plan.amountCents,
    });
    log.info("Cobrança Pix emitida com sucesso pela Pushin Pay", {
      draftId: draft.id,
      txId: chargeResult.txId,
    });

    const orderId = await this.persistOrderAndCharge(
      draft.id,
      plan,
      frozenSnapshot,
      chargeResult,
      validated.customerWhatsapp || draft.whatsapp || null,
      validated.customerEmail || null,
      draft.cleanMasterImageDataUrl,
    );

    log.info("Pedido e cobrança persistidos com sucesso no PostgreSQL", {
      orderId,
      draftId: draft.id,
      txId: chargeResult.txId,
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
      isDevMode: isDevPaymentBypassActive(),
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
   * e validação de segurança de valor recebido (charge.amountCents).
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
      log.warn("Assinatura/Secret do Webhook inválido", {
        txId: payload.id,
      });
      throw new Error("Assinatura/Secret do Webhook inválido");
    }

    const [charge] = await this.database
      .select()
      .from(paymentCharges)
      .where(eq(paymentCharges.txId, String(payload.id)))
      .limit(1);

    if (!charge) {
      log.warn("Cobrança não encontrada para webhook", {
        txId: payload.id,
      });
      return {
        processed: false,
        ignored: true,
        reason: `Cobrança com txId ${payload.id} não encontrada no banco`,
      };
    }

    // Idempotência estrita: se a cobrança já estiver paga, encerra com sucesso sem mutação redundante
    if (charge.status === "PAID") {
      log.info("Idempotência confirmada: cobrança já estava com status PAID", {
        txId: payload.id,
        orderId: charge.orderId,
      });
      return { processed: true, orderId: charge.orderId, alreadyPaid: true };
    }

    if (payload.status === "paid") {
      if (Number(payload.value) !== charge.amountCents) {
        log.error(
          "Valor recebido divergente do esperado em webhook",
          undefined,
          {
            txId: payload.id,
            receivedValue: payload.value,
            expectedValue: charge.amountCents,
          },
        );
        throw new Error(
          `Valor recebido (${payload.value}) divergente do esperado (${charge.amountCents} centavos)`,
        );
      }

      const now = payload.paid_at ? new Date(payload.paid_at) : new Date();
      await this.markOrderAndChargePaid(
        charge.id,
        charge.orderId,
        charge.txId,
        now,
      );

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
      log.warn("Pedido não encontrado na verificação de status", { orderId });
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
        log.info("Cobrança Pix expirada por tempo", {
          orderId,
          chargeId: charge.id,
        });
        await this.database
          .update(paymentCharges)
          .set({ status: "EXPIRED", updatedAt: new Date() })
          .where(eq(paymentCharges.id, charge.id));
        return { status: "EXPIRED", isPaid: false };
      }

      // Reconciliação ativa com a API da Pushin Pay
      try {
        const remoteTx = await this.pushinPay.getTransactionStatus(charge.txId);
        if (
          remoteTx.status === "paid" &&
          remoteTx.valueCents === charge.amountCents
        ) {
          const now = remoteTx.paidAt || new Date();
          await this.markOrderAndChargePaid(
            charge.id,
            orderId,
            charge.txId,
            now,
          );
          log.info("Reconciliação ativa confirmou pagamento com sucesso", {
            orderId,
            txId: charge.txId,
          });
          return { status: "PAID", isPaid: true };
        }
      } catch (err) {
        log.warn("Falha transitória na checagem remota da Pushin Pay", {
          orderId,
          error: err instanceof Error ? err.message : String(err),
        });
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
    log.info("Regenerando cobrança expirada para pedido", { orderId });
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
      valueCents: order.amountCents,
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
        amountCents: order.amountCents,
        expiresAt: newCharge.expiresAt,
        rawPayload: newCharge as unknown as Record<string, unknown>,
      });

      await tx
        .update(orders)
        .set({ status: "PENDING", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    });

    log.info("Nova cobrança Pix gerada com sucesso para pedido", {
      orderId,
      newTxId: newCharge.txId,
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

  private async persistOrderAndCharge(
    draftId: string,
    plan: CampaignPlan,
    frozenSnapshot: Record<string, unknown>,
    chargeResult: PixChargeResult,
    customerWhatsapp: string | null,
    customerEmail: string | null,
    cleanMasterImageDataUrl?: string | null,
  ): Promise<string> {
    return this.database.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          draftId,
          planId: plan.id,
          status: "PENDING",
          amountCents: plan.amountCents,
          cleanMasterImageDataUrl: cleanMasterImageDataUrl ?? null,
          frozenSnapshot,
          customerWhatsapp,
          customerEmail,
          aiRegenerationCount: 0,
        })
        .returning({ id: orders.id });

      await tx.insert(paymentCharges).values({
        orderId: newOrder.id,
        txId: chargeResult.txId,
        status: "PENDING",
        qrCodeImageUrl: chargeResult.qrCodeBase64,
        copiaECola: chargeResult.copiaECola,
        amountCents: plan.amountCents,
        expiresAt: chargeResult.expiresAt,
        rawPayload: chargeResult as unknown as Record<string, unknown>,
      });

      return newOrder.id;
    });
  }

  private async markOrderAndChargePaid(
    chargeId: string,
    orderId: string,
    txId: string,
    paidAt: Date,
  ): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx
        .update(paymentCharges)
        .set({
          status: "PAID",
          paidAt,
          updatedAt: new Date(),
        })
        .where(eq(paymentCharges.id, chargeId));

      await tx
        .update(orders)
        .set({
          status: "PAID",
          paidAt,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });

    log.info(
      "Webhook processado com sucesso: pedido e cobrança atualizados para PAID",
      {
        orderId,
        txId,
      },
    );
  }

  /**
   * Simula a confirmação imediata de um pagamento Pix em ambiente de desenvolvimento.
   * ESTREITAMENTE BLOQUEADO em produção (lança erro fatal caso invocado em production ou sem DEV_BYPASS_PAYMENT).
   */
  async simulateDevPayment(
    orderId: string,
  ): Promise<{ success: boolean; orderId: string }> {
    if (!isDevPaymentBypassActive()) {
      log.error("Tentativa de simular pagamento em ambiente não autorizado", {
        orderId,
        nodeEnv: serverEnv.NODE_ENV,
        devBypass: serverEnv.DEV_BYPASS_PAYMENT,
      });
      throw new Error("Simulação de pagamento desabilitada neste ambiente");
    }

    const [order] = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    if (order.status === "PAID") {
      return { success: true, orderId };
    }

    const [charge] = await this.database
      .select()
      .from(paymentCharges)
      .where(eq(paymentCharges.orderId, orderId))
      .orderBy(desc(paymentCharges.createdAt))
      .limit(1);

    const now = new Date();
    if (charge) {
      await this.markOrderAndChargePaid(charge.id, order.id, charge.txId, now);
    } else {
      await this.database
        .update(orders)
        .set({ status: "PAID", paidAt: now, updatedAt: now })
        .where(eq(orders.id, orderId));
    }

    log.info("[DEV_MODE] Pagamento Pix simulado com sucesso para pedido", {
      orderId,
    });
    return { success: true, orderId };
  }
}
