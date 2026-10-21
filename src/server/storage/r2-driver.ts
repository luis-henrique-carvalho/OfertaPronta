import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import type {
  AssetUploadOptions,
  AssetUploadResult,
  StorageAsset,
  StorageService,
} from "./index";

export interface CloudflareR2Options {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

/**
 * Driver de armazenamento de alta performance conectado ao Cloudflare R2 via API S3 compatível.
 * Garante zero egress fees e distribuição global via CDN.
 */
export class CloudflareR2StorageDriver implements StorageService {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl?: string;
  private readonly accountId: string;

  constructor(options: CloudflareR2Options) {
    this.accountId = options.accountId;
    this.bucketName = options.bucketName;
    this.publicUrl = options.publicUrl?.replace(/\/$/, "");

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${options.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async uploadAsset(options: AssetUploadOptions): Promise<AssetUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: options.key,
      Body: options.buffer,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    await this.client.send(command);

    return {
      key: options.key,
      url: this.getPublicUrl(options.key),
    };
  }

  async getAsset(key: string): Promise<StorageAsset | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      if (!response.Body) {
        return null;
      }

      const buffer = await this.bodyToBuffer(response.Body);
      return {
        buffer,
        contentType: response.ContentType || "application/octet-stream",
      };
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        (("name" in err &&
          (err.name === "NoSuchKey" || err.name === "NotFound")) ||
          ("$metadata" in err &&
            typeof (err as { $metadata?: { httpStatusCode?: number } })
              .$metadata?.httpStatusCode === "number" &&
            (err as { $metadata?: { httpStatusCode?: number } }).$metadata
              ?.httpStatusCode === 404))
      ) {
        return null;
      }
      throw err;
    }
  }

  async deleteAsset(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.client.send(command);
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\//, "");
    if (this.publicUrl) {
      return `${this.publicUrl}/${cleanKey}`;
    }
    return `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${cleanKey}`;
  }

  private async bodyToBuffer(body: unknown): Promise<Buffer> {
    if (Buffer.isBuffer(body)) {
      return body;
    }
    if (body instanceof Uint8Array) {
      return Buffer.from(body);
    }
    if (
      body &&
      typeof body === "object" &&
      "transformToByteArray" in body &&
      typeof (body as { transformToByteArray: () => Promise<Uint8Array> })
        .transformToByteArray === "function"
    ) {
      const bytes = await (
        body as { transformToByteArray: () => Promise<Uint8Array> }
      ).transformToByteArray();
      return Buffer.from(bytes);
    }
    if (
      body &&
      typeof body === "object" &&
      Symbol.asyncIterator in (body as object)
    ) {
      const chunks: Buffer[] = [];
      for await (const chunk of body as AsyncIterable<Uint8Array | Buffer>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }
    if (
      body &&
      typeof body === "object" &&
      "pipe" in body &&
      typeof (body as Readable).pipe === "function"
    ) {
      const readable = body as Readable;
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        readable.on("data", (chunk: Uint8Array | Buffer) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        readable.on("end", () => resolve(Buffer.concat(chunks)));
        readable.on("error", reject);
      });
    }
    throw new Error("Formato de corpo não suportado retornado do S3/R2");
  }
}
