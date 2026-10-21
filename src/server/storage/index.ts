import { serverEnv } from "@/config/server-env";
import { createServerLogger } from "@/server/logger";
import { InMemoryStorageDriver } from "./memory-driver";
import { CloudflareR2StorageDriver } from "./r2-driver";

const log = createServerLogger("storage.service");

export interface AssetUploadOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

export interface AssetUploadResult {
  key: string;
  url: string;
}

export interface StorageAsset {
  buffer: Buffer;
  contentType: string;
}

export interface StorageService {
  /**
   * Faz upload de um buffer binário para o storage.
   * Retorna a chave canônica e a URL de acesso correspondente.
   */
  uploadAsset(options: AssetUploadOptions): Promise<AssetUploadResult>;

  /**
   * Recupera os bytes e o tipo MIME de um asset armazenado através de sua chave.
   * Retorna null caso o arquivo não seja encontrado.
   */
  getAsset(key: string): Promise<StorageAsset | null>;

  /**
   * Remove permanentemente um asset do storage.
   */
  deleteAsset(key: string): Promise<void>;

  /**
   * Resolve a URL pública de um asset a partir de sua chave.
   */
  getPublicUrl(key: string): string;

  /**
   * Método opcional para limpeza e isolamento em testes unitários.
   */
  clear?(): void;
}

let activeStorageService: StorageService | null = null;

/**
 * Retorna a instância singleton do serviço de armazenamento configurado.
 * Seleciona CloudflareR2StorageDriver se STORAGE_DRIVER=r2 e credenciais presentes;
 * caso contrário, utiliza InMemoryStorageDriver com segurança para desenvolvimento e testes.
 */
export function getStorageService(): StorageService {
  if (activeStorageService) {
    return activeStorageService;
  }

  if (
    serverEnv.STORAGE_DRIVER === "r2" &&
    serverEnv.R2_ACCOUNT_ID &&
    serverEnv.R2_ACCESS_KEY_ID &&
    serverEnv.R2_SECRET_ACCESS_KEY &&
    serverEnv.R2_BUCKET_NAME &&
    serverEnv.R2_PUBLIC_URL
  ) {
    log.info("Inicializando CloudflareR2StorageDriver", {
      bucket: serverEnv.R2_BUCKET_NAME,
      accountId: serverEnv.R2_ACCOUNT_ID,
    });
    activeStorageService = new CloudflareR2StorageDriver({
      accountId: serverEnv.R2_ACCOUNT_ID,
      accessKeyId: serverEnv.R2_ACCESS_KEY_ID,
      secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY,
      bucketName: serverEnv.R2_BUCKET_NAME,
      publicUrl: serverEnv.R2_PUBLIC_URL,
    });
    return activeStorageService;
  }

  log.info("Inicializando InMemoryStorageDriver (memória local/testes)");
  activeStorageService = new InMemoryStorageDriver({
    publicUrlBase: serverEnv.R2_PUBLIC_URL,
  });
  return activeStorageService;
}

/**
 * Hook de injeção de dependência exclusivo para testes unitários e de integração.
 */
export function setStorageServiceForTesting(
  service: StorageService | null,
): void {
  activeStorageService = service;
}

export { InMemoryStorageDriver, CloudflareR2StorageDriver };
