# 01: Backend & Export Stream — Configurações, Catálogo, Schema Drizzle, Checkout RPC & Assinatura Vetorial no ExportEngine

**Spec:** [`docs/specs/cobranding-discount.md`](../../specs/cobranding-discount.md)

**What to build:**
Permitir que o backend do OfertaPronta governe com autoridade de preço e segurança de dados a promoção de co-branding (desconto de 30% em troca da assinatura de marca no card final), oferecendo:
1. Configuração server-only no `server-env.ts` (`COBRANDING_PROMOTION_ENABLED`, `COBRANDING_CREDIT_TEXT`, `COBRANDING_DISCOUNT_PERCENT`) sem exposição de segredos ao cliente.
2. Módulo de cálculo no `campaign-catalog.ts` (`calculateCobrandingPrice`) derivando centavos inteiros (990 -> 693 centavos) e formatação BRL.
3. Extensão do schema Drizzle `orders` (`cobrandingAccepted: boolean`, `cobrandingCreditText: text`) com migração SQL gerada via `pnpm db:generate`.
4. RPC e Service de Checkout (`updateOrderCobrandingFn` / `PixCheckoutService.updateOrderCobranding`) que recalcula o valor, expira a cobrança Pix pendente anterior, emite nova cobrança na Pushin Pay com o novo valor e atualiza o `frozenSnapshot`.
5. Módulo profundo `ExportEngine` (`image-processor.ts`) com a função `applyCobrandingSignature`, renderizando a assinatura vetorial sutil `"Design por @ofertapronta"` via Sharp/SVG em Feed (1080×1350) e Story (1080×1920) com contraste e legibilidade ideais.
6. Garantia de que `DeliveryService` e `PostPaymentRegenerationService` aplicam a assinatura nos exports finais gerados apenas se o pedido foi pago com `cobrandingAccepted === true`.

**Blocked by:** None (Execução Imediata / Concorrente com Stream 2 graças aos contratos de dados congelados)

**Status:** `ready-for-agent`

## Arquivos a Modificar / Criar
- `src/config/server-env.ts`: Adicionar variáveis `COBRANDING_PROMOTION_ENABLED`, `COBRANDING_CREDIT_TEXT` e `COBRANDING_DISCOUNT_PERCENT`.
- `src/lib/campaign-catalog.ts` & `src/lib/campaign-catalog.test.ts`: Adicionar helper de cálculo financeiro `calculateCobrandingPrice` e metadados de co-branding.
- `src/server/db/schema/orders.ts`: Adicionar colunas `cobrandingAccepted` e `cobrandingCreditText`.
- `src/features/checkout/data/checkout.schemas.ts`: Adicionar `updateOrderCobrandingSchema` e campos de co-branding no `checkoutDetailsOutputSchema`.
- `src/features/checkout/server/services/pix-checkout.service.ts` & testes: Implementar método `updateOrderCobranding`, recálculo atômico na Pushin Pay e snapshot congelado.
- `src/features/checkout/server/services/checkout-runners.service.ts`: Expor runner `executeUpdateOrderCobranding`.
- `src/features/checkout/server/functions/checkout.functions.ts` & testes: Criar Server Function RPC `updateOrderCobrandingFn`.
- `src/server/export-engine/image-processor.ts`, `index.ts` & testes: Implementar `applyCobrandingSignature` com renderização vetorial SVG de alto contraste.
- `src/features/delivery/server/services/delivery.service.ts` & testes: Injetar assinatura nos arquivos finais se `order.cobrandingAccepted === true`.
- `src/features/delivery/server/services/post-payment-regeneration.service.ts` & testes: Preservar assinatura em novas gerações por IA pós-pagamento.

## Acceptance Criteria (BDD)

- [ ] **Cálculo Financeiro Preciso no Catálogo:**
  - *Given* um plano avulso com preço base de 990 centavos e percentual de 30%,
  - *When* `calculateCobrandingPrice(990, 30)` é invocado,
  - *Then* retorna `amountCents: 693`, `discountAmountCents: 297`, `formattedDiscountedPrice: "R$ 6,93"` e `formattedSavings: "R$ 2,97"`.
- [ ] **Schema Drizzle e Migração:**
  - *Given* a tabela `orders`,
  - *When* o schema for atualizado,
  - *Then* possui as colunas `cobrandingAccepted` (boolean default false) e `cobrandingCreditText` (text null), e a migração SQL correspondente é gerada via `pnpm db:generate`.
- [ ] **Ativação do Desconto no Checkout (`updateOrderCobranding`):**
  - *Given* um pedido PENDING com valor de 990 centavos,
  - *When* o cliente aciona `updateOrderCobrandingFn({ orderId, cobrandingAccepted: true })`,
  - *Then* a cobrança Pix anterior é expirada, uma nova cobrança de 693 centavos é emitida na Pushin Pay, `orders.amountCents` é atualizado para 693, `orders.cobrandingAccepted` torna-se `true`, `orders.cobrandingCreditText` recebe `"Design por @ofertapronta"` e o `frozenSnapshot` é enriquecido.
- [ ] **Desativação do Desconto (Reversão):**
  - *Given* um pedido PENDING com desconto ativo (693 centavos),
  - *When* o cliente aciona `updateOrderCobrandingFn({ orderId, cobrandingAccepted: false })`,
  - *Then* o valor é restaurado para 990 centavos, `orders.cobrandingAccepted` torna-se `false`, `orders.cobrandingCreditText` torna-se `null` e uma nova cobrança de 990 centavos é emitida na Pushin Pay.
- [ ] **Bloqueio de Modificação em Pedido Pago:**
  - *Given* um pedido com status `PAID`,
  - *When* houver tentativa de invocar `updateOrderCobranding`,
  - *Then* lança erro de domínio rejeitando a alteração.
- [ ] **Renderização Vetorial da Assinatura no `ExportEngine`:**
  - *Given* um buffer de imagem nos formatos Feed (1080×1350) e Story (1080×1920),
  - *When* `applyCobrandingSignature(buffer, { creditText: "Design por @ofertapronta", aspectRatio })` for executado,
  - *Then* retorna um PNG com dimensões exatas contendo o texto vetorial renderizado no rodapé com contraste nítido e margem de segurança.
- [ ] **Preservação no Delivery e Regeneração:**
  - *Given* um pedido confirmado com `cobrandingAccepted: true`,
  - *When* `deliveryService` deriva os arquivos finais ou `postPaymentRegenerationService` regenera a arte com IA,
  - *Then* os PNGs disponibilizados para download contêm a assinatura de marca.
- [ ] **Qualidade e Testes:**
  - *Given* as implementações dos serviços,
  - *When* executados os testes unitários (`pnpm vitest run src/lib/campaign-catalog.test.ts`, `src/features/checkout/server/services/pix-checkout.service.test.ts`, `src/server/export-engine/export-engine.test.ts`),
  - *Then* todos passam com 100% de sucesso e `pnpm typecheck` não aponta erros.
