import { serverEnv } from "../../../../config/server-env";
import { createServerLogger } from "../../../../server/logger";

const log = createServerLogger("checkout.pushin-pay");

export interface CreatePixChargeInput {
  valueCents: number; // fixo em 990 para o MVP (R$ 9,90)
  webhookUrl?: string;
}

export interface PixChargeResult {
  txId: string;
  copiaECola: string;
  qrCodeBase64: string;
  expiresAt: Date;
  status: string;
}

export interface TransactionStatusResult {
  txId: string;
  status: "paid" | "created" | "expired" | "canceled";
  paidAt?: Date;
  valueCents: number;
}

export interface PushinPayServiceConfig {
  token?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export class PushinPayError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly rawError?: unknown,
  ) {
    super(message);
    this.name = "PushinPayError";
  }
}

/**
 * Módulo profundo para comunicação direta com a gateway Pushin Pay (Pix Cash-In).
 * Encapsula autenticação Bearer token, endpoints REST, mapeamento de respostas e erros.
 */
export class PushinPayService {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: PushinPayServiceConfig = {}) {
    this.token =
      config.token ??
      serverEnv.PUSHIN_PAY_TOKEN ??
      process.env.PUSHIN_PAY_TOKEN ??
      "";

    const rawBaseUrl =
      config.baseUrl ??
      serverEnv.PUSHIN_PAY_BASE_URL ??
      process.env.PUSHIN_PAY_BASE_URL ??
      "https://api.pushinpay.com.br";
    this.baseUrl = rawBaseUrl.replace(/\/$/, "");

    this.fetchFn = config.fetchFn ?? globalThis.fetch;
  }

  /**
   * Emite uma cobrança Pix Cash-In na Pushin Pay.
   * Retorna txId, linha EMV copia-e-cola e imagem do QR code em Base64 com expiração de 30 minutos.
   */
  async createCashInCharge(
    input: CreatePixChargeInput,
  ): Promise<PixChargeResult> {
    if (!this.token) {
      log.error("PUSHIN_PAY_TOKEN não configurado no ambiente de execução");
      throw new PushinPayError(
        "PUSHIN_PAY_TOKEN não configurado no ambiente de execução. Defina PUSHIN_PAY_TOKEN em .env.local",
      );
    }

    const webhookUrl =
      input.webhookUrl ||
      process.env.PUSHIN_PAY_WEBHOOK_URL ||
      serverEnv.PUSHIN_PAY_WEBHOOK_URL;

    const payload: { value: number; webhook_url?: string } = {
      value: input.valueCents,
    };

    if (webhookUrl) {
      payload.webhook_url = webhookUrl;
    }

    log.info("Enviando requisição de criação de cobrança Pix à Pushin Pay", {
      valueCents: input.valueCents,
      hasWebhookUrl: !!webhookUrl,
    });

    const response = await this.postCashIn(payload);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      log.error(
        "Falha na resposta HTTP da Pushin Pay ao criar cobrança Pix",
        undefined,
        {
          status: response.status,
          errorText,
        },
      );
      throw new PushinPayError(
        `Falha ao criar cobrança Pix na Pushin Pay: HTTP ${response.status} - ${errorText}`,
        response.status,
      );
    }

    interface PushinPayCashInResponse {
      id: string | number;
      qr_code: string;
      qr_code_base64: string;
      status?: string;
      value?: number;
    }

    const data = (await response.json()) as PushinPayCashInResponse;

    // A expiração do Pix dinâmico é de 30 minutos a partir da emissão
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    log.info("Cobrança Pix criada com sucesso na Pushin Pay", {
      txId: String(data.id),
      status: data.status || "created",
    });

    return {
      txId: String(data.id),
      copiaECola: data.qr_code,
      qrCodeBase64: data.qr_code_base64,
      expiresAt,
      status: data.status || "created",
    };
  }

  /**
   * Consulta o status pontual de uma transação na Pushin Pay por txId.
   * Utilizado para reconciliação ativa em caso de atraso na entrega de webhooks.
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatusResult> {
    if (!this.token) {
      log.error("PUSHIN_PAY_TOKEN não configurado no ambiente de execução");
      throw new PushinPayError(
        "PUSHIN_PAY_TOKEN não configurado no ambiente de execução. Defina PUSHIN_PAY_TOKEN em .env.local",
      );
    }

    log.info("Consultando status da transação na Pushin Pay", { txId });

    let response: Response;
    try {
      response = await this.fetchFn(
        `${this.baseUrl}/api/transactions/${txId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${this.token}`,
          },
        },
      );
    } catch (err) {
      log.error(
        "Falha na comunicação de rede com Pushin Pay ao consultar transação",
        err,
        {
          txId,
        },
      );
      throw new PushinPayError(
        `Falha na comunicação de rede com a API da Pushin Pay: ${
          err instanceof Error ? err.message : String(err)
        }`,
        undefined,
        err,
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      log.warn("Erro retornado pela Pushin Pay ao consultar transação", {
        txId,
        status: response.status,
        errorText,
      });
      throw new PushinPayError(
        `Erro ao consultar transação ${txId}: HTTP ${response.status} - ${errorText}`,
        response.status,
      );
    }

    interface PushinPayTransactionResponse {
      id: string | number;
      status: "paid" | "created" | "expired" | "canceled";
      value: number;
      paid_at?: string | null;
    }

    const data = (await response.json()) as PushinPayTransactionResponse;

    log.info("Status da transação obtido com sucesso da Pushin Pay", {
      txId: String(data.id),
      status: data.status,
    });

    return {
      txId: String(data.id),
      status: data.status,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      valueCents: Number(data.value),
    };
  }

  private async postCashIn(payload: {
    value: number;
    webhook_url?: string;
  }): Promise<Response> {
    try {
      return await this.fetchFn(`${this.baseUrl}/api/pix/cashIn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      log.error("Falha na comunicação de rede com a API da Pushin Pay", err, {
        endpoint: "/api/pix/cashIn",
      });
      throw new PushinPayError(
        `Falha na comunicação de rede com a API da Pushin Pay: ${
          err instanceof Error ? err.message : String(err)
        }`,
        undefined,
        err,
      );
    }
  }
}
