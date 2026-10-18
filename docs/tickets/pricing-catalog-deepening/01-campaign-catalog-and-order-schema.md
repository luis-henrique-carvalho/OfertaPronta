# 01: Módulo Profundo `CampaignCatalog` e Evolução do Schema de Pedidos (`orders.ts`)

**Spec:** [`docs/specs/pricing-catalog-deepening.md`](../../specs/pricing-catalog-deepening.md)

**What to build:** Construir o módulo profundo `CampaignCatalog` (`in-process`) como fonte única da verdade para os Planos de Campanha (`single_campaign`, `pack_5_campaigns`, `pack_10_campaigns`), preços em centavos, formatação monetária BRL, direitos de uso/regeneração e suporte a override opcional por variável de ambiente (`CAMPAIGN_SINGLE_PRICE_CENTS`), além de evoluir o schema `orders` no Drizzle (`planId`) sem defaults mágicos cegos.

**Blocked by:** `None (can start immediately)`

**Status:** `completed`

## Acceptance Criteria (BDD)

- [x] **Given** o módulo `CampaignCatalog` (`src/lib/campaign-catalog.ts`), **When** um chamador consulta os planos disponíveis ou o plano padrão via `getDefaultCampaignPlan()`, **Then** retorna o plano `single_campaign` com `amountCents: 990`, `formattedPrice: "R$ 9,90"`, `priceParts` (`integerPart: "9"`, `decimalPart: "90"`, `formattedDecimal: "9,90"`), `campaignsCount: 1`, `maxPostPaymentRegenerations: 3`, `freePreviewGenerations: 1` e `isActiveInMvp: true`.
- [x] **Given** os pacotes previstos na Seção 4 do `PRD.md`, **When** `getCampaignPlanById("pack_5_campaigns")` ou `getCampaignPlanById("pack_10_campaigns")` é invocado, **Then** retorna respectivamente os planos de 5 campanhas (`2990` centavos / `"R$ 29,90"`) e 10 campanhas (`4990` centavos / `"R$ 49,90"`) com `isActiveInMvp: false`.
- [x] **Given** um override de preço configurado via variável de ambiente no servidor (`CAMPAIGN_SINGLE_PRICE_CENTS=1490` em `src/config/server-env.ts` ou injetado em `getDefaultCampaignPlan`), **When** o catálogo resolve o plano `single_campaign`, **Then** `amountCents` reflete `1490` e `formattedPrice` reflete `"R$ 14,90"`.
- [x] **Given** um `planId` desconhecido ou inválido, **When** `getCampaignPlanById` é chamado, **Then** lança um erro descritivo de domínio rejeitando o identificador inválido.
- [x] **Given** a definição de schema Drizzle em `src/server/db/schema/orders.ts`, **When** a tabela `orders` é inspecionada, **Then** possui a coluna `planId` (`plan_id`, `text`, `notNull`, default `"single_campaign"`) e as colunas `amountCents` de `orders` e `paymentCharges` exigem atribuição explícita do valor autoritativo resolvido pelo catálogo.
- [x] **Given** a suíte de testes unitários `src/lib/campaign-catalog.test.ts`, **When** `pnpm test` e `pnpm typecheck` são executados, **Then** todos os testes passam com zero erros de tipo ou lint.
