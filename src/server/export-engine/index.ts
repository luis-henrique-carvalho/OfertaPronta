/**
 * ExportEngine - Módulo Profundo Server-Only para Processamento e Exportação de Imagens.
 *
 * Responsável por:
 * - Aplicação de marca d'água de proteção para prévias gratuitas (exportPreviewCard).
 * - Formatação determinística no formato Feed (1080x1350) e Story (1080x1920) com barras harmônicas e co-branding (exportFinalCampaign).
 * - Persistência canônica de artes mestres limpas com isolamento (saveCleanMaster).
 */

import { getStorageService, type StorageService } from "../storage";
import {
  applyWatermark,
  applyCobrandingSignature,
  formatFeedCard,
  formatStoryCard,
  type WatermarkOptions,
  type WatermarkResult,
  type CobrandingOptions,
} from "./image-processor";

export interface ExportPreviewCardInput {
  draftId: string;
  rawImageBuffer: Buffer;
  mimeType?: string;
  watermarkText?: string;
  subText?: string;
}

export interface ExportPreviewCardResult {
  previewUrl: string;
  previewAssetKey: string;
  cleanMasterAssetKey: string;
  watermarkedBuffer: Buffer;
}

export interface ExportFinalCampaignInput {
  orderId: string;
  masterBuffer: Buffer;
  cobranding?: {
    accepted: boolean;
    creditText?: string;
  };
}

export interface ExportFinalCampaignResult {
  feedUrl: string;
  feedAssetKey: string;
  storyUrl: string;
  storyAssetKey: string;
  feedBuffer: Buffer;
  storyBuffer: Buffer;
}

export interface SaveCleanMasterInput {
  ownerId: string; // draftId ou orderId
  buffer: Buffer;
  contentType?: string;
  prefix?: "drafts" | "orders";
}

export interface SaveCleanMasterResult {
  key: string;
  url: string;
}

export interface ExportEngine {
  exportPreviewCard(
    input: ExportPreviewCardInput,
  ): Promise<ExportPreviewCardResult>;
  exportFinalCampaign(
    input: ExportFinalCampaignInput,
  ): Promise<ExportFinalCampaignResult>;
  saveCleanMaster(input: SaveCleanMasterInput): Promise<SaveCleanMasterResult>;
}

export class DefaultExportEngine implements ExportEngine {
  constructor(
    private readonly storageService: StorageService = getStorageService(),
  ) {}

  async exportPreviewCard(
    input: ExportPreviewCardInput,
  ): Promise<ExportPreviewCardResult> {
    const timestamp = Date.now();
    const watermarkResult = await applyWatermark(input.rawImageBuffer, {
      watermarkText: input.watermarkText,
      subText: input.subText,
    });

    const previewAssetKey = `drafts/${input.draftId}/preview.webp`;
    const cleanMasterAssetKey = `drafts/${input.draftId}/private-master-${timestamp}.png`;

    const [previewUpload] = await Promise.all([
      this.storageService.uploadAsset({
        key: previewAssetKey,
        buffer: watermarkResult.watermarkedBuffer,
        contentType: "image/webp",
        isPublic: true,
      }),
      this.storageService.uploadAsset({
        key: cleanMasterAssetKey,
        buffer: input.rawImageBuffer,
        contentType: input.mimeType || "image/png",
        isPublic: false,
      }),
    ]);

    return {
      previewUrl: previewUpload.url,
      previewAssetKey,
      cleanMasterAssetKey,
      watermarkedBuffer: watermarkResult.watermarkedBuffer,
    };
  }

  async exportFinalCampaign(
    input: ExportFinalCampaignInput,
  ): Promise<ExportFinalCampaignResult> {
    const timestamp = Date.now();
    let [feedBuffer, storyBuffer] = await Promise.all([
      formatFeedCard(input.masterBuffer),
      formatStoryCard(input.masterBuffer),
    ]);

    if (input.cobranding?.accepted) {
      feedBuffer = await applyCobrandingSignature(feedBuffer, {
        creditText: input.cobranding.creditText,
        aspectRatio: "feed",
      });
      storyBuffer = await applyCobrandingSignature(storyBuffer, {
        creditText: input.cobranding.creditText,
        aspectRatio: "story",
      });
    }

    const feedAssetKey = `orders/${input.orderId}/feed.png`;
    const storyAssetKey = `orders/${input.orderId}/story.png`;

    const [feedUpload, storyUpload] = await Promise.all([
      this.storageService.uploadAsset({
        key: feedAssetKey,
        buffer: feedBuffer,
        contentType: "image/png",
        isPublic: true,
      }),
      this.storageService.uploadAsset({
        key: storyAssetKey,
        buffer: storyBuffer,
        contentType: "image/png",
        isPublic: true,
      }),
    ]);

    const appendCacheBusting = (url: string) => {
      if (url.startsWith("data:")) {
        return url;
      }
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
  }

  async saveCleanMaster(
    input: SaveCleanMasterInput,
  ): Promise<SaveCleanMasterResult> {
    const timestamp = Date.now();
    const prefix = input.prefix ?? "orders";
    const key = `${prefix}/${input.ownerId}/private-master-${timestamp}.png`;

    const upload = await this.storageService.uploadAsset({
      key,
      buffer: input.buffer,
      contentType: input.contentType || "image/png",
      isPublic: false,
    });

    return {
      key,
      url: upload.url,
    };
  }
}

export interface ExportEngineDeps {
  storageService?: StorageService;
}

let activeExportEngine: ExportEngine | null = null;

export function getExportEngine(deps?: ExportEngineDeps): ExportEngine {
  if (deps?.storageService) {
    return new DefaultExportEngine(deps.storageService);
  }
  if (!activeExportEngine) {
    activeExportEngine = new DefaultExportEngine(getStorageService());
  }
  return activeExportEngine;
}

export function setExportEngineForTesting(engine: ExportEngine | null): void {
  activeExportEngine = engine;
}

export {
  applyWatermark,
  applyCobrandingSignature,
  formatFeedCard,
  formatStoryCard,
  type WatermarkOptions,
  type WatermarkResult,
  type CobrandingOptions,
};
