# Plano Técnico: Checkout Pix Dinâmico via Pushin Pay (`PixCheckout`)

- **Slug**: `epico-3-checkout-pix`
- **Spec de Produto**: [`docs/specs/epico-3-checkout-pix.md`](../specs/epico-3-checkout-pix.md)
- **Tickets de Execução**: [`docs/tickets/epico-3-checkout-pix/`](../tickets/epico-3-checkout-pix/)
  - `01-db-schema-and-pushin-pay-service.md`
  - `02-pix-checkout-service-and-state-machine.md`
  - `03-server-functions-and-order-polling-hook.md`
  - `04-checkout-ui-components-and-mobile-experience.md`
- **Status**: `ready-for-review`

---

## 1. Visão Geral e Invariantes de Engenharia

O **Épico 3** implementa a camada de conversão e pagamento do OfertaPronta, transformando o rascunho com prévia aprovada (`Draft`) em um pedido pago (`Order`) com cobrança Pix dinâmica de **R$ 9,90** gerada via **Pushin Pay**, detecção em tempo real e transição automática para a tela de entrega do produto em alta resolução (Épico 4).

### Invariantes Arquiteturais e Pilares de Segurança

1. **Preços Autoritativos no Backend (Zero Client Pricing)**:
   - O frontend **NUNCA** envia nem determina o valor a ser pago.
   - O backend define o valor fixo de **R$ 9,90 (990 centavos)** na criação do registro `orders` e da cobrança `payment_charges`.
   - Webhooks ou transações com valor divergente de 990 centavos são terminantemente rejeitados com erro de violação de segurança.

2. **Snapshot Congelado Imutável (`Frozen Snapshot`)**:
   - No momento exato da criação do pedido (`initiateCheckout`), o backend extrai todo o estado do briefing aprovado (`businessSegment`, `offerTitle`, `promoPrice`, `originalPrice`, `callToAction`, `whatsapp`, `productImageDataUrl`, `referenceImageDataUrl`, `stylePresetId`, `previewCardImageUrl`, `targetAspectRatio`) e o grava como um objeto JSON imutável em `orders.frozenSnapshot`.
   - Modificações posteriores no rascunho de origem não afetam o pedido pago nem a futura entrega em alta resolução do Épico 4.

3. **Módulos Profundos e Isolamento Estrito Client/Server (`codebase-design`)**:
   - `PushinPayService` (`src/features/checkout/server/services/pushin-pay.service.ts`): módulo profundo que encapsula a comunicação HTTP com a API da Pushin Pay, autenticação Bearer token, timeout, parsing de respostas e mapeamento de erros em exceções de domínio. Possui costura para injeção de `fetchFn` para testes determinísticos sem rede (_replace-don't-layer_).
   - `PixCheckoutService` (`src/features/checkout/server/services/pix-checkout.service.ts`): módulo profundo que orquestra a máquina de estados transacional, persistência com Drizzle ORM, congelamento do snapshot, emissão/reemissão de cobranças, reconciliação ativa e idempotência estrita de webhooks.
   - Zero Server Leaks: `src/features/checkout/server/index.ts` expõe **exclusivamente** Server Functions (`createServerFn`), schemas Zod e DTOs tipados. Código de banco de dados ou chamadas externas nunca vazam para o bundle do browser.

4. **Idempotência Estrita & Resiliência Criptográfica**:
   - O webhook recebido em `src/routes/api.webhooks.pix.ts` (ou `src/routes/api/webhooks/pix.ts`) localiza a cobrança pelo `txId`.
   - Se o status da cobrança já estiver `PAID`, a operação retorna imediatamente `HTTP 200 { processed: true }` de forma idempotente, sem disparar mutações redundantes no banco nem efeitos colaterais.
   - Reconciliação ativa: se a conexão móvel do cliente oscilar ou o webhook sofrer atraso, a checagem por polling (`checkPaymentStatusFn`) verifica o status local e, caso continue `PENDING`, consulta ativamente a API da Pushin Pay para confirmar a liquidação.

5. **Experiência Mobile-First de Conversão em 1 Toque (KISS / Ponytail)**:
   - Sem formulário cadastral, sem senhas e **sem obrigatoriedade de CPF**.
   - Geração imediata do código Pix Copia e Cola (com cópia em 1 toque no celular) e QR Code visual nítido.
   - Contagem regressiva de expiração (30 minutos) e botão de reemissão caso expire.
   - Campo opcional não intrusivo para resgate do link via WhatsApp caso o usuário feche a aba acidentalmente.

---

## 2. Diagramas Estruturais Mermaid

### 2.1. Topologia de Módulos e Isolamento de Camadas (`flowchart TD`)

```mermaid
flowchart TD
    subgraph Client_Layer["Camada de Apresentação (Browser / React 19)"]
        UI_Wizard["OfferBriefWizard (/criar)"]
        UI_Checkout["CheckoutView (/checkout/$orderId)"]
        UI_CopiaCola["PixCopiaColaCard (1 Toque)"]
        UI_QRCode["PixQRCodeCard (Base64)"]
        UI_Indicator["PaymentPollingIndicator (3s Polling)"]
        UI_Hook["useOrderPolling Hook"]

        UI_Checkout --> UI_CopiaCola
        UI_Checkout --> UI_QRCode
        UI_Checkout --> UI_Indicator
        UI_Checkout --> UI_Hook
    end

    UI_Wizard -->|"RPC: initiateCheckoutFn({ draftId })"| RPC_Initiate
    UI_Hook -->|"RPC Polling: checkPaymentStatusFn({ orderId })"| RPC_Poll
    UI_Checkout -->|"RPC: getOrderCheckoutDetailsFn({ orderId })"| RPC_Details

    subgraph Server_Boundary["Fronteira RPC TanStack Start (Server-Only)"]
        RPC_Initiate["initiateCheckoutFn"]
        RPC_Details["getOrderCheckoutDetailsFn"]
        RPC_Poll["checkPaymentStatusFn"]
        RPC_Whatsapp["updateOrderWhatsappFn"]
        RPC_Regenerate["regenerateExpiredChargeFn"]
    end

    subgraph HTTP_Boundary["Fronteira HTTP Externa"]
        Route_Webhook["createFileRoute('/api/webhooks/pix')\n(POST Handler)"]
    end

    RPC_Initiate -->|"Dynamic Import"| PixCheckoutSvc["PixCheckoutService\n(pix-checkout.service.ts)"]
    RPC_Details -->|"Dynamic Import"| PixCheckoutSvc
    RPC_Poll -->|"Dynamic Import"| PixCheckoutSvc
    RPC_Whatsapp -->|"Dynamic Import"| PixCheckoutSvc
    RPC_Regenerate -->|"Dynamic Import"| PixCheckoutSvc
    Route_Webhook -->|"Delega Payload"| PixCheckoutSvc

    subgraph Deep_Modules["Módulos Profundos de Backend"]
        PixCheckoutSvc -->|"Emite Cobrança / Consulta Status"| PushinPaySvc["PushinPayService\n(pushin-pay.service.ts)"]
        PixCheckoutSvc -->|"Transações Atômicas Drizzle"| DB_Postgres[("PostgreSQL\norders & payment_charges")]
    end

    subgraph External_Gateways["Infraestrutura Externa"]
        PushinPaySvc -->|"HTTP REST API (Bearer Token)"| PushinPay_API["Pushin Pay Gateway\n(https://api.pushinpay.com.br)"]
        PushinPay_API -->|"Webhook POST"| Route_Webhook
    end

    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef server fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef deep fill:#dcfce7,stroke:#16a34a,stroke-width:2px;
    classDef ext fill:#f3e8ff,stroke:#9333ea,stroke-width:2px;

    class UI_Wizard,UI_Checkout,UI_CopiaCola,UI_QRCode,UI_Indicator,UI_Hook client;
    class RPC_Initiate,RPC_Details,RPC_Poll,RPC_Whatsapp,RPC_Regenerate,Route_Webhook server;
    class PixCheckoutSvc,PushinPaySvc,DB_Postgres deep;
    class PushinPay_API ext;
```

---

### 2.2. Diagrama de Sequência de Ponta a Ponta (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    actor User as Microempresário (Mobile)
    participant Wizard as OfferBriefWizard (Etapa 3)
    participant RPC as checkout.functions (Server Fn)
    participant CheckoutSvc as PixCheckoutService
    participant PushinSvc as PushinPayService
    participant DB as PostgreSQL (orders / payment_charges)
    participant PushinGateway as Pushin Pay API
    participant WebhookRoute as /api/webhooks/pix
    participant CheckoutView as CheckoutView (/checkout/$orderId)
    participant Polling as useOrderPolling (TanStack Query)

    User->>Wizard: Clica "Liberar em HD sem marca d'água (R$ 9,90)"
    Wizard->>RPC: initiateCheckoutFn({ draftId })
    activate RPC
    RPC->>CheckoutSvc: initiateCheckout({ draftId })
    activate CheckoutSvc
    CheckoutSvc->>DB: getDraft(draftId)
    DB-->>CheckoutSvc: draft (com previewCardImageUrl)
    CheckoutSvc->>CheckoutSvc: Cria Frozen Snapshot imutável
    CheckoutSvc->>PushinSvc: createCashInCharge({ valueCents: 990 })
    activate PushinSvc
    PushinSvc->>PushinGateway: POST /api/pix/cashIn
    PushinGateway-->>PushinSvc: { id: "tx_123", qr_code, qr_code_base64, status: "created" }
    deactivate PushinSvc
    CheckoutSvc->>DB: db.transaction(insere Order PENDING e PaymentCharge)
    DB-->>CheckoutSvc: orderId = "ord_abc"
    CheckoutSvc-->>RPC: { orderId: "ord_abc" }
    deactivate CheckoutSvc
    RPC-->>Wizard: { orderId: "ord_abc" }
    deactivate RPC

    Wizard->>CheckoutView: Navega para /checkout/ord_abc
    CheckoutView->>Polling: Inicia polling a cada 3000ms
    CheckoutView-->>User: Exibe Valor R$ 9,90 + Copia e Cola + QR Code

    User->>CheckoutView: Toca em "Copiar Código Pix"
    CheckoutView-->>User: Feedback tátil/visual "Código Pix Copiado!"
    User->>User: Abre App do Banco e Conclui o Pix de R$ 9,90

    par Fluxo A: Webhook Pushin Pay (Via Principal)
        PushinGateway->>WebhookRoute: POST /api/webhooks/pix { id: "tx_123", status: "paid", value: 990 }
        activate WebhookRoute
        WebhookRoute->>CheckoutSvc: handleWebhookPayment(payload)
        activate CheckoutSvc
        CheckoutSvc->>DB: Verifica status atual da cobrança
        alt Cobrança já está PAID (Idempotência)
            CheckoutSvc-->>WebhookRoute: { processed: true, alreadyPaid: true }
        else Cobrança PENDING
            CheckoutSvc->>CheckoutSvc: Valida value === 990 centavos
            CheckoutSvc->>DB: db.transaction(Order=PAID, PaymentCharge=PAID, paidAt=now())
            CheckoutSvc-->>WebhookRoute: { processed: true, orderId: "ord_abc" }
        end
        deactivate CheckoutSvc
        WebhookRoute-->>PushinGateway: HTTP 200 { success: true }
        deactivate WebhookRoute
    and Fluxo B: Polling & Reconciliação Ativa (Fallback de Conexão Móvel)
        loop A cada 3000ms até status == PAID
            Polling->>RPC: checkPaymentStatusFn({ orderId: "ord_abc" })
            activate RPC
            RPC->>CheckoutSvc: checkPaymentStatus("ord_abc")
            activate CheckoutSvc
            CheckoutSvc->>DB: Consulta status do pedido
            alt Status no Banco é PENDING
                CheckoutSvc->>PushinSvc: getTransactionStatus("tx_123")
                PushinSvc->>PushinGateway: GET /api/transactions/tx_123
                PushinGateway-->>PushinSvc: { status: "paid", valueCents: 990 }
                opt Se gateway já marcou como paid mas webhook atrasou
                    CheckoutSvc->>DB: Reconciliação atômica para PAID
                end
            end
            CheckoutSvc-->>RPC: { status: "PAID", isPaid: true }
            deactivate CheckoutSvc
            RPC-->>Polling: { status: "PAID", isPaid: true }
            deactivate RPC
        end
    end

    Polling->>CheckoutView: onPaymentConfirmed()
    CheckoutView-->>User: Animação de sucesso ("Pagamento Confirmado!")
    CheckoutView->>User: Redireciona automaticamente para /pedido/ord_abc
```

---

### 2.3. Máquina de Estados de Pedidos e Cobranças (`stateDiagram-v2`)

```mermaid
stateDiagram-v2
    [*] --> PENDING: initiateCheckout(draftId)
    note right of PENDING
        Order criado (R$ 9,90 fixo)
        PaymentCharge gerada na Pushin Pay
        Frozen Snapshot imutável gravado
    end note

    PENDING --> PAID: Webhook recebido (status='paid' & value=990)
    PENDING --> PAID: Reconciliação ativa via Polling (Pushin Pay API confirmou)
    note right of PAID
        paidAt gravado
        Transição atômica no PostgreSQL
        Polling interrompido imediatamente
        Redireciona para /pedido/$orderId
    end note

    PENDING --> EXPIRED: Tempo > 30 minutos sem pagamento
    note right of EXPIRED
        PaymentCharge expirada
        Tela exibe aviso amigável
        Habilita botão 'Gerar Novo Código Pix'
    end note

    EXPIRED --> PENDING: regenerateExpiredCharge(orderId)
    note right of PENDING
        Nova cobrança gerada na Pushin Pay
        Mesmo orderId e frozenSnapshot preservados
        Cronômetro reiniciado em 30 min
    end note

    PENDING --> CANCELLED: Cancelamento manual ou descarte
    PAID --> [*]
    CANCELLED --> [*]
```

---

## 3. Modelo de Dados e Atualizações de Schema (Drizzle ORM)

### 3.1. Alterações em `src/server/db/schema/orders.ts`

Vincular o rascunho de origem (`draftId`) ao pedido e adicionar o contador para o controle de cotas pós-pagamento do Épico 4 (`aiRegenerationCount`):

```typescript
// src/server/db/schema/orders.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { campaigns, drafts } from "./promotions";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: text("campaign_id").references(() => campaigns.id),
  // [NOVO] Vínculo direto com o rascunho de criação
  draftId: text("draft_id").references(() => drafts.id),
  status: text("status").notNull().default("PENDING"), // PENDING, PAID, EXPIRED, CANCELLED
  amountCents: integer("amount_cents").notNull().default(990), // Autoritativo: 990 centavos (R$ 9,90)
  frozenSnapshot: jsonb("frozen_snapshot").notNull(),
  customerEmail: text("customer_email"),
  customerWhatsapp: text("customer_whatsapp"),
  // [NOVO] Cota de regenerações pós-compra (inicia em 0, teto de 3 no Épico 4)
  aiRegenerationCount: integer("ai_regeneration_count").notNull().default(0),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const paymentCharges = pgTable("payment_charges", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  txId: text("tx_id").notNull().unique(), // ID da transação no Pushin Pay
  status: text("status").notNull().default("PENDING"), // PENDING, PAID, EXPIRED
  qrCodeImageUrl: text("qr_code_image_url"), // Base64 data:image/png;base64,... ou URL
  copiaECola: text("copia_e_cola").notNull(), // Linha digitável EMV
  amountCents: integer("amount_cents").notNull().default(990),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PaymentCharge = typeof paymentCharges.$inferSelect;
export type NewPaymentCharge = typeof paymentCharges.$inferInsert;
```

### 3.2. Configuração de Variáveis de Ambiente (`src/config/server-env.ts`)

Adicionar ao schema Zod de backend os parâmetros de configuração do gateway Pushin Pay:

```typescript
export const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/ofertapronta"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  GEMINI_API_KEY: z.string().optional(),
  // [NOVAS VARIÁVEIS PUSHIN PAY]
  PUSHIN_PAY_TOKEN: z.string().optional(), // Bearer token da API Pushin Pay
  PUSHIN_PAY_BASE_URL: z.string().url().default("https://api.pushinpay.com.br"),
  PUSHIN_PAY_WEBHOOK_URL: z.string().url().optional(),
  PUSHIN_PAY_WEBHOOK_SECRET: z.string().optional(),
});
```

---

## 4. Design dos Módulos Profundos de Backend (`src/features/checkout/server/services/`)

### 4.1. `PushinPayService` (`pushin-pay.service.ts`)

Módulo profundo que encapsula o cliente HTTP com a Pushin Pay. Suporta injeção de dependência via parâmetro de construtor/fábrica para função `fetchFn` customizada (_replace-don't-layer_), permitindo testes de unidade 100% isolados da internet.

```typescript
// src/features/checkout/server/services/pushin-pay.service.ts

export interface CreatePixChargeInput {
  valueCents: number; // fixo em 990
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

export class PushinPayService {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: PushinPayServiceConfig = {}) {
    this.token = config.token || process.env.PUSHIN_PAY_TOKEN || "";
    this.baseUrl = (
      config.baseUrl ||
      process.env.PUSHIN_PAY_BASE_URL ||
      "https://api.pushinpay.com.br"
    ).replace(/\/$/, "");
    this.fetchFn = config.fetchFn || globalThis.fetch;
  }

  /**
   * Emite uma cobrança Pix Cash-In de R$ 9,90 (990 centavos).
   * Retorna txId, linha EMV copia-e-cola e imagem do QR code em Base64.
   */
  async createCashInCharge(
    input: CreatePixChargeInput,
  ): Promise<PixChargeResult> {
    // Se não houver token configurado e estiver em teste/dev sem token, permite mock controlado
    if (!this.token) {
      if (process.env.NODE_ENV === "test") {
        throw new PushinPayError(
          "PUSHIN_PAY_TOKEN não configurado no ambiente de teste",
        );
      }
    }

    const payload = {
      value: input.valueCents,
      webhook_url: input.webhookUrl || process.env.PUSHIN_PAY_WEBHOOK_URL,
    };

    const response = await this.fetchFn(`${this.baseUrl}/api/pix/cashIn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new PushinPayError(
        `Falha ao criar cobrança Pix na Pushin Pay: HTTP ${response.status} - ${errorText}`,
        response.status,
      );
    }

    const data = await response.json();
    // Exemplo de retorno da Pushin Pay:
    // { id: "0194...", qr_code: "000201...", qr_code_base64: "data:image/png;base64,...", status: "created", value: 990 }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    return {
      txId: String(data.id),
      copiaECola: data.qr_code,
      qrCodeBase64: data.qr_code_base64,
      expiresAt,
      status: data.status || "created",
    };
  }

  /**
   * Consulta o status pontual de uma transação na Pushin Pay.
   * Utilizado para reconciliação ativa caso o webhook atrase.
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatusResult> {
    const response = await this.fetchFn(
      `${this.baseUrl}/api/transactions/${txId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new PushinPayError(
        `Erro ao consultar transação ${txId}: HTTP ${response.status} - ${errorText}`,
        response.status,
      );
    }

    const data = await response.json();
    return {
      txId: String(data.id),
      status: data.status,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      valueCents: Number(data.value),
    };
  }
}
```

---

### 4.2. `PixCheckoutService` (`pix-checkout.service.ts`)

Módulo profundo que implementa todas as regras de negócio de pedidos, imutabilidade do snapshot e idempotência transacional.

```typescript
// src/features/checkout/server/services/pix-checkout.service.ts

export interface InitiateCheckoutInput {
  draftId: string;
  customerWhatsapp?: string;
  customerEmail?: string;
}

export interface CheckoutDetailsResult {
  orderId: string;
  draftId: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  amountCents: number;
  customerWhatsapp?: string;
  frozenSnapshot: Record<string, unknown>;
  charge: {
    txId: string;
    copiaECola: string;
    qrCodeBase64: string;
    expiresAt: string; // ISO 8601
    status: string;
  } | null;
}

export interface PushinPayWebhookPayload {
  id: string; // txId
  status: string; // "paid", "created", etc.
  value: number; // valor em centavos
  paid_at?: string;
}

export class PixCheckoutService {
  constructor(
    private readonly pushinPay: PushinPayService = new PushinPayService(),
    private readonly database = db,
  ) {}

  /**
   * Inicia o checkout: valida rascunho com prévia, congela o snapshot,
   * emite cobrança Pix de R$ 9,90 e grava Order e PaymentCharge atomicamente.
   */
  async initiateCheckout(
    input: InitiateCheckoutInput,
  ): Promise<{ orderId: string }> {
    // 1. Carrega rascunho e valida prévia
    const draft = await this.database.query.drafts.findFirst({
      where: eq(drafts.id, input.draftId),
    });

    if (!draft) {
      throw new Error("Rascunho não encontrado");
    }

    if (!draft.previewCardImageUrl) {
      throw new Error(
        "Não é possível iniciar o checkout sem antes gerar a prévia do card com IA",
      );
    }

    // 2. Se já existir um pedido PENDING com cobrança ativa válida para este draft, reaproveita
    const existingOrder = await this.database.query.orders.findFirst({
      where: and(
        eq(orders.draftId, input.draftId),
        eq(orders.status, "PENDING"),
      ),
      with: {
        // busca cobrança associada
      },
    });

    // 3. Monta Frozen Snapshot imutável
    const frozenSnapshot = {
      draftId: draft.id,
      businessSegment: draft.businessSegment,
      targetAspectRatio: draft.targetAspectRatio,
      businessName: draft.businessName,
      offerTitle: draft.offerTitle,
      promoPrice: draft.promoPrice,
      originalPrice: draft.originalPrice,
      callToAction: draft.callToAction,
      whatsapp: input.customerWhatsapp || draft.whatsapp,
      productImageDataUrl: draft.productImageDataUrl,
      referenceImageDataUrl: draft.referenceImageDataUrl,
      stylePresetId: draft.stylePresetId,
      customStyleInstructions: draft.customStyleInstructions,
      previewCardImageUrl: draft.previewCardImageUrl,
      frozenAt: new Date().toISOString(),
    };

    // 4. Emite cobrança na Pushin Pay (R$ 9,90 fixo = 990 centavos)
    const chargeResult = await this.pushinPay.createCashInCharge({
      valueCents: 990,
    });

    // 5. Transação atômica no banco de dados
    const orderId = await this.database.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          draftId: draft.id,
          status: "PENDING",
          amountCents: 990,
          frozenSnapshot,
          customerWhatsapp: input.customerWhatsapp || draft.whatsapp || null,
          customerEmail: input.customerEmail || null,
          aiRegenerationCount: 0,
        })
        .returning({ id: orders.id });

      await tx.insert(paymentCharges).values({
        orderId: newOrder.id,
        txId: chargeResult.txId,
        status: "PENDING",
        qrCodeImageUrl: chargeResult.qrCodeBase64,
        copiaECola: chargeResult.copiaECola,
        amountCents: 990,
        expiresAt: chargeResult.expiresAt,
        rawPayload: chargeResult as unknown as Record<string, unknown>,
      });

      return newOrder.id;
    });

    return { orderId };
  }

  /**
   * Obtém detalhes completos do pedido para renderização da tela de checkout.
   */
  async getCheckoutDetails(orderId: string): Promise<CheckoutDetailsResult> {
    const order = await this.database.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    const latestCharge = await this.database.query.paymentCharges.findFirst({
      where: eq(paymentCharges.orderId, orderId),
      orderBy: [desc(paymentCharges.createdAt)],
    });

    return {
      orderId: order.id,
      draftId: order.draftId || "",
      status: order.status as "PENDING" | "PAID" | "EXPIRED" | "CANCELLED",
      amountCents: order.amountCents,
      customerWhatsapp: order.customerWhatsapp || undefined,
      frozenSnapshot: order.frozenSnapshot as Record<string, unknown>,
      charge: latestCharge
        ? {
            txId: latestCharge.txId,
            copiaECola: latestCharge.copiaECola,
            qrCodeBase64: latestCharge.qrCodeImageUrl || "",
            expiresAt: latestCharge.expiresAt.toISOString(),
            status: latestCharge.status,
          }
        : null,
    };
  }

  /**
   * Processa notificação via Webhook da Pushin Pay com idempotência estrita
   * e validação de segurança de valor recebido.
   */
  async handleWebhookPayment(
    payload: PushinPayWebhookPayload,
    secretHeader?: string,
  ): Promise<{ processed: boolean; orderId?: string; alreadyPaid?: boolean }> {
    // 1. Opcional: valida secret configurado
    const expectedSecret = process.env.PUSHIN_PAY_WEBHOOK_SECRET;
    if (expectedSecret && secretHeader && secretHeader !== expectedSecret) {
      throw new Error("Assinatura/Secret do Webhook inválido");
    }

    // 2. Busca cobrança pelo txId
    const charge = await this.database.query.paymentCharges.findFirst({
      where: eq(paymentCharges.txId, payload.id),
    });

    if (!charge) {
      throw new Error(
        `Cobrança com txId ${payload.id} não encontrada no banco`,
      );
    }

    // 3. IDEMPOTÊNCIA: Se já estiver paga, encerra com sucesso sem mutação redundante
    if (charge.status === "PAID") {
      return { processed: true, orderId: charge.orderId, alreadyPaid: true };
    }

    // 4. Se a notificação for de pagamento confirmado ("paid")
    if (payload.status === "paid") {
      // Validação estrita de valor recebido (anti-spoofing)
      if (Number(payload.value) !== 990) {
        throw new Error(
          `Valor recebido (${payload.value}) divergente do esperado (990 centavos)`,
        );
      }

      const now = payload.paid_at ? new Date(payload.paid_at) : new Date();

      // Transação atômica para transicionar Order e PaymentCharge para PAID
      await this.database.transaction(async (tx) => {
        await tx
          .update(paymentCharges)
          .set({
            status: "PAID",
            paidAt: now,
            updatedAt: new Date(),
          })
          .where(eq(paymentCharges.id, charge.id));

        await tx
          .update(orders)
          .set({
            status: "PAID",
            paidAt: now,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, charge.orderId));
      });

      return { processed: true, orderId: charge.orderId };
    }

    return { processed: false, orderId: charge.orderId };
  }

  /**
   * Consulta o status do pagamento para polling em tempo real.
   * Se o status local ainda for PENDING, efetua reconciliação ativa com a Pushin Pay.
   */
  async checkPaymentStatus(
    orderId: string,
  ): Promise<{ status: string; isPaid: boolean }> {
    const order = await this.database.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    if (order.status === "PAID") {
      return { status: "PAID", isPaid: true };
    }

    // Se ainda PENDING, busca cobrança ativa e faz reconciliação ativa na API Pushin Pay
    const charge = await this.database.query.paymentCharges.findFirst({
      where: eq(paymentCharges.orderId, orderId),
      orderBy: [desc(paymentCharges.createdAt)],
    });

    if (charge && charge.status === "PENDING") {
      // Checa se expirou por tempo
      if (new Date() > charge.expiresAt) {
        await this.database
          .update(paymentCharges)
          .set({ status: "EXPIRED", updatedAt: new Date() })
          .where(eq(paymentCharges.id, charge.id));
        return { status: "EXPIRED", isPaid: false };
      }

      // Reconciliação ativa com Pushin Pay API
      try {
        const remoteTx = await this.pushinPay.getTransactionStatus(charge.txId);
        if (remoteTx.status === "paid" && remoteTx.valueCents === 990) {
          const now = remoteTx.paidAt || new Date();
          await this.database.transaction(async (tx) => {
            await tx
              .update(paymentCharges)
              .set({ status: "PAID", paidAt: now, updatedAt: new Date() })
              .where(eq(paymentCharges.id, charge.id));
            await tx
              .update(orders)
              .set({ status: "PAID", paidAt: now, updatedAt: new Date() })
              .where(eq(orders.id, orderId));
          });
          return { status: "PAID", isPaid: true };
        }
      } catch {
        // Falha transitória na checagem remota não interrompe o polling
      }
    }

    return { status: order.status, isPaid: false };
  }

  /**
   * Reemite cobrança Pix caso a anterior tenha expirado (>30 minutos).
   */
  async regenerateExpiredCharge(
    orderId: string,
  ): Promise<CheckoutDetailsResult> {
    const order = await this.database.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    if (order.status === "PAID") {
      throw new Error("Pedido já está pago; não é possível reemitir cobrança");
    }

    // Emite nova cobrança na Pushin Pay
    const newCharge = await this.pushinPay.createCashInCharge({
      valueCents: 990,
    });

    await this.database.transaction(async (tx) => {
      // Marca cobranças pendentes anteriores como EXPIRED
      await tx
        .update(paymentCharges)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(
          and(
            eq(paymentCharges.orderId, orderId),
            eq(paymentCharges.status, "PENDING"),
          ),
        );

      // Insere a nova cobrança válida
      await tx.insert(paymentCharges).values({
        orderId: order.id,
        txId: newCharge.txId,
        status: "PENDING",
        qrCodeImageUrl: newCharge.qrCodeBase64,
        copiaECola: newCharge.copiaECola,
        amountCents: 990,
        expiresAt: newCharge.expiresAt,
        rawPayload: newCharge as unknown as Record<string, unknown>,
      });

      // Garante que o pedido volta para PENDING caso estivesse marcado como EXPIRED
      await tx
        .update(orders)
        .set({ status: "PENDING", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    });

    return this.getCheckoutDetails(orderId);
  }

  /**
   * Atualiza o WhatsApp de contato do cliente no pedido para resgate futuro do link.
   */
  async updateCustomerWhatsapp(
    orderId: string,
    whatsapp: string,
  ): Promise<void> {
    await this.database
      .update(orders)
      .set({ customerWhatsapp: whatsapp, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }
}
```

---

## 5. Fronteira RPC & HTTP (Server Functions & Webhook Route)

### 5.1. Schemas Zod de Entrada e Saída (`src/features/checkout/data/checkout.schemas.ts`)

```typescript
import { z } from "zod";

export const initiateCheckoutSchema = z.object({
  draftId: z.string().min(1, "draftId é obrigatório"),
  customerWhatsapp: z.string().optional(),
});

export type InitiateCheckoutInput = z.infer<typeof initiateCheckoutSchema>;

export const orderIdSchema = z.object({
  orderId: z.string().uuid("orderId deve ser um UUID válido"),
});

export const updateOrderWhatsappSchema = z.object({
  orderId: z.string().uuid("orderId deve ser um UUID válido"),
  whatsapp: z.string().min(10, "Informe um número de WhatsApp válido com DDD"),
});

export const checkoutDetailsOutputSchema = z.object({
  orderId: z.string(),
  draftId: z.string(),
  status: z.enum(["PENDING", "PAID", "EXPIRED", "CANCELLED"]),
  amountCents: z.number().int(),
  customerWhatsapp: z.string().optional(),
  frozenSnapshot: z.record(z.unknown()),
  charge: z
    .object({
      txId: z.string(),
      copiaECola: z.string(),
      qrCodeBase64: z.string(),
      expiresAt: z.string(),
      status: z.string(),
    })
    .nullable(),
});

export const checkPaymentStatusOutputSchema = z.object({
  status: z.string(),
  isPaid: z.boolean(),
});

export const pushinPayWebhookSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  status: z.string(),
  value: z.coerce.number().int(),
  paid_at: z.string().optional(),
});
```

### 5.2. Server Functions RPC (`src/features/checkout/server/functions/checkout.functions.ts`)

Todas as Server Functions implementadas com dynamic import para blindar contra vazamento de código de backend para o cliente:

```typescript
import { createServerFn } from "@tanstack/react-start";
import {
  initiateCheckoutSchema,
  orderIdSchema,
  updateOrderWhatsappSchema,
} from "../../data/checkout.schemas";

export const initiateCheckoutFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => initiateCheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    const { PixCheckoutService } =
      await import("../services/pix-checkout.service");
    const service = new PixCheckoutService();
    return service.initiateCheckout(data);
  });

export const getOrderCheckoutDetailsFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => orderIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { PixCheckoutService } =
      await import("../services/pix-checkout.service");
    const service = new PixCheckoutService();
    return service.getCheckoutDetails(data.orderId);
  });

export const checkPaymentStatusFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => orderIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { PixCheckoutService } =
      await import("../services/pix-checkout.service");
    const service = new PixCheckoutService();
    return service.checkPaymentStatus(data.orderId);
  });

export const updateOrderWhatsappFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateOrderWhatsappSchema.parse(input))
  .handler(async ({ data }) => {
    const { PixCheckoutService } =
      await import("../services/pix-checkout.service");
    const service = new PixCheckoutService();
    await service.updateCustomerWhatsapp(data.orderId, data.whatsapp);
    return { success: true };
  });

export const regenerateExpiredChargeFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => orderIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { PixCheckoutService } =
      await import("../services/pix-checkout.service");
    const service = new PixCheckoutService();
    return service.regenerateExpiredCharge(data.orderId);
  });
```

### 5.3. Barrel Server Isolation (`src/features/checkout/server/index.ts`)

Exporta exclusivamente as Server Functions e schemas autorizados, auditado por `server-isolation.test.ts`:

```typescript
export {
  initiateCheckoutFn,
  getOrderCheckoutDetailsFn,
  checkPaymentStatusFn,
  updateOrderWhatsappFn,
  regenerateExpiredChargeFn,
} from "./functions/checkout.functions";

export type {
  InitiateCheckoutInput,
  CheckoutDetailsResult,
} from "./services/pix-checkout.service";
```

### 5.4. Rota Canônica do Webhook HTTP TanStack Start (`src/routes/api.webhooks.pix.ts`)

Utiliza o padrão oficial de Server Routes do TanStack Start (`createFileRoute` com `server.handlers.POST`):

```typescript
// src/routes/api.webhooks.pix.ts
import { createFileRoute } from "@tanstack/react-router";
import { pushinPayWebhookSchema } from "@/features/checkout/data/checkout.schemas";
import { PixCheckoutService } from "@/features/checkout/server/services/pix-checkout.service";

export const Route = createFileRoute("/api/webhooks/pix")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const rawBody = await request.json();
          const parsedPayload = pushinPayWebhookSchema.safeParse(rawBody);

          if (!parsedPayload.success) {
            return Response.json(
              {
                error: "Payload do webhook malformado",
                details: parsedPayload.error.format(),
              },
              { status: 400 },
            );
          }

          const secretHeader =
            request.headers.get("x-webhook-secret") || undefined;
          const service = new PixCheckoutService();
          const result = await service.handleWebhookPayment(
            parsedPayload.data,
            secretHeader,
          );

          return Response.json({ success: true, ...result }, { status: 200 });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Erro desconhecido ao processar webhook";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
```

---

## 6. Componentes Frontend & UX Mobile-First (`src/features/checkout/`)

### 6.1. Hook de Polling em Tempo Real (`use-order-polling.ts`)

Implementado via TanStack Query (`useQuery`) com polling condicional de 3 segundos:

```typescript
// src/features/checkout/hooks/use-order-polling.ts
import { useQuery } from "@tanstack/react-query";
import { checkPaymentStatusFn } from "../server";

export interface UseOrderPollingOptions {
  orderId: string;
  initialStatus?: string;
  onPaymentConfirmed?: () => void;
  enabled?: boolean;
}

export function useOrderPolling({
  orderId,
  initialStatus = "PENDING",
  onPaymentConfirmed,
  enabled = true,
}: UseOrderPollingOptions) {
  return useQuery({
    queryKey: ["order-payment-status", orderId],
    queryFn: async () => {
      const response = await checkPaymentStatusFn({ data: { orderId } });
      if (response.isPaid && onPaymentConfirmed) {
        onPaymentConfirmed();
      }
      return response;
    },
    enabled:
      enabled && initialStatus !== "PAID" && initialStatus !== "CANCELLED",
    refetchInterval: (query) => {
      const data = query.state.data;
      if (
        data?.isPaid ||
        data?.status === "PAID" ||
        data?.status === "CANCELLED"
      ) {
        return false; // Interrompe o polling imediatamente
      }
      return 3000; // Polling a cada 3s
    },
    refetchIntervalInBackground: true,
  });
}
```

### 6.2. Componentes de UI Mobile-First

1. **`order-summary-card.tsx`**:
   - Resumo da compra: título da promoção, valor de R$ 9,90 avulso e miniatura da prévia com marca d'água aprovada.
   - Construído com primitivos shadcn/ui (`Card`, `Badge`, `Typography`).

2. **`pix-copia-cola-card.tsx`**:
   - Código EMV Copia e Cola dentro de container legível com truncate suave.
   - Botão de destaque touch-friendly _"Copiar Código Pix"_ com ícone `Copy`/`Check` e feedback de cópia com `navigator.clipboard`.

3. **`pix-qr-code-card.tsx`**:
   - Renderiza a imagem do QR Code em Base64 retornada pela Pushin Pay.
   - Container com cantos arredondados, fundo branco para máxima legibilidade óptica em scan e instruções acessíveis.

4. **`payment-polling-indicator.tsx`**:
   - Indicador com animação suave de pulso (_"Aguardando confirmação do banco..."_).
   - Cronômetro regressivo com contagem visual decrescente (30:00 -> 00:00).
   - Botão de contingência: _"Já paguei? Verificar agora"_.
   - Estado `EXPIRED`: aviso claro de expiração e botão proeminente _"Gerar Novo Código Pix"_.

5. **`order-whatsapp-recovery-card.tsx`**:
   - Campo acessível com `Input` shadcn/ui: _"Receber link por WhatsApp caso feche o navegador (opcional)"_.
   - Pré-preenchido com o WhatsApp cadastrado no rascunho.
   - Salva via `updateOrderWhatsappFn` ao perder o foco ou clicar em confirmar.

### 6.3. Conexão na Etapa 3 do Wizard de Criação

Atualização de `src/features/promotions/components/preview-checkout-action-card.tsx` e `offer-brief-wizard.tsx`:

- Substituir o placeholder `alert(...)` por chamada à Server Function `initiateCheckoutFn({ data: { draftId } })`.
- Feedback no botão: _"Gerando Cobrança Pix..."_ com spinner.
- Navegação automática do router para `/checkout/$orderId`.

---

## 7. Estratégia de Testes (TDD Seams)

### 7.1. Matriz de Testes

| Arquivo de Teste               | Camada                | Objetivo do Teste                                                                                                                                               |
| ------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pushin-pay.service.test.ts`   | Backend / Unidade     | Emissão de Cash-In com fake fetch determinístico, parsing de QR Code Base64 e Copia e Cola, consulta de status e tratamento de erros de API.                    |
| `pix-checkout.service.test.ts` | Backend / Integração  | Criação de pedido com `frozenSnapshot` imutável, máquina de estados, transição para `PAID`, idempotência estrita de webhooks e rejeição de valores divergentes. |
| `server-isolation.test.ts`     | Arquitetura / Limites | Garante que `features/checkout/server/index.ts` expõe apenas Server Functions e schemas, sem vazamento de módulos Node.js para o browser.                       |
| `checkout.functions.test.ts`   | Fronteira RPC         | Validação Zod estrita de inputs e outputs das Server Functions.                                                                                                 |
| `use-order-polling.test.ts`    | Frontend / Hook       | Ciclo de polling de 3 segundos com TanStack Query, parada imediata ao receber `PAID` e disparo do callback `onPaymentConfirmed`.                                |
| `checkout-view.test.tsx`       | Frontend / UI         | Renderização dos estados `PENDING`, `EXPIRED`, cópia do Pix e redirecionamento no status `PAID`.                                                                |

### 7.2. Pipeline de Verificação Oficial

Todos os testes e verificações devem passar sem ressalvas no pipeline do projeto:

```bash
# Executa check de conformidade Shadcn UI + Typecheck + ESLint + Vitest
./.agents/scripts/verify.sh --quick
```

---

## 8. Escopo dos Builders & Ordem de Execução

Seguindo a topologia Boost e a esteira do Feature Factory, o subagente `feature-orchestrator` despachará os builders respeitando a dependência dos tickets:

```
[Ticket 01: DB Schema & Pushin Pay Deep Module]
                      │
                      ▼
[Ticket 02: PixCheckoutService, Snapshot & Webhook Route]
                      │
                      ▼
[Ticket 03: Server Functions RPC & Polling Hook]
                      │
                      ▼
[Ticket 04: Mobile-First Checkout UI & TanStack Start Route]
```

- **`backend-builder`**:
  - Ticket 01: `src/server/db/schema/orders.ts`, `src/config/server-env.ts`, `pushin-pay.service.ts` e testes.
  - Ticket 02: `pix-checkout.service.ts`, `src/routes/api.webhooks.pix.ts` e testes de integração e idempotência.
  - Ticket 03: `checkout.schemas.ts`, `checkout.functions.ts` e `src/features/checkout/server/index.ts`.
- **`frontend-builder`**:
  - Ticket 03: `use-order-polling.ts`, `use-pix-checkout.ts` e seus testes.
  - Ticket 04: Componentes shadcn/ui em `src/features/checkout/components/`, view `checkout-view.tsx`, rota `src/routes/checkout.$orderId.tsx` e atualização da etapa 3 do wizard em `promotions`.
- **`test-verifier` & `implementation-validator`**:
  - Validação concorrente no Gate 2 auditando conformidade com a Spec, regras do `AGENTS.md`, SOLID, YAGNI e execução de `./.agents/scripts/verify.sh --quick`.
