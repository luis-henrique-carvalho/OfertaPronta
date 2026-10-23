# 01 — Backend Stream: Reset de Cota no Ledger e Integração PixCheckout

- **Spec**: [`docs/specs/reset-preview-quota-on-payment.md`](../../specs/reset-preview-quota-on-payment.md)
- **Blocked by**: None (pode iniciar imediatamente)
- **Status**: `ready-for-agent`

## O que construir

Implementar a regra de negócio completa no backend para que, no momento em que um pedido atinja o status `PAID` (via webhook da Pushin Pay, polling com reconciliação ativa ou simulação dev), o visitante que originou o pedido tenha suas prévias gratuitas ativas transicionadas para `RESET_BY_PURCHASE`. Isso restaura imediatamente o contador de 2 prévias gratuitas no `free_preview_ledger` para aquele `visitor_id`, mantendo 100% do histórico e integridade de auditoria.

### Escopo Detalhado

1. **Schema & Domínio Drizzle**:
   - Atualizar a tipagem de documentação/comentários em `src/server/db/schema/free-preview.ts` para registrar o status `'RESET_BY_PURCHASE'`. (O campo `status` é `text("status").notNull()`, dispensando migração DDL de enum, mas garantindo tipos estritos de domínio).
2. **Deep Module `FreePreviewQuota`**:
   - Em `src/features/promotions/server/services/free-preview-quota.service.ts`:
     - Implementar e exportar a função `resetVisitorQuotaOnPayment({ draftId, now? }, db?)`.
     - Localizar o `visitorId` a partir do `draftId` no `freePreviewLedger`.
     - Atualizar atômica e transacionalmente as linhas com status `CONSUMED` ou `RESERVED` desse visitante para `RESET_BY_PURCHASE`, definindo `settledAt = now`.
     - Retornar `{ resetCount: number, visitorId: string | null }`.
     - Garantir que `checkQuotaLimits` e `getQuotaStatus` continuem ignorando linhas com status `RESET_BY_PURCHASE` (a condição `activeCondition` já faz isso nativamente filtrando apenas `CONSUMED` e `RESERVED`).
3. **Integração no Ponto Central de Liquidação `PixCheckoutService`**:
   - Em `src/features/checkout/server/services/pix-checkout.service.ts`:
     - No método `markOrderAndChargePaid`, recuperar o `order.draftId`.
     - Se `order.draftId` existir, chamar `resetVisitorQuotaOnPayment({ draftId: order.draftId, now })`.
     - Garantir que tanto `handleWebhookPayment`, `checkPaymentStatus` quanto `simulateDevPayment` disparem o reset de forma idempotente e segura.
4. **Exportações no Barrel da Feature Promotions**:
   - Garantir que `resetVisitorQuotaOnPayment` esteja devidamente exportado em `src/features/promotions/server/index.ts` mantendo o isolamento de fronteira.

## Acceptance Criteria (BDD)

- [ ] **Dado** que um visitante consumiu suas 2 prévias grátis (`remaining: 0`, `blockedReason: "visitor"`), **Quando** o pedido associado ao seu draft for marcado como `PAID`, **Então** o status dessas prévias no `free_preview_ledger` muda para `RESET_BY_PURCHASE`.
- [ ] **Dado** que as prévias de um visitante foram transicionadas para `RESET_BY_PURCHASE`, **Quando** `getQuotaStatus` for consultado para esse visitante, **Então** deve retornar `remaining: 2` e `blockedReason: null`.
- [ ] **Dado** uma chamada a `resetVisitorQuotaOnPayment` com `draftId` desconhecido ou inexistente, **Quando** a função for executada, **Então** deve retornar `{ resetCount: 0, visitorId: null }` sem lançar erro.
- [ ] **Dado** que dois visitantes distintos consumiram prévias na mesma rede/IP, **Quando** apenas o visitante A pagar seu pedido, **Então** apenas as linhas do visitante A são resetadas para `RESET_BY_PURCHASE`; o visitante B não pagante permanece com seu contador inalterado.
- [ ] **Dado** que um webhook duplicado ou repetido é recebido para uma cobrança já paga (`charge.status === 'PAID'`), **Quando** `handleWebhookPayment` for acionado, **Então** a idempotência é preservada sem operações redundantes.

## Validação (Builder)

- Executar testes unitários específicos: `pnpm vitest run src/features/promotions/server/services/free-preview-quota.service.test.ts`
- Executar testes do checkout: `pnpm vitest run src/features/checkout/server/services/pix-checkout.service.test.ts`
- Verificar conformidade estrita de tipos: `pnpm typecheck`
