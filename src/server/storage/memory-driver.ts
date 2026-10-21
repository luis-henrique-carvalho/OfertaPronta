import type {
  AssetUploadOptions,
  AssetUploadResult,
  StorageAsset,
  StorageService,
} from "./index";

export interface StoredMemoryAsset {
  buffer: Buffer;
  contentType: string;
  isPublic: boolean;
  metadata?: Record<string, string>;
}

/**
 * Driver de armazenamento volátil em memória para testes unitários e desenvolvimento offline.
 * Elimina custos de I/O de rede e permite execução da suíte em milissegundos.
 */
export class InMemoryStorageDriver implements StorageService {
  private readonly assets = new Map<string, StoredMemoryAsset>();
  private readonly publicUrlBase: string;

  constructor(options?: { publicUrlBase?: string }) {
    this.publicUrlBase = options?.publicUrlBase
      ? options.publicUrlBase.replace(/\/$/, "")
      : "https://storage.local.fake";
  }

  async uploadAsset(options: AssetUploadOptions): Promise<AssetUploadResult> {
    this.assets.set(options.key, {
      buffer: Buffer.from(options.buffer),
      contentType: options.contentType,
      isPublic: Boolean(options.isPublic),
      metadata: options.metadata,
    });

    return {
      key: options.key,
      url: this.getPublicUrl(options.key),
    };
  }

  async getAsset(key: string): Promise<StorageAsset | null> {
    const asset = this.assets.get(key);
    if (!asset) {
      return null;
    }
    return {
      buffer: Buffer.from(asset.buffer),
      contentType: asset.contentType,
    };
  }

  async deleteAsset(key: string): Promise<void> {
    this.assets.delete(key);
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\//, "");
    return `${this.publicUrlBase}/${cleanKey}`;
  }

  clear(): void {
    this.assets.clear();
  }
}
