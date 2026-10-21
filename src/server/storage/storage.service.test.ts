import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InMemoryStorageDriver } from "./memory-driver";
import { CloudflareR2StorageDriver } from "./r2-driver";
import { getStorageService, setStorageServiceForTesting } from "./index";

describe("StorageService Deep Module (TDD)", () => {
  beforeEach(() => {
    setStorageServiceForTesting(null);
  });

  afterEach(() => {
    setStorageServiceForTesting(null);
  });

  describe("InMemoryStorageDriver", () => {
    let driver: InMemoryStorageDriver;

    beforeEach(() => {
      driver = new InMemoryStorageDriver({
        publicUrlBase: "https://pub-test.r2.dev",
      });
    });

    it("should upload asset and return canonical key and public url", async () => {
      const buffer = Buffer.from("test-png-content");
      const result = await driver.uploadAsset({
        key: "previews/draft-123/preview.png",
        buffer,
        contentType: "image/png",
        isPublic: true,
      });

      expect(result.key).toBe("previews/draft-123/preview.png");
      expect(result.url).toBe(
        "https://pub-test.r2.dev/previews/draft-123/preview.png",
      );
    });

    it("should retrieve stored asset with matching buffer and contentType", async () => {
      const originalBuffer = Buffer.from("clean-master-bytes");
      await driver.uploadAsset({
        key: "masters/draft-123/master.png",
        buffer: originalBuffer,
        contentType: "image/png",
        isPublic: false,
      });

      const retrieved = await driver.getAsset("masters/draft-123/master.png");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.contentType).toBe("image/png");
      expect(retrieved?.buffer.equals(originalBuffer)).toBe(true);
    });

    it("should return null when asset does not exist", async () => {
      const result = await driver.getAsset("non-existent-key.png");
      expect(result).toBeNull();
    });

    it("should delete stored asset", async () => {
      await driver.uploadAsset({
        key: "temp/file.png",
        buffer: Buffer.from("to-be-deleted"),
        contentType: "image/png",
      });

      expect(await driver.getAsset("temp/file.png")).not.toBeNull();
      await driver.deleteAsset("temp/file.png");
      expect(await driver.getAsset("temp/file.png")).toBeNull();
    });

    it("should clear all assets via clear()", async () => {
      await driver.uploadAsset({
        key: "file1.png",
        buffer: Buffer.from("1"),
        contentType: "image/png",
      });
      await driver.uploadAsset({
        key: "file2.png",
        buffer: Buffer.from("2"),
        contentType: "image/png",
      });

      driver.clear();
      expect(await driver.getAsset("file1.png")).toBeNull();
      expect(await driver.getAsset("file2.png")).toBeNull();
    });

    it("should return valid Data URL immediately renderable in <img /> when publicUrlBase is omitted", async () => {
      const defaultDriver = new InMemoryStorageDriver();
      const buffer = Buffer.from("test-png-pixels");

      const uploadResult = await defaultDriver.uploadAsset({
        key: "test/card.png",
        buffer,
        contentType: "image/png",
      });

      expect(uploadResult.url).toMatch(/^data:image\/png;base64,/);
      expect(uploadResult.url).toBe(
        defaultDriver.getPublicUrl("test/card.png"),
      );
      expect(uploadResult.url).not.toContain("storage.local.fake");
    });

    it("should return neutral Data URL when key does not exist and publicUrlBase is omitted", () => {
      const defaultDriver = new InMemoryStorageDriver();
      const url = defaultDriver.getPublicUrl("unknown/asset.png");

      expect(url).toMatch(/^data:application\/octet-stream;base64,/);
      expect(url).not.toContain("storage.local.fake");
    });

    it("should format public URL with custom publicUrlBase without double slashes", () => {
      const cdnDriver = new InMemoryStorageDriver({
        publicUrlBase: "https://cdn.teste.local/",
      });
      expect(cdnDriver.getPublicUrl("/drafts/draft-123/product.png")).toBe(
        "https://cdn.teste.local/drafts/draft-123/product.png",
      );
    });
  });

  describe("CloudflareR2StorageDriver Fail-Fast and URL Resolution", () => {
    it("should throw descriptive error when publicUrl is omitted or empty", () => {
      expect(() => {
        new CloudflareR2StorageDriver({
          accountId: "acc-123",
          accessKeyId: "key-123",
          secretAccessKey: "secret-123",
          bucketName: "my-bucket",
        });
      }).toThrow(/requer publicUrl \(R2_PUBLIC_URL\)/);

      expect(() => {
        new CloudflareR2StorageDriver({
          accountId: "acc-123",
          accessKeyId: "key-123",
          secretAccessKey: "secret-123",
          bucketName: "my-bucket",
          publicUrl: "   ",
        });
      }).toThrow(/requer publicUrl \(R2_PUBLIC_URL\)/);
    });

    it("should format public CDN URL without double slashes", () => {
      const r2Driver = new CloudflareR2StorageDriver({
        accountId: "acc-123",
        accessKeyId: "key-123",
        secretAccessKey: "secret-123",
        bucketName: "my-bucket",
        publicUrl: "https://assets.ofertapronta.com.br/",
      });

      expect(r2Driver.getPublicUrl("/orders/order-1/feed.png")).toBe(
        "https://assets.ofertapronta.com.br/orders/order-1/feed.png",
      );
    });
  });

  describe("getStorageService factory & test overrides", () => {
    it("should return a singleton storage service instance", () => {
      const instance1 = getStorageService();
      const instance2 = getStorageService();
      expect(instance1).toBe(instance2);
    });

    it("should allow overriding the storage service for testing via setStorageServiceForTesting", async () => {
      const mockDriver = new InMemoryStorageDriver({
        publicUrlBase: "https://mock.test",
      });
      setStorageServiceForTesting(mockDriver);

      const active = getStorageService();
      expect(active).toBe(mockDriver);

      const res = await active.uploadAsset({
        key: "test.png",
        buffer: Buffer.from("a"),
        contentType: "image/png",
      });
      expect(res.url).toBe("https://mock.test/test.png");
    });
  });
});
