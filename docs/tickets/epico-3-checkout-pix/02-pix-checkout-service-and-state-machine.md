# 02: PixCheckoutService, Frozen Snapshot & Webhook Handler

**Spec:** [`docs/specs/epico-3-checkout-pix.md`](../../specs/epico-3-checkout-pix.md)

**What to build:**
Implementar o módulo profundo `PixCheckoutService` contendo a máquina de estados transacional de pedidos (`Order`) e cobranças Pix (`PaymentCharge`). O serviço deve congelar o snapshot imutável (`Frozen Snapshot`) do rascunho com o valor autoritativo de R$ 9,90 (990 centavos), emitir a cobrança via `PushinPayService`, processar webhooks com validação estrita de idempotência e valor recebido, e expor o endpoint HTTP de webhook em `src/routes/api/webhooks.pix.ts`.

**Blocked by:** `01: Database Schema Updates & Pushin Pay Deep Module`

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Módulo Profundo `PixCheckoutService` (`src/features/checkout/server/services/pix-checkout.service.ts`):**
  - Implementar métodos de domínio:
    - `initiateCheckout(input: InitiateCheckoutInput): Promise<{ orderId: string }>`:
      - Carrega o rascunho correspondente pelo `draftId`.
      - Valida se o rascunho possui prévia gerada (`previewCardImageUrl`).
      - Congela o `frozenSnapshot` com todos os dados da campanha, imagens e carimbo de data/hora.
      - Cria o registro na tabela `orders` com status `PENDING` e `amountCents: 990`.
      - Invoca o `PushinPayService.createCashInCharge` para emitir o Pix.
      - Salva o registro na tabela `payment_charges` vinculado ao pedido.
      - Retorna o `orderId`.
    - `getCheckoutDetails(orderId: string): Promise<CheckoutDetailsResult>`:
      - Recupera o pedido e sua cobrança ativa mais recente com QR Code, Copia e Cola e contagem de expiração.
    - `handleWebhookPayment(payload: WebhookPayload, secretHeader?: string): Promise<{ processed: boolean; orderId?: string }>`:
      - Localiza a cobrança pelo `txId` fornecido no payload da Pushin Pay.
      - **Idempotência**: Se o status da cobrança já for `PAID`, ignora e retorna `{ processed: true }` sem reprocessar.
      - **Validação de Valor**: Garante que o valor recebido (`value`) é exatamente 990 centavos.
      - Atualiza a cobrança e o pedido atomicamente para status `PAID` com carimbo `paidAt: new Date()`.
    - `checkPaymentStatus(orderId: string): Promise<{ status: string; isPaid: boolean }>`:
      - Consulta o banco de dados local. Se o status ainda for `PENDING`, efetua verificação ativa pontual via `PushinPayService.getTransactionStatus` para garantir reconciliação caso o webhook atrase.
    - `regenerateExpiredCharge(orderId: string): Promise<CheckoutDetailsResult>`:
      - Se a cobrança anterior expirou (`EXPIRED`), emite uma nova cobrança na Pushin Pay e vincula ao mesmo pedido mantendo o `frozenSnapshot`.
    - `updateCustomerWhatsapp(orderId: string, whatsapp: string): Promise<void>`:
      - Atualiza o campo opcional `customerWhatsapp` no pedido para resgate futuro do link.

- [ ] **Endpoint HTTP de Webhook (`src/routes/api/webhooks.pix.ts`):**
  - Implementado via `createAPIFileRoute` do TanStack Start.
  - Recebe o método `POST`, valida a entrada com schema Zod do payload da Pushin Pay.
  - Delega a execução para `PixCheckoutService.handleWebhookPayment`.
  - Retorna HTTP 200 `{ success: true }` para notificações válidas ou idempotentes.
  - Retorna HTTP 400 se o payload for malformado ou se houver divergência de valor.

- [ ] **Testes de Integração & Máquina de Estados (`src/features/checkout/server/services/pix-checkout.service.test.ts`):**
  - **Given** um rascunho com prévia gerada,
  - **When** `initiateCheckout` for chamado,
  - **Then** cria o pedido com `frozenSnapshot` imutável, status `PENDING` e cobrança associada.
  - **Given** um webhook válido com `status: "paid"` e `value: 990`,
  - **When** `handleWebhookPayment` for processado pela primeira vez,
  - **Then** atualiza o pedido para `PAID` e grava o `paidAt`.
  - **Given** o mesmo webhook disparado pela segunda vez,
  - **When** `handleWebhookPayment` for reprocessado,
  - **Then** responde com sucesso sem alterar o estado do pedido (idempotência).
  - **Given** um webhook com valor divergente (ex.: 500 centavos),
  - **When** `handleWebhookPayment` for processado,
  - **Then** lança erro de segurança e não altera o status do pedido para `PAID`.
