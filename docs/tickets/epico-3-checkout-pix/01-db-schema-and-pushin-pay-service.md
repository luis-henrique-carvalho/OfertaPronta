# 01: Database Schema Updates & Pushin Pay Deep Module

**Spec:** [`docs/specs/epico-3-checkout-pix.md`](../../specs/epico-3-checkout-pix.md)

**What to build:**
Atualizar o schema do banco de dados para vincular pedidos diretamente aos rascunhos de criação (`draftId`) e preparar o controle de regenerações com IA (`aiRegenerationCount`). Implementar o módulo profundo `PushinPayService` no servidor para comunicação com a API REST da Pushin Pay, permitindo emissão de cobranças Pix Cash-In de R$ 9,90 (990 centavos) com retorno de QR Code e Pix Copia e Cola, além de consulta pontual de transação.

**Blocked by:** `None (can start immediately)`

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Atualização do Schema Drizzle (`src/server/db/schema/orders.ts`):**
  - Adicionar o campo `draftId: text("draft_id").references(() => drafts.id)` na tabela `orders`.
  - Adicionar o campo `aiRegenerationCount: integer("ai_regeneration_count").notNull().default(0)` na tabela `orders`.
  - Exportar os tipos inferidos atualizados (`Order`, `NewOrder`).

- [ ] **Configuração de Variáveis de Ambiente (`src/config/server-env.ts`):**
  - Adicionar validação Zod para as variáveis do Pushin Pay no servidor:
    - `PUSHIN_PAY_TOKEN`: `z.string().min(1).optional()` (com suporte a fallback mock em ambiente de teste/dev).
    - `PUSHIN_PAY_WEBHOOK_URL`: `z.string().url().optional()`.
    - `PUSHIN_PAY_WEBHOOK_SECRET`: `z.string().optional()`.

- [ ] **Módulo Profundo `PushinPayService` (`src/features/checkout/server/services/pushin-pay.service.ts`):**
  - Criar interface pública concisa com os métodos:
    - `createCashInCharge(input: { valueCents: number; webhookUrl?: string }): Promise<PixChargeResult>`
    - `getTransactionStatus(txId: string): Promise<{ status: "paid" | "created" | "expired" | "canceled"; paidAt?: Date; valueCents: number }>`
  - Encapsular a comunicação HTTP com a API da Pushin Pay (`POST /api/pix/cashIn` e `GET /api/transactions/:id`).
  - Lançar erros de domínio tipados em caso de falha de autenticação ou indisponibilidade da API externa.
  - Implementar suporte nativo a fake/mock in-memory para execução de testes unitários sem dependência de rede externa.

- [ ] **Testes de Unidade (`src/features/checkout/server/services/pushin-pay.service.test.ts`):**
  - **Given** uma requisição de cobrança Pix de 990 centavos,
  - **When** `createCashInCharge` for executado com credenciais válidas,
  - **Then** deve retornar `txId`, `copiaECola`, `qrCodeBase64` e `expiresAt` com validade futura de aproximadamente 30 minutos.
  - **Given** um `txId` existente,
  - **When** `getTransactionStatus` for consultado,
  - **Then** deve retornar o status correspondente e o valor em centavos.
