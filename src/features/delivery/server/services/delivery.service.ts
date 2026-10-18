import { eq, sql } from "drizzle-orm";
import { db, type AppDatabase } from "../../../../server/db";
import { orders } from "../../../../server/db/schema/orders";
import { deliveryExports } from "../../../../server/db/schema/delivery";
import {
  formatFeedCard,
  formatStoryCard,
} from "../../../../server/export-engine";
import {
  type DownloadFormat,
  type DeliveryDetailsResult,
  downloadFormatEnum,
} from "../../data/delivery.schemas";
import { createServerLogger } from "../../../../server/logger";

const log = createServerLogger("delivery.service");

export class DeliveryError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "DeliveryError";
    this.code = code;
    this.status = status;
  }
}

export interface DeliveryBinaryResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export interface DeliveryServiceDependencies {
  database?: AppDatabase;
  formatFeed?: (buffer: Buffer) => Promise<Buffer>;
  formatStory?: (buffer: Buffer) => Promise<Buffer>;
}

/**
 * Módulo profundo DeliveryService.
 * Orquestra a entrega permanente em alta resolução (Feed 1080x1350 e Story 1080x1920)
 * para pedidos com pagamento confirmado (PAID), garantindo idempotência e métricas de download.
 */
export class DeliveryService {
  private readonly database: AppDatabase;
  private readonly formatFeed: (buffer: Buffer) => Promise<Buffer>;
  private readonly formatStory: (buffer: Buffer) => Promise<Buffer>;

  constructor(deps?: DeliveryServiceDependencies) {
    this.database = deps?.database ?? db;
    this.formatFeed = deps?.formatFeed ?? formatFeedCard;
    this.formatStory = deps?.formatStory ?? formatStoryCard;
  }

  /**
   * Garante a derivação dos exports em alta resolução a partir da arte mestre limpa
   * e persiste o registro deliveryExports no PostgreSQL de forma estritamente idempotente.
   */
  async ensureDeliveryExports(orderId: string): Promise<DeliveryDetailsResult> {
    const [order] = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      log.warn("Tentativa de carregar entrega para pedido inexistente", {
        orderId,
      });
      throw new DeliveryError(
        `Pedido não encontrado: ${orderId} (ORDER_NOT_FOUND)`,
        "ORDER_NOT_FOUND",
        404,
      );
    }

    if (order.status !== "PAID") {
      log.warn("Tentativa de carregar entrega para pedido não pago", {
        orderId,
        status: order.status,
      });
      throw new DeliveryError(
        `Acesso não autorizado: pedido ${orderId} com status ${order.status} não está pago (ORDER_NOT_PAID)`,
        "ORDER_NOT_PAID",
        403,
      );
    }

    // Idempotência estrita: se exports já foram gerados, retorna imediatamente sem reprocessamento gráfico
    const [existingExport] = await this.database
      .select()
      .from(deliveryExports)
      .where(eq(deliveryExports.orderId, orderId))
      .limit(1);

    if (existingExport) {
      log.info(
        "Idempotência confirmada: deliveryExports já existem para pedido",
        {
          orderId,
        },
      );
      return this.buildDeliveryDetailsResult(order, existingExport);
    }

    const masterDataUrl = this.resolveCleanMasterDataUrl(order);
    const persistedExport = await this.deriveAndPersistFormats(
      order,
      masterDataUrl,
    );

    return this.buildDeliveryDetailsResult(order, persistedExport);
  }

  private resolveCleanMasterDataUrl(order: typeof orders.$inferSelect): string {
    const snapshot = (order.frozenSnapshot || {}) as Record<string, unknown>;
    const masterDataUrl =
      order.cleanMasterImageDataUrl ||
      (typeof snapshot.cleanMasterImageDataUrl === "string"
        ? snapshot.cleanMasterImageDataUrl
        : null) ||
      (typeof snapshot.previewCardImageUrl === "string"
        ? snapshot.previewCardImageUrl
        : null);

    if (!masterDataUrl) {
      log.error("Arte mestre limpa não encontrada no pedido pago", undefined, {
        orderId: order.id,
      });
      throw new DeliveryError(
        `Arte mestre não encontrada para o pedido ${order.id}`,
        "MASTER_ART_NOT_FOUND",
        404,
      );
    }

    return masterDataUrl;
  }

  private async deriveAndPersistFormats(
    order: typeof orders.$inferSelect,
    masterDataUrl: string,
  ): Promise<typeof deliveryExports.$inferSelect> {
    const masterBuffer = this.parseDataUrlBuffer(masterDataUrl);

    log.info(
      "Derivando formatos Feed (1080x1350) e Story (1080x1920) via ExportEngine...",
      {
        orderId: order.id,
        masterBufferBytes: masterBuffer.length,
      },
    );

    const [feedBuffer, storyBuffer] = await Promise.all([
      this.formatFeed(masterBuffer),
      this.formatStory(masterBuffer),
    ]);

    const feedUrl = `data:image/png;base64,${feedBuffer.toString("base64")}`;
    const storyUrl = `data:image/png;base64,${storyBuffer.toString("base64")}`;

    const [persistedExport] = await this.database
      .insert(deliveryExports)
      .values({
        orderId: order.id,
        feedUrl,
        storyUrl,
        downloadCount: 0,
        expiresAt: null,
      })
      .returning();

    log.info("deliveryExports persistidos com sucesso no PostgreSQL", {
      orderId: order.id,
      exportId: persistedExport.id,
    });

    return persistedExport;
  }

  /**
   * Obtém os detalhes completos de entrega do pedido para renderização da view.
   */
  async getDeliveryDetails(orderId: string): Promise<DeliveryDetailsResult> {
    return this.ensureDeliveryExports(orderId);
  }

  /**
   * Registra incremento na contagem de downloads de forma atômica.
   */
  async recordDownload(
    orderId: string,
    format: DownloadFormat,
  ): Promise<{ success: boolean; downloadCount: number }> {
    downloadFormatEnum.parse(format);

    const [order] = await this.database
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new DeliveryError(
        `Pedido não encontrado: ${orderId}`,
        "ORDER_NOT_FOUND",
        404,
      );
    }

    if (order.status !== "PAID") {
      throw new DeliveryError(
        `Acesso não autorizado: pedido ${orderId} com status ${order.status} não está pago (ORDER_NOT_PAID)`,
        "ORDER_NOT_PAID",
        403,
      );
    }

    // Garante que o registro deliveryExports exista
    await this.ensureDeliveryExports(orderId);

    const now = new Date();
    const [updated] = await this.database
      .update(deliveryExports)
      .set({
        downloadCount: sql`${deliveryExports.downloadCount} + 1`,
        lastDownloadedAt: now,
        updatedAt: now,
      })
      .where(eq(deliveryExports.orderId, orderId))
      .returning({ downloadCount: deliveryExports.downloadCount });

    log.info("Métrica de download atualizada com sucesso", {
      orderId,
      format,
      downloadCount: updated?.downloadCount,
    });

    return {
      success: true,
      downloadCount: updated?.downloadCount ?? 1,
    };
  }

  /**
   * Recupera os bytes do PNG HD para download via endpoint HTTP com cabeçalhos de attachment.
   */
  async getExportBinary(
    orderId: string,
    format: DownloadFormat,
  ): Promise<DeliveryBinaryResult> {
    const validatedFormat = downloadFormatEnum.parse(format);

    // Valida o status PAID e garante a existência dos exports
    await this.ensureDeliveryExports(orderId);

    const [exportRecord] = await this.database
      .select()
      .from(deliveryExports)
      .where(eq(deliveryExports.orderId, orderId))
      .limit(1);

    if (!exportRecord) {
      throw new DeliveryError(
        `Arquivos de entrega não encontrados para o pedido ${orderId}`,
        "EXPORTS_NOT_FOUND",
        404,
      );
    }

    const rawDataUrl =
      validatedFormat === "feed" ? exportRecord.feedUrl : exportRecord.storyUrl;

    const buffer = this.parseDataUrlBuffer(rawDataUrl);

    // Registra métrica de download atomicamente
    await this.recordDownload(orderId, validatedFormat);

    return {
      buffer,
      contentType: "image/png",
      filename: `ofertapronta-${validatedFormat}-${orderId}.png`,
    };
  }

  /**
   * Atualiza os exports Feed (1080x1350) e Story (1080x1920) a partir de uma nova arte mestre gerada por regeneração.
   */
  async updateExports(
    orderId: string,
    masterBuffer: Buffer,
  ): Promise<typeof deliveryExports.$inferSelect> {
    const [feedBuffer, storyBuffer] = await Promise.all([
      this.formatFeed(masterBuffer),
      this.formatStory(masterBuffer),
    ]);

    const feedUrl = `data:image/png;base64,${feedBuffer.toString("base64")}`;
    const storyUrl = `data:image/png;base64,${storyBuffer.toString("base64")}`;
    const now = new Date();

    const [existing] = await this.database
      .select()
      .from(deliveryExports)
      .where(eq(deliveryExports.orderId, orderId))
      .limit(1);

    if (existing) {
      const [updated] = await this.database
        .update(deliveryExports)
        .set({
          feedUrl,
          storyUrl,
          updatedAt: now,
        })
        .where(eq(deliveryExports.orderId, orderId))
        .returning();
      return updated;
    }

    const [inserted] = await this.database
      .insert(deliveryExports)
      .values({
        orderId,
        feedUrl,
        storyUrl,
        downloadCount: 0,
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return inserted;
  }

  private buildDeliveryDetailsResult(
    order: typeof orders.$inferSelect,
    exportRecord: typeof deliveryExports.$inferSelect,
  ): DeliveryDetailsResult {
    const snapshot = (order.frozenSnapshot || {}) as Record<string, unknown>;
    const paidAtDate = order.paidAt
      ? new Date(order.paidAt)
      : new Date(order.createdAt);
    const windowDurationMs = 30 * 60 * 1000;
    const windowEndsAtDate = new Date(paidAtDate.getTime() + windowDurationMs);

    const regenerationsUsed = order.aiRegenerationCount ?? 0;
    const maxRegenerations = 3;
    const remainingRegenerations = Math.max(
      0,
      maxRegenerations - regenerationsUsed,
    );
    const now = Date.now();
    const isWithinWindow = now <= windowEndsAtDate.getTime();
    const canRegenerate = isWithinWindow && remainingRegenerations > 0;

    return {
      orderId: order.id,
      status: "PAID",
      offerTitle: String(snapshot.offerTitle || "Oferta Especial"),
      businessName: String(snapshot.businessName || "Estabelecimento"),
      businessSegment: String(snapshot.businessSegment || "supermarket"),
      paidAt: paidAtDate.toISOString(),
      regenerationWindowEndsAt: windowEndsAtDate.toISOString(),
      canRegenerate,
      regenerationsUsed,
      maxRegenerations,
      remainingRegenerations,
      feedCardUrl: exportRecord.feedUrl,
      storyCardUrl: exportRecord.storyUrl,
      downloadCount: exportRecord.downloadCount ?? 0,
      customerWhatsapp:
        order.customerWhatsapp ||
        (typeof snapshot.whatsapp === "string" ? snapshot.whatsapp : null),
      permanentOrderUrl: `/pedido/${order.id}`,
    };
  }

  private parseDataUrlBuffer(dataUrl: string): Buffer {
    const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (match && match[1]) {
      return Buffer.from(match[1], "base64");
    }
    return Buffer.from(dataUrl, "base64");
  }
}
