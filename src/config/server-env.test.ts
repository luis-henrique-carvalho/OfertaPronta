import { describe, it, expect } from "vitest";
import { parseServerEnv, serverEnvSchema } from "./server-env";

describe("serverEnv", () => {
  it("should parse valid environment variables with defaults", () => {
    const env = parseServerEnv({});

    expect(env.DATABASE_URL).toBe(
      "postgresql://postgres:postgres@localhost:5432/ofertapronta",
    );
    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3000);
    expect(env.GEMINI_PROMPT_MODEL).toBe("gemini-3.8-flash");
    expect(env.GEMINI_IMAGE_MODEL).toBe("gemini-nano-banana-2.1");
    expect(env.GEMINI_DYNAMIC_PLANNER_ENABLED).toBe(true);
  });

  it("should parse Gemini model configurations and overrides", () => {
    const custom = {
      GEMINI_PROMPT_MODEL: "gemini-3.8-pro",
      GEMINI_IMAGE_MODEL: "gemini-3-pro-image",
    };

    const env = parseServerEnv(custom);
    expect(env.GEMINI_PROMPT_MODEL).toBe("gemini-3.8-pro");
    expect(env.GEMINI_IMAGE_MODEL).toBe("gemini-3-pro-image");

    expect(() => parseServerEnv({ GEMINI_PROMPT_MODEL: "" })).toThrow();
    expect(() => parseServerEnv({ GEMINI_IMAGE_MODEL: "" })).toThrow();
  });

  it("should override defaults with custom values", () => {
    const custom = {
      DATABASE_URL:
        "postgresql://app_user:secret@db.production:5432/oferta_prod",
      NODE_ENV: "production",
      PORT: "8080",
      FREE_PREVIEW_SECRET: "production-secret-with-at-least-32-chars-ok",
    };

    const env = parseServerEnv(custom);

    expect(env.DATABASE_URL).toBe(
      "postgresql://app_user:secret@db.production:5432/oferta_prod",
    );
    expect(env.NODE_ENV).toBe("production");
    expect(env.PORT).toBe(8080);
    expect(env.FREE_PREVIEW_SECRET).toBe(
      "production-secret-with-at-least-32-chars-ok",
    );
  });

  it("should parse Free Preview variables with defaults in development/test", () => {
    const env = parseServerEnv({});
    expect(env.FREE_PREVIEW_SECRET).toBe(
      "dev-secret-free-preview-must-be-32-chars-minimum!",
    );
    expect(env.FREE_PREVIEW_SECRET_PREVIOUS).toBeUndefined();
    expect(env.FREE_PREVIEW_DAILY_BUDGET).toBe(300);
    expect(env.TRUSTED_PROXY).toBe(false);

    const custom = parseServerEnv({
      FREE_PREVIEW_SECRET: "custom-secret-with-at-least-32-characters!",
      FREE_PREVIEW_SECRET_PREVIOUS: "previous-secret-with-32-characters-here!",
      FREE_PREVIEW_DAILY_BUDGET: "500",
      TRUSTED_PROXY: "true",
    });

    expect(custom.FREE_PREVIEW_SECRET).toBe(
      "custom-secret-with-at-least-32-characters!",
    );
    expect(custom.FREE_PREVIEW_SECRET_PREVIOUS).toBe(
      "previous-secret-with-32-characters-here!",
    );
    expect(custom.FREE_PREVIEW_DAILY_BUDGET).toBe(500);
    expect(custom.TRUSTED_PROXY).toBe(true);
  });

  it("should enforce FREE_PREVIEW_SECRET in production", () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: "production",
      }),
    ).toThrow();
  });

  it("should reject invalid NODE_ENV", () => {
    const invalid = {
      NODE_ENV: "staging",
    };

    expect(() => parseServerEnv(invalid)).toThrow();
  });

  it("should reject invalid PORT", () => {
    const invalid = {
      PORT: "not-a-number",
    };

    expect(() => parseServerEnv(invalid)).toThrow();
  });

  it("should parse Pushin Pay environment variables with defaults", () => {
    const env = parseServerEnv({});
    expect(env.PUSHIN_PAY_BASE_URL).toBe("https://api.pushinpay.com.br");
    expect(env.PUSHIN_PAY_TOKEN).toBeUndefined();
    expect(env.PUSHIN_PAY_WEBHOOK_URL).toBeUndefined();
    expect(env.PUSHIN_PAY_WEBHOOK_SECRET).toBeUndefined();

    const customEnv = parseServerEnv({
      PUSHIN_PAY_TOKEN: "mock_token_123",
      PUSHIN_PAY_BASE_URL: "https://sandbox.pushinpay.com.br",
      PUSHIN_PAY_WEBHOOK_URL: "https://example.com/api/webhooks/pix",
      PUSHIN_PAY_WEBHOOK_SECRET: "my_secret_token",
    });

    expect(customEnv.PUSHIN_PAY_TOKEN).toBe("mock_token_123");
    expect(customEnv.PUSHIN_PAY_BASE_URL).toBe(
      "https://sandbox.pushinpay.com.br",
    );
    expect(customEnv.PUSHIN_PAY_WEBHOOK_URL).toBe(
      "https://example.com/api/webhooks/pix",
    );
    expect(customEnv.PUSHIN_PAY_WEBHOOK_SECRET).toBe("my_secret_token");
  });

  it("should parse and validate CAMPAIGN_SINGLE_PRICE_CENTS", () => {
    const envDefault = parseServerEnv({});
    expect(envDefault.CAMPAIGN_SINGLE_PRICE_CENTS).toBeUndefined();

    const envWithNumber = parseServerEnv({
      CAMPAIGN_SINGLE_PRICE_CENTS: 1490,
    });
    expect(envWithNumber.CAMPAIGN_SINGLE_PRICE_CENTS).toBe(1490);

    const envWithString = parseServerEnv({
      CAMPAIGN_SINGLE_PRICE_CENTS: "1990",
    });
    expect(envWithString.CAMPAIGN_SINGLE_PRICE_CENTS).toBe(1990);

    expect(() =>
      parseServerEnv({
        CAMPAIGN_SINGLE_PRICE_CENTS: -100,
      }),
    ).toThrow();

    expect(() =>
      parseServerEnv({
        CAMPAIGN_SINGLE_PRICE_CENTS: "invalid",
      }),
    ).toThrow();
  });

  it("should export schema for runtime validation", () => {
    expect(serverEnvSchema).toBeDefined();
  });
});
