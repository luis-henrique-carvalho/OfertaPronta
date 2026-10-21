import { eq, sql } from "drizzle-orm";
import { db, type AppDatabase } from "../../../../server/db";
import { orders } from "../../../../server/db/schema/orders";
import { DeliveryService, DeliveryError } from "./delivery.service";
import {
  type RequestRegenerationInput,
  type DeliveryDetailsResult,
  requestRegenerationInputSchema,
} from "../../data/delivery.schemas";
import {
  generateAdCardImage,
  type GenerateAdCardInput,
  type GenerateAdCardResult,
} from "../../../promotions/server/services/ai-card-generator.service";
import type {
  BusinessSegment,
  CardAspectRatio,
} from "../../../promotions/data/offer-brief.schema";
import { createServerLogger } from "../../../../server/logger";
import { resolveRegenerationStyleInstructions } from "@/server/prompt-engine";

const log = createServerLogger("delivery.post-payment-regeneration");

export interface RegenerationDependencies {
  database?: AppDatabase;
  deliveryService?: DeliveryService;
  generateAdCard?: (
    input: GenerateAdCardInput,
  ) => Promise<GenerateAdCardResult>;
}

interface RegenerationContext {
  generateInput: GenerateAdCardInput;
  mergedOfferTitle: string;
  mergedPromoPrice: string;
  mergedOriginalPrice?: string | null;
  mergedCallToAction?: string | null;
  mergedStylePresetId?: string | null;
  mergedColorPalette?: string | null;
  combinedCustomInstructions?: string;
  snapshot: Record<string, unknown>;
}

/**
 * Módulo Profundo PostPaymentRegenerationService.
 * Orquestra o ciclo de regeneração e ajuste por IA pós-pagamento.
 * Garante preservação dos insumos originais (foto e estilo), controle estrito de cota (máx 3),
 * janela temporal de 30 minutos pós-pagamento, e resiliência contra falhas na API de IA.
 */
export class PostPaymentRegenerationService {
  private readonly database: AppDatabase;
  private readonly deliveryService: DeliveryService;
  private readonly generateAdCard: (
    input: GenerateAdCardInput,
  ) => Promise<GenerateAdCardResult>;

  constructor(deps?: RegenerationDependencies) {
    this.database = deps?.database ?? db;
    this.deliveryService =
      deps?.deliveryService ?? new DeliveryService({ database: this.database });
    this.generateAdCard = deps?.generateAdCard ?? generateAdCardImage;
  }

  /**
   * Executa a regeneração da arte publicitária com novos textos/preços/instruções,
   * preservando a foto do produto e referências originais, e atualizando os formatos de entrega.
   */
  async regenerateOrderCard(
    input: RequestRegenerationInput,
  ): Promise<DeliveryDetailsResult> {
    const validated = requestRegenerationInputSchema.parse(input);
    const order = await this.validateOrderEligibility(validated.orderId);
    const context = this.prepareRegenerationContext(order, validated);

    log.info("Disparando geração com IA para regeneração pós-compra", {
      orderId: order.id,
      currentRegenerations: order.aiRegenerationCount,
      offerTitle: context.mergedOfferTitle,
      promoPrice: context.mergedPromoPrice,
    });

    // Se a chamada da IA falhar, a exceção é lançada e a cota NÃO é debitada
    const generationResult = await this.generateAdCard(context.generateInput);

    return this.persistRegenerationAndExports(
      order.id,
      order.aiRegenerationCount,
      generationResult,
      context,
    );
  }

  private async validateOrderEligibility(
    orderId: string,
  ): Promise<typeof orders.$inferSelect> {
    const [order] = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      log.warn("Tentativa de regeneração para pedido inexistente", { orderId });
      throw new DeliveryError(
        `Pedido não encontrado: ${orderId} (ORDER_NOT_FOUND)`,
        "ORDER_NOT_FOUND",
        404,
      );
    }

    if (order.status !== "PAID") {
      log.warn("Tentativa de regeneração para pedido não pago", {
        orderId: order.id,
        status: order.status,
      });
      throw new DeliveryError(
        `Acesso não autorizado: pedido ${order.id} com status ${order.status} não está pago (ORDER_NOT_PAID)`,
        "ORDER_NOT_PAID",
        403,
      );
    }

    if ((order.aiRegenerationCount ?? 0) >= 3) {
      log.warn("Tentativa de regeneração com cota excedida", {
        orderId: order.id,
        aiRegenerationCount: order.aiRegenerationCount,
      });
      throw new DeliveryError(
        "Você já utilizou o limite máximo de 3 regenerações incluídas neste pedido (REGENERATION_QUOTA_EXCEEDED)",
        "REGENERATION_QUOTA_EXCEEDED",
        400,
      );
    }

    const paidAtDate = order.paidAt ? new Date(order.paidAt) : null;
    const windowDurationMs = 30 * 60 * 1000;
    if (!paidAtDate || Date.now() > paidAtDate.getTime() + windowDurationMs) {
      log.warn("Tentativa de regeneração fora da janela de 30 minutos", {
        orderId: order.id,
        paidAt: order.paidAt,
      });
      throw new DeliveryError(
        "A janela de 30 minutos para ajustes por IA neste pedido expirou (REGENERATION_WINDOW_EXPIRED)",
        "REGENERATION_WINDOW_EXPIRED",
        400,
      );
    }

    return order;
  }

  private prepareRegenerationContext(
    order: typeof orders.$inferSelect,
    validated: RequestRegenerationInput,
  ): RegenerationContext {
    const snapshot = (order.frozenSnapshot || {}) as Record<string, unknown>;
    const merged = mergeRegenerationSnapshot(order, snapshot, validated);

    const generateInput: GenerateAdCardInput = {
      businessSegment:
        (snapshot.businessSegment as BusinessSegment) || "supermarket",
      targetAspectRatio:
        (snapshot.targetAspectRatio as CardAspectRatio) || "feed",
      businessName: String(snapshot.businessName || "Estabelecimento"),
      offerTitle: merged.mergedOfferTitle,
      promoPrice: merged.mergedPromoPrice,
      originalPrice: merged.mergedOriginalPrice,
      callToAction: merged.mergedCallToAction,
      whatsapp:
        order.customerWhatsapp ||
        (snapshot.whatsapp as string | undefined) ||
        undefined,
      productImageDataUrl:
        (snapshot.productImageDataUrl as string | undefined) || undefined,
      referenceImageDataUrl:
        (snapshot.referenceImageDataUrl as string | undefined) || undefined,
      baseCardImageDataUrl: merged.baseCardImageDataUrl,
      stylePresetId: merged.mergedStylePresetId || undefined,
      customStyleInstructions: merged.combinedCustomInstructions || undefined,
    };

    return {
      generateInput,
      ...merged,
      snapshot,
    };
  }

  private async persistRegenerationAndExports(
    orderId: string,
    currentCount: number,
    generationResult: GenerateAdCardResult,
    context: RegenerationContext,
  ): Promise<DeliveryDetailsResult> {
    const mimeType = generationResult.mimeType || "image/png";
    const newMasterDataUrl = `data:${mimeType};base64,${generationResult.rawImageBuffer.toString("base64")}`;

    const updatedSnapshot: Record<string, unknown> = {
      ...context.snapshot,
      offerTitle: context.mergedOfferTitle,
      promoPrice: context.mergedPromoPrice,
      ...(context.mergedOriginalPrice !== undefined
        ? { originalPrice: context.mergedOriginalPrice }
        : {}),
      ...(context.mergedCallToAction !== undefined
        ? { callToAction: context.mergedCallToAction }
        : {}),
      ...(context.mergedStylePresetId !== undefined
        ? { stylePresetId: context.mergedStylePresetId }
        : {}),
      ...(context.mergedColorPalette !== undefined
        ? { colorPalette: context.mergedColorPalette }
        : {}),
      ...(context.combinedCustomInstructions
        ? { customStyleInstructions: context.combinedCustomInstructions }
        : {}),
      cleanMasterImageDataUrl: newMasterDataUrl,
      lastRegeneratedAt: new Date().toISOString(),
    };

    const now = new Date();

    await this.database
      .update(orders)
      .set({
        aiRegenerationCount: sql`${orders.aiRegenerationCount} + 1`,
        cleanMasterImageDataUrl: newMasterDataUrl,
        frozenSnapshot: updatedSnapshot,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    log.info("Cota incrementada e arte mestre atualizada no pedido", {
      orderId,
      newRegenerationCount: (currentCount ?? 0) + 1,
    });

    await this.deliveryService.updateExports(
      orderId,
      generationResult.rawImageBuffer,
    );

    return this.deliveryService.getDeliveryDetails(orderId);
  }
}

interface MergedRegenerationSnapshot {
  mergedOfferTitle: string;
  mergedPromoPrice: string;
  mergedOriginalPrice?: string | null;
  mergedCallToAction?: string | null;
  mergedStylePresetId: string | null;
  mergedColorPalette: string | null;
  combinedCustomInstructions?: string;
  baseCardImageDataUrl?: string;
}

function mergeRegenerationSnapshot(
  order: typeof orders.$inferSelect,
  snapshot: Record<string, unknown>,
  validated: RequestRegenerationInput,
): MergedRegenerationSnapshot {
  const mergedOfferTitle = (
    validated.offerTitle?.trim() ||
    (snapshot.offerTitle as string) ||
    "Oferta Especial"
  ).trim();

  const mergedPromoPrice = (
    validated.promoPrice?.trim() ||
    (snapshot.promoPrice as string) ||
    ""
  ).trim();

  const mergedOriginalPrice =
    validated.originalPrice !== undefined
      ? validated.originalPrice
      : (snapshot.originalPrice as string | null | undefined);

  const mergedCallToAction =
    validated.callToAction !== undefined
      ? validated.callToAction
      : (snapshot.callToAction as string | null | undefined);

  const mergedStylePresetId =
    validated.stylePresetId !== undefined
      ? validated.stylePresetId?.trim() || null
      : ((snapshot.stylePresetId as string | undefined) ?? null);

  const mergedColorPalette =
    validated.colorPalette !== undefined
      ? validated.colorPalette?.trim() || null
      : ((snapshot.colorPalette as string | undefined) ?? null);

  const baseCardImageDataUrl =
    (order.cleanMasterImageDataUrl as string | undefined) ||
    (snapshot.cleanMasterImageDataUrl as string | undefined) ||
    undefined;

  const currentAdjustment = validated.customAdjustmentPrompt?.trim();
  const presetChanged = Boolean(
    validated.stylePresetId &&
    validated.stylePresetId.trim().length > 0 &&
    validated.stylePresetId.trim() !==
      ((snapshot.stylePresetId as string | undefined) ?? "").trim(),
  );

  const combinedCustomInstructions = resolveRegenerationStyleInstructions(
    snapshot.customStyleInstructions as string | undefined,
    currentAdjustment,
    {
      presetChanged,
      newStylePresetId: validated.stylePresetId,
      colorPalette: validated.colorPalette,
    },
  );

  return {
    mergedOfferTitle,
    mergedPromoPrice,
    mergedOriginalPrice,
    mergedCallToAction,
    mergedStylePresetId,
    mergedColorPalette,
    combinedCustomInstructions,
    baseCardImageDataUrl,
  };
}
