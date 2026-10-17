# 02: Conciliação Dinâmica e Precificação Autoritativa no `PixCheckoutService`

**Spec:** [`docs/specs/pricing-catalog-deepening.md`](../../specs/pricing-catalog-deepening.md)

**What to build:** Aprofundar o `PixCheckoutService` (`src/features/checkout/server/services/pix-checkout.service.ts`) e os contratos Zod (`src/features/checkout/data/checkout.schemas.ts`) para resolver o plano via `CampaignCatalog`, congelar `planId`, `planName`, `amountCents` e `maxPostPaymentRegenerations` no `Order` e no `Frozen Snapshot`, e conciliar o webhook (`handleWebhookPayment`), o polling ativo (`checkPaymentStatus`) e a reemissão (`regenerateExpiredCharge`) estritamente contra `charge.amountCents` / `order.amountCents`, eliminando todas as ocorrências do literal mágico `990`.

**Blocked by:** [`01-campaign-catalog-and-order-schema.md`](./01-campaign-catalog-and-order-schema.md)

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Given** um rascunho válido com prévia gerada, **When** `initiateCheckout` é chamado (com `planId` omitido ou `"single_campaign"`), **Then** o serviço resolve o plano autoritativo no `CampaignCatalog`, cria a cobrança na Pushin Pay com `valueCents: plan.amountCents`, grava `planId` e `amountCents` em `orders` e `paymentCharges`, e congela `planId`, `planName`, `amountCents` e `maxPostPaymentRegenerations` dentro de `orders.frozenSnapshot`.
- [ ] **Given** uma tentativa de iniciar checkout para um plano marcado com `isActiveInMvp: false` (ex.: `"pack_5_campaigns"`), **When** `initiateCheckout` é chamado no MVP, **Then** rejeita a operação com erro claro informando que o plano ainda não está habilitado para compra avulsa.
- [ ] **Given** uma cobrança Pix persistida com qualquer `charge.amountCents` (ex.: `990`, `1490` ou `2990`), **When** `handleWebhookPayment` recebe uma notificação `status: "paid"`, **Then** valida `Number(payload.value) === charge.amountCents` (em vez de `990` fixo), aprovando o pagamento quando o valor bate exatamente com `charge.amountCents` e lançando erro `Valor recebido (${payload.value}) divergente do esperado (${charge.amountCents} centavos)` quando diverge.
- [ ] **Given** um pedido `PENDING` com cobrança ativa, **When** `checkPaymentStatus` realiza a reconciliação ativa na API da Pushin Pay, **Then** confirma o pagamento somente se `remoteTx.status === "paid" && remoteTx.valueCents === charge.amountCents`.
- [ ] **Given** um pedido `PENDING` cuja cobrança anterior expirou (mesmo que o preço do catálogo tenha mudado posteriormente), **When** `regenerateExpiredCharge(orderId)` é executado, **Then** emite a nova cobrança na Pushin Pay utilizando `valueCents: order.amountCents` congelado no pedido e persiste o novo `paymentCharges` com `amountCents: order.amountCents`.
- [ ] **Given** a suíte de testes `pix-checkout.service.test.ts` e `api.webhooks.pix.test.ts`, **When** `pnpm test` é executado, **Then** todos os cenários (incluindo testes parametrizados com múltiplos preços como `990`, `1490` e `2990`) passam sem regressões.
