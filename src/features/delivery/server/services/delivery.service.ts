import { eq, sql } from "drizzle-orm";
import { db, type AppDatabase } from "../../../../server/db";
import { orders } from "../../../../server/db/schema/orders";
import { deliveryExports } from "../../../../server/db/schema/delivery";
import {
  getExportEngine,
  type ExportEngine,
  formatFeedCard,
  formatStoryCard,
  applyCobrandingSignature,
  type CobrandingOptions,
} from "../../../../server/export-engine";
import {
  type DownloadFormat,
  type DeliveryDetailsResult,
  downloadFormatEnum,
} from "../../data/delivery.schemas";
import { createServerLogger } from "../../../../server/logger";
import { serverEnv } from "../../../../config/server-env";
import {
  getStorageService,
  type StorageService,
} from "../../../../server/storage";

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
  baseUrl?: string;
  exportEngine?: ExportEngine;
  storageService?: StorageService;
  // Compatibilidade com testes unitários legados que injetam formatadores
  formatFeed?: (buffer: Buffer) => Promise<Buffer>;
  formatStory?: (buffer: Buffer) => Promise<Buffer>;
  applySignature?: (
    buffer: Buffer,
    options?: CobrandingOptions,
  ) => Promise<Buffer>;
}

/**
 * Módulo profundo DeliveryService.
 * Orquestra a entrega permanente em alta resolução (Feed 1080x1350 e Story 1080x1920)
 * para pedidos com pagamento confirmado (PAID), delegando a formatação e uploads ao ExportEngine,
 * garantindo idempotência e métricas de download sem dependência de storage sintético.
 */
function createCustomExportEngine(
  deps: DeliveryServiceDependencies,
  storage: StorageService,
): ExportEngine {
  const formatFeed = deps.formatFeed ?? formatFeedCard;
  const formatStory = deps.formatStory ?? formatStoryCard;
  const applySignature = deps.applySignature ?? applyCobrandingSignature;

  return {
    exportFinalCampaign: async (input) => {
      let [feedBuffer, storyBuffer] = await Promise.all([
        formatFeed(input.masterBuffer),
        formatStory(input.masterBuffer),
      ]);
      if (input.cobranding?.accepted) {
        feedBuffer = await applySignature(feedBuffer, {
          creditText: input.cobranding.creditText,
          aspectRatio: "feed",
        });
        storyBuffer = await applySignature(storyBuffer, {
          creditText: input.cobranding.creditText,
          aspectRatio: "story",
        });
      }
      const feedAssetKey = `orders/${input.orderId}/feed.png`;
      const storyAssetKey = `orders/${input.orderId}/story.png`;
      const [feedUpload, storyUpload] = await Promise.all([
        storage.uploadAsset({
          key: feedAssetKey,
          buffer: feedBuffer,
          contentType: "image/png",
          isPublic: true,
        }),
        storage.uploadAsset({
          key: storyAssetKey,
          buffer: storyBuffer,
          contentType: "image/png",
          isPublic: true,
        }),
      ]);
      const timestamp = Date.now();
      const appendCacheBusting = (url: string) => {
        if (url.startsWith("data:")) return url;
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}v=${timestamp}`;
      };
      return {
        feedUrl: appendCacheBusting(feedUpload.url),
        feedAssetKey,
        storyUrl: appendCacheBusting(storyUpload.url),
        storyAssetKey,
        feedBuffer,
        storyBuffer,
      };
    },
    exportPreviewCard: async () => {
      throw new Error("Não implementado no mock de delivery");
    },
    saveCleanMaster: async (input) => {
      const timestamp = Date.now();
      const prefix = input.prefix ?? "orders";
      const key = `${prefix}/${input.ownerId}/private-master-${timestamp}.png`;
      const upload = await storage.uploadAsset({
        key,
        buffer: input.buffer,
        contentType: input.contentType || "image/png",
        isPublic: false,
      });
      return { key, url: upload.url };
    },
  };
}

export class DeliveryService {
  private readonly database: AppDatabase;
  private readonly baseUrl: string;
  private readonly exportEngine: ExportEngine;
  private readonly storageService: StorageService;

  constructor(deps?: DeliveryServiceDependencies) {
    this.database = deps?.database ?? db;
    const rawBaseUrl =
      deps?.baseUrl ??
      serverEnv.APP_URL ??
      process.env.APP_URL ??
      process.env.VITE_PUBLIC_APP_URL ??
      "";
    this.baseUrl = rawBaseUrl.replace(/\/$/, "");
    this.storageService = deps?.storageService ?? getStorageService();

    if (deps?.exportEngine) {
      this.exportEngine = deps.exportEngine;
    } else if (deps?.formatFeed || deps?.formatStory || deps?.applySignature) {
      this.exportEngine = createCustomExportEngine(deps, this.storageService);
    } else {
      this.exportEngine = getExportEngine({
        storageService: this.storageService,
      });
    }
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

    const masterBuffer = await this.resolveCleanMasterBuffer(order);
    const persistedExport = await this.deriveAndPersistFormats(
      order,
      masterBuffer,
    );

    return this.buildDeliveryDetailsResult(order, persistedExport);
  }

  private async resolveCleanMasterBuffer(
    order: typeof orders.$inferSelect,
  ): Promise<Buffer> {
    const snapshot = (order.frozenSnapshot || {}) as Record<string, unknown>;

    // 1. Tenta recuperar via cleanMasterAssetKey no StorageService
    const assetKey =
      order.cleanMasterAssetKey ||
      (typeof snapshot.cleanMasterAssetKey === "string"
        ? snapshot.cleanMasterAssetKey
        : null);

    if (assetKey) {
      log.info("Recuperando arte mestre do StorageService...", {
        orderId: order.id,
        assetKey,
      });
      const asset = await this.storageService.getAsset(assetKey);
      if (asset) {
        return asset.buffer;
      }
      log.warn(
        "Chave de asset mestre não encontrada no StorageService, tentando fallback Base64",
        {
          orderId: order.id,
          assetKey,
        },
      );
    }

    // 2. Fallback para Base64 legado (order.cleanMasterImageDataUrl ou snapshot)
    const masterDataUrl =
      order.cleanMasterImageDataUrl ||
      (typeof snapshot.cleanMasterImageDataUrl === "string"
        ? snapshot.cleanMasterImageDataUrl
        : null) ||
      (typeof snapshot.previewCardImageUrl === "string"
        ? snapshot.previewCardImageUrl
        : null);

    if (masterDataUrl) {
      return this.parseDataUrlBuffer(masterDataUrl);
    }

    log.error("Arte mestre limpa não encontrada no pedido pago", undefined, {
      orderId: order.id,
    });
    throw new DeliveryError(
      `Arte mestre não encontrada para o pedido ${order.id}`,
      "MASTER_ART_NOT_FOUND",
      404,
    );
  }

  private async deriveAndPersistFormats(
    order: typeof orders.$inferSelect,
    masterBuffer: Buffer,
  ): Promise<typeof deliveryExports.$inferSelect> {
    log.info(
      "Delegando derivação de formatos Feed (1080x1350) e Story (1080x1920) ao ExportEngine...",
      {
        orderId: order.id,
        masterBufferBytes: masterBuffer.length,
      },
    );

    const exportResult = await this.exportEngine.exportFinalCampaign({
      orderId: order.id,
      masterBuffer,
      cobranding: {
        accepted: Boolean(order.cobrandingAccepted),
        creditText: order.cobrandingCreditText ?? undefined,
      },
    });

    const [persistedExport] = await this.database
      .insert(deliveryExports)
      .values({
        orderId: order.id,
        feedUrl: exportResult.feedUrl,
        storyUrl: exportResult.storyUrl,
        feedAssetKey: exportResult.feedAssetKey,
        storyAssetKey: exportResult.storyAssetKey,
        downloadCount: 0,
        expiresAt: null,
      })
      .returning();

    log.info("deliveryExports persistidos com sucesso no PostgreSQL", {
      orderId: order.id,
      exportId: persistedExport.id,
      feedAssetKey: exportResult.feedAssetKey,
      storyAssetKey: exportResult.storyAssetKey,
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
   * Suporta arquivos armazenados no StorageService (R2 / Memória) e registros legados Base64.
   */
  async getExportBinary(
    orderId: string,
    format: DownloadFormat,
    options: { recordDownload?: boolean } = { recordDownload: true },
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

    const assetKey =
      validatedFormat === "feed"
        ? exportRecord.feedAssetKey
        : exportRecord.storyAssetKey;

    let buffer: Buffer | null = null;
    let contentType = "image/png";

    if (assetKey) {
      const stored = await this.storageService.getAsset(assetKey);
      if (stored) {
        buffer = stored.buffer;
        contentType = stored.contentType || "image/png";
      }
    }

    if (!buffer) {
      const rawUrl =
        validatedFormat === "feed"
          ? exportRecord.feedUrl
          : exportRecord.storyUrl;
      if (rawUrl && rawUrl.startsWith("data:")) {
        buffer = this.parseDataUrlBuffer(rawUrl);
      }
    }

    if (!buffer) {
      throw new DeliveryError(
        `Não foi possível carregar o arquivo binário do formato ${validatedFormat} para o pedido ${orderId}`,
        "ASSET_NOT_FOUND",
        404,
      );
    }

    // Registra métrica de download atomicamente apenas se não for inline
    if (options.recordDownload !== false) {
      await this.recordDownload(orderId, validatedFormat);
    }

    return {
      buffer,
      contentType,
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
    const [order] = await this.database
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    log.info("Atualizando exports via ExportEngine...", {
      orderId,
    });

    const exportResult = await this.exportEngine.exportFinalCampaign({
      orderId,
      masterBuffer,
      cobranding: {
        accepted: Boolean(order?.cobrandingAccepted),
        creditText: order?.cobrandingCreditText ?? undefined,
      },
    });

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
          feedUrl: exportResult.feedUrl,
          storyUrl: exportResult.storyUrl,
          feedAssetKey: exportResult.feedAssetKey,
          storyAssetKey: exportResult.storyAssetKey,
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
        feedUrl: exportResult.feedUrl,
        storyUrl: exportResult.storyUrl,
        feedAssetKey: exportResult.feedAssetKey,
        storyAssetKey: exportResult.storyAssetKey,
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

    let feedCardUrl = exportRecord.feedUrl;
    let storyCardUrl = exportRecord.storyUrl;
    const cacheBuster = exportRecord.updatedAt
      ? `?v=${new Date(exportRecord.updatedAt).getTime()}`
      : "";

    if (
      exportRecord.feedAssetKey &&
      !exportRecord.feedUrl?.startsWith("data:")
    ) {
      const publicUrl = this.storageService.getPublicUrl(
        exportRecord.feedAssetKey,
      );
      if (publicUrl.startsWith("data:")) {
        feedCardUrl = publicUrl;
      } else {
        const separator = publicUrl.includes("?") ? "&" : "?";
        feedCardUrl = cacheBuster
          ? `${publicUrl}${separator}${cacheBuster.replace(/^\?/, "")}`
          : publicUrl;
      }
    }

    if (
      exportRecord.storyAssetKey &&
      !exportRecord.storyUrl?.startsWith("data:")
    ) {
      const publicUrl = this.storageService.getPublicUrl(
        exportRecord.storyAssetKey,
      );
      if (publicUrl.startsWith("data:")) {
        storyCardUrl = publicUrl;
      } else {
        const separator = publicUrl.includes("?") ? "&" : "?";
        storyCardUrl = cacheBuster
          ? `${publicUrl}${separator}${cacheBuster.replace(/^\?/, "")}`
          : publicUrl;
      }
    }

    return {
      orderId: order.id,
      status: "PAID",
      amountCents: order.amountCents,
      frozenPlan: {
        amountCents: order.amountCents,
      },
      offerTitle: String(snapshot.offerTitle || "Oferta Especial"),
      businessName: String(snapshot.businessName || "Estabelecimento"),
      businessSegment: String(snapshot.businessSegment || "supermarket"),
      paidAt: paidAtDate.toISOString(),
      regenerationWindowEndsAt: windowEndsAtDate.toISOString(),
      canRegenerate,
      regenerationsUsed,
      maxRegenerations,
      remainingRegenerations,
      feedCardUrl,
      storyCardUrl,
      downloadCount: exportRecord.downloadCount ?? 0,
      customerWhatsapp:
        order.customerWhatsapp ||
        (typeof snapshot.whatsapp === "string" ? snapshot.whatsapp : null),
      permanentOrderUrl: this.baseUrl
        ? `${this.baseUrl}/pedido/${order.id}`
        : `/pedido/${order.id}`,
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
