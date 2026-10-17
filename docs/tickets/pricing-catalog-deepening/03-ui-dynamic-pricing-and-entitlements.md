# 03: UI Mobile-First Orientada ao Catálogo de Planos e ao Pedido

**Spec:** [`docs/specs/pricing-catalog-deepening.md`](../../specs/pricing-catalog-deepening.md)

**What to build:** Refatorar todos os componentes visuais de Checkout (`CheckoutView`, `OrderSummaryCard`, `PixCopiaEColaCard`, `PixQrCodeCard`), de Prévia (`PreviewCheckoutActionCard`, `AiQuotaExceededAlert`) e da Landing Page (`LandingHeroSection`, `LandingPricingSection`, `LandingStepsSection`) para consumirem dinamicamente o `amountCents` / `frozenSnapshot` do pedido ou o plano padrão do `CampaignCatalog`, eliminando 100% das strings `"R$ 9,90"` e `"9,90"` chumbadas no JSX.

**Blocked by:** [`01-campaign-catalog-and-order-schema.md`](./01-campaign-catalog-and-order-schema.md)

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Given** a tela de Checkout (`CheckoutView`), **When** renderizada com `initialDetails` contendo qualquer `amountCents` (ex.: `990` ou `1490`), **Then** repassa `amountCents` para `OrderSummaryCard`, `PixCopiaEColaCard` e `PixQrCodeCard`, e todos os três componentes exibem o valor formatado via `formatBRL(amountCents)` (no resumo, no passo 3 do Copia e Cola e no `alt` do QR Code).
- [ ] **Given** o `OrderSummaryCard`, **When** renderizado, **Then** utiliza `formatBRL` de `@/lib/utils` e exibe a cota de regenerações pós-compra a partir do plano/snapshot sem valores mágicos fixos no JSX.
- [ ] **Given** os componentes da etapa de Prévia (`PreviewCheckoutActionCard` e `AiQuotaExceededAlert`), **When** renderizados no fluxo de criação (`/criar`), **Then** obtêm o preço formatado (`formattedPrice`) e o limite de regenerações (`maxPostPaymentRegenerations`) diretamente do plano padrão do `CampaignCatalog`.
- [ ] **Given** as seções da Landing Page (`LandingHeroSection`, `LandingPricingSection`, `LandingStepsSection`), **When** renderizadas na rota inicial (`/`), **Then** exibem o preço (`formattedPrice` e `priceParts.formattedDecimal`) e a cota de regenerações a partir do plano padrão do `CampaignCatalog`, sem literais `"9,90"` ou `"R$ 9,90"` hardcoded nos componentes.
- [ ] **Given** toda a árvore de componentes React (`src/components/` e `src/features/`), **When** auditada por busca textual e pelo linter `./.agents/scripts/verify.sh --shadcn`, **Then** não restam ocorrências hardcoded de `"R$ 9,90"` em componentes visuais, mantendo 100% de conformidade mobile-first e Shadcn UI, e os testes de interface (`checkout-view.test.tsx`, `offer-brief-wizard.test.tsx`) passam integralmente.
