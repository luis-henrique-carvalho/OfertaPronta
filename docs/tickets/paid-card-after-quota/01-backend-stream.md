# 01 — Backend Stream: Checkout sem Prévia, Geração On-The-Fly na Entrega e Reset de Cota

**Spec:** [`docs/specs/paid-card-after-quota.md`](../../specs/paid-card-after-quota.md)

**What to build:**
Permitir que o fluxo de checkout e entrega processe pedidos de rascunhos criados sem prévia gratuita prévia gerada pela IA (quando a cota de 2 prévias diárias estiver esgotada). No checkout, o snapshot imutável é congelado sem invocar a API de IA; na entrega (`/pedido/$orderId`), o `DeliveryService` detecta a ausência de arte mestre limpa e invoca a geração da IA on-the-fly usando os parâmetros do snapshot congelado, gerando os formatos Feed (1080×1350) e Story (1080×1920), mantendo as 3 regenerações pós-compra e resetando a cota diária do visitante pagante no ledger.

**Blocked by:** None (pode iniciar imediatamente; roda em paralelo com a Stream 2).

**Status:** `completed`

---

## Escopo Detalhado

1. **`PixCheckoutService.initiateCheckout` (`src/features/checkout/server/services/pix-checkout.service.ts`)**:
   - Flexibilizar a validação que lançava erro `"Não é possível iniciar o checkout sem antes gerar a prévia do card com IA"`.
   - Permitir `initiateCheckout` para rascunhos com campos obrigatórios preenchidos mesmo que `draft.previewCardImageUrl` seja nulo ou indefinido.
   - Em `buildFrozenSnapshot`, registrar a flag `pendingAiGeneration: !draft.previewCardImageUrl` e persistir `visitorId` (extraído do contexto da requisição via cookie `op_vid` resolvido ou parâmetro de entrada).
   - Manter a integridade de reaproveitamento de pedidos pendentes com cobrança ativa (`findActivePendingOrder`).

2. **`DeliveryService` (`src/features/delivery/server/services/delivery.service.ts`)**:
   - Injetar dependência de geração de card (`generateAdCard: (input: GenerateAdCardInput) => Promise<GenerateAdCardResult>`), com valor padrão `generateAdCardImage`, espelhando o padrão já adotado em `PostPaymentRegenerationService`.
   - No método `ensureDeliveryExports(orderId)`:
     - Se `order.status !== "PAID"`, mantém erro 403 (`ORDER_NOT_PAID`).
     - Se `deliveryExports` já existir, retorna o resultado existente (idempotência estrita).
     - Se não houver arte mestre limpa no banco/storage (`cleanMasterAssetKey` e `cleanMasterImageDataUrl` ausentes):
       - Em vez de falhar com `MASTER_ART_NOT_FOUND`, invoca `this.generateAdCard` utilizando os parâmetros do `order.frozenSnapshot`.
       - Persiste a arte mestre limpa gerada no `StorageService` (`orders/${order.id}/clean-master.png`), salvando o `assetKey` no registro do pedido (`orders.cleanMasterAssetKey`).
       - O contador `aiRegenerationCount` permanece `0` (garantindo as 3 regenerações pós-compra intactas).
     - Executa `deriveAndPersistFormats` via `ExportEngine`, derivando Feed e Story sem marca d'água e persistindo em `deliveryExports`.

3. **`FreePreviewQuotaService.resetVisitorQuotaOnPayment` (`src/features/promotions/server/services/free-preview-quota.service.ts`)**:
   - Expandir a interface `ResetVisitorQuotaInput`:
     ```ts
     export interface ResetVisitorQuotaInput {
       draftId?: string;
       visitorId?: string;
       now?: Date;
     }
     ```
   - Permitir o reset da cota do visitante diretamente quando `visitorId` for fornecido (obtido de `order.frozenSnapshot.visitorId` ou parâmetro), mesmo que aquele `draftId` específico não tenha registro anterior em `free_preview_ledger`.
   - Em `PixCheckoutService.resetPreviewQuotaSafely`, passar tanto `draftId` quanto `visitorId` (do `frozenSnapshot`).

---

## Acceptance Criteria (BDD)

- [x] **Critério 1 (Checkout sem prévia)**:
  - *Dado* um rascunho salvo sem `previewCardImageUrl`
  - *Quando* `PixCheckoutService.initiateCheckout` for invocado
  - *Então* o pedido deve ser criado com status `PENDING`, valor correto (R$ 9,90) e `frozenSnapshot` contendo `pendingAiGeneration: true`.

- [x] **Critério 2 (Geração on-the-fly na entrega)**:
  - *Dado* um pedido com status `PAID` e `pendingAiGeneration: true` (sem arte mestre gerada previamente)
  - *Quando* `DeliveryService.ensureDeliveryExports` for chamado para esse pedido
  - *Então* deve chamar o gerador de imagem da IA com os dados do `frozenSnapshot`, salvar o master limpo e retornar os links de download Feed e Story.
  - *E* `order.aiRegenerationCount` deve ser 0 (3 regenerações disponíveis).

- [x] **Critério 3 (Idempotência da entrega)**:
  - *Dado* um pedido cujo card já foi gerado e exportado
  - *Quando* `DeliveryService.ensureDeliveryExports` for chamado novamente
  - *Então* deve retornar os exports existentes sem acionar a IA novamente.

- [x] **Critério 4 (Reset de cota via `visitorId`)**:
  - *Dado* um visitante com 2 prévias no status `CONSUMED` no ledger
  - *Quando* um pedido for pago informando `visitorId` (mesmo sem entrada de draft prévio)
  - *Então* todas as linhas ativas daquele visitante devem ser atualizadas para `RESET_BY_PURCHASE`.

---

## Validação Cirúrgica (Builder)

- Rodar apenas os testes da área de backend:
  - `pnpm vitest run src/features/checkout/server/services/pix-checkout.service.test.ts`
  - `pnpm vitest run src/features/delivery/server/services/delivery.service.test.ts`
  - `pnpm vitest run src/features/promotions/server/services/free-preview-quota.service.test.ts`
- `pnpm typecheck`
