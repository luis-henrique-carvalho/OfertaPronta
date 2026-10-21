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
  private readonly publicUrlBase?: string;

  constructor(options?: { publicUrlBase?: string }) {
    this.publicUrlBase = options?.publicUrlBase?.trim()
      ? options.publicUrlBase.trim().replace(/\/+$/, "")
      : undefined;
  }

  async uploadAsset(options: AssetUploadOptions): Promise<AssetUploadResult> {
    const cleanKey = options.key.replace(/^\/+/, "");
    this.assets.set(cleanKey, {
      buffer: Buffer.from(options.buffer),
      contentType: options.contentType,
      isPublic: Boolean(options.isPublic),
      metadata: options.metadata,
    });

    return {
      key: cleanKey,
      url: this.getPublicUrl(cleanKey),
    };
  }

  async getAsset(key: string): Promise<StorageAsset | null> {
    const cleanKey = key.replace(/^\/+/, "");
    const asset = this.assets.get(cleanKey) ?? this.assets.get(key);
    if (!asset) {
      return null;
    }
    return {
      buffer: Buffer.from(asset.buffer),
      contentType: asset.contentType,
    };
  }

  async deleteAsset(key: string): Promise<void> {
    const cleanKey = key.replace(/^\/+/, "");
    this.assets.delete(cleanKey);
    this.assets.delete(key);
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, "");
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/${cleanKey}`;
    }

    const asset = this.assets.get(cleanKey) ?? this.assets.get(key);
    if (asset) {
      return `data:${asset.contentType};base64,${asset.buffer.toString("base64")}`;
    }

    return "data:application/octet-stream;base64,";
  }

  clear(): void {
    this.assets.clear();
  }
}
