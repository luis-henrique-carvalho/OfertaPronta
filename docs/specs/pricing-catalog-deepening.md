# Spec: Aprofundamento de Precificação, Catálogo de Planos (`CampaignCatalog`) e Conciliação Dinâmica Pix

- **Slug**: `pricing-catalog-deepening`
- **Status**: `ready-for-agent`

## Problem Statement

Atualmente, a regra de precificação e os direitos comerciais de uma **Campanha (`Campaign`)** no **OfertaPronta** estão espalhados como números mágicos (`990` centavos) e textos estáticos (`"R$ 9,90"`, `"até 3 regenerações"`) por dezenas de arquivos entre o banco de dados (`orders.ts`), o módulo de checkout (`PixCheckoutService`) e múltiplos componentes visuais da Landing Page, da etapa de Prévia e da tela de Checkout Pix.

Essa dispersão viola a **Localidade (`Locality`)** e a **Alavancagem (`Leverage`)** da arquitetura de módulos profundos:
1. Qualquer ajuste promocional, teste de preço ou ativação dos pacotes previstos na Seção 4 do `PRD.md` (1 campanha por R$ 9,90, 5 campanhas por R$ 29,90, 10 campanhas por R$ 49,90) exige caçar e alterar literais em mais de 10 pontos da aplicação.
2. O `PixCheckoutService` valida cegamente `payload.value !== 990` no webhook e `remoteTx.valueCents === 990` na reconciliação ativa, além de reemitir cobranças expiradas sempre com `990`, ignorando o valor real (`charge.amountCents` / `order.amountCents`) congelado no **Pedido (`Order`)**.
3. A interface de usuário exibe valores fixos no JSX em vez de refletir dinamicamente o **Plano de Campanha (`Campaign Plan`)** ativo ou o `Frozen Snapshot` do pedido em andamento.

## Solution

Introduzir o módulo profundo **`CampaignCatalog`** como fonte única da verdade (*Single Source of Truth*) para os **Planos de Campanha (`Campaign Plan`)**, preços em centavos, formatação monetária BRL e direitos de uso/regeneração por IA, aprofundando simultaneamente o `PixCheckoutService` e os componentes visuais mobile-first:

1. **Módulo Profundo `CampaignCatalog` (`in-process` com override opcional de ambiente)**:
   - Modela os planos oficiais do `PRD.md`:
     - `single_campaign` (Campanha Avulsa — 1 campanha Feed+Story, padrão R$ 9,90 / `990` centavos, 3 regenerações pós-pagamento, ativo por padrão no MVP).
     - `pack_5_campaigns` (Pacote 5 Campanhas — padrão R$ 29,90 / `2990` centavos, 3 regenerações por campanha, preparado para ativação futura).
     - `pack_10_campaigns` (Pacote 10 Campanhas — padrão R$ 49,90 / `4990` centavos, 3 regenerações por campanha, preparado para ativação futura).
   - Permite override seguro no servidor via variáveis de ambiente opcionais (ex.: `CAMPAIGN_SINGLE_PRICE_CENTS`) para testes ou promoções rápidas sem necessidade de migração de banco de dados.
   - Expõe uma interface enxuta com alta alavancagem para resolução de plano, cálculo/formatação de preço (`R$ 9,90`, partes inteira/decimal para vitrine) e metadados de direitos (`maxPostPaymentRegenerations`, formatos incluídos).
2. **Conciliação Dinâmica e Imutabilidade no `PixCheckoutService`**:
   - Ao iniciar o checkout (`initiateCheckout`), o backend resolve o plano autoritativo via `CampaignCatalog` (default `single_campaign` quando omitido), grava `planId` e `amountCents` no `Order`, no `PaymentCharge` e dentro do `Frozen Snapshot` (junto com `maxPostPaymentRegenerations` e nome do plano).
   - O processamento do webhook (`handleWebhookPayment`) e a reconciliação ativa (`checkPaymentStatus`) validam estritamente o valor pago contra `charge.amountCents` (e `order.amountCents`), eliminando qualquer comparação com `990` chumbado.
   - A reemissão de cobrança expirada (`regenerateExpiredCharge`) utiliza `order.amountCents` preservado no pedido original.
3. **UI Mobile-First 100% Orientada ao Catálogo e ao Pedido**:
   - No fluxo pós-criação do pedido (`CheckoutView`, `OrderSummaryCard`, `PixCopiaEColaCard`, `PixQrCodeCard`), os componentes exibem exclusivamente o valor, o nome do plano e os direitos vindos de `details.amountCents` e `details.frozenSnapshot`.
   - Nas telas pré-pedido (`LandingHeroSection`, `LandingPricingSection`, `LandingStepsSection`, `PreviewCheckoutActionCard`, `AiQuotaExceededAlert`), os componentes consomem o plano padrão do `CampaignCatalog`, eliminando 100% das strings `"R$ 9,90"` hardcoded no JSX.
   - Conforme alinhado no Gate 0, o checkout do MVP permanece focado no plano avulso (`single_campaign`), mantendo os pacotes de 5 e 10 campanhas modelados no catálogo sem adicionar complexidade de carteira de créditos neste momento (YAGNI).

## User Stories

1. Como um **Microempresário (`Merchant`)** na Landing Page ou na Prévia do Card, quero visualizar o preço e os direitos da Campanha Avulsa sempre consistentes em todos os botões, alertas e seções de preço, para que eu tenha clareza total do valor que será cobrado no Pix.
2. Como um **Microempresário (`Merchant`)** na tela de Checkout Pix, quero que o Resumo do Pedido, as instruções do Pix Copia e Cola e o texto alternativo do QR Code reflitam exatamente o valor congelado no meu Pedido (`Order`), para que o valor conferido no aplicativo do meu banco seja idêntico ao informado na tela.
3. Como um **Microempresário (`Merchant`)** cujo QR Code Pix expirou após 30 minutos, quero gerar um novo QR Code pelo mesmo valor congelado no momento em que criei meu Pedido (`order.amountCents`), mesmo que o preço de tabela do catálogo mude posteriormente, para que minha oferta contratada seja respeitada.
4. Como o **Sistema de Pagamentos (`PixCheckoutService`)**, quero validar o valor recebido no webhook da Pushin Pay e no polling ativo contra o `charge.amountCents` registrado no banco para aquela cobrança específica, para que pedidos de qualquer plano ou preço promocional sejam conciliados com segurança anti-spoofing sem depender de constantes mágicas.
5. Como o **Administrador / Operador do Produto**, quero poder sobrescrever opcionalmente o preço em centavos do plano via variável de ambiente no servidor (ex.: `CAMPAIGN_SINGLE_PRICE_CENTS`), para realizar testes de elasticidade de preço ou campanhas relâmpago sem precisar alterar código ou fazer migrações SQL.
6. Como um **Desenvolvedor / Mantenedor**, quero que os pacotes de 5 campanhas (R$ 29,90) e 10 campanhas (R$ 49,90) previstos no `PRD.md` já estejam tipados e testados no `CampaignCatalog`, para que sua futura ativação comercial não exija refatorar o motor de checkout nem os componentes de interface.

## Implementation Decisions

### 1. Módulo Profundo `CampaignCatalog`
- **Localização**: `src/lib/campaign-catalog.ts` (ou exportado de forma isomórfica segura para consumo de metadados/formatação no cliente e resolução autoritativa com suporte a override de ambiente no servidor).
- **Planos Modelados (`CampaignPlanId`)**:
  - `"single_campaign"`: 1 Campanha (Feed 1080×1350 + Story 1080×1920), `defaultAmountCents: 990`, `campaignsCount: 1`, `maxPostPaymentRegenerations: 3`, `freePreviewGenerations: 1`, `isActiveInMvp: true`.
  - `"pack_5_campaigns"`: Pacote 5 Campanhas, `defaultAmountCents: 2990`, `campaignsCount: 5`, `maxPostPaymentRegenerations: 3`, `freePreviewGenerations: 1`, `isActiveInMvp: false`.
  - `"pack_10_campaigns"`: Pacote 10 Campanhas, `defaultAmountCents: 4990`, `campaignsCount: 10`, `maxPostPaymentRegenerations: 3`, `freePreviewGenerations: 1`, `isActiveInMvp: false`.
- **Interface Concisa (`Depth` & `Leverage`)**:
  - `getDefaultCampaignPlan(envOverrides?)`: retorna o plano padrão ativo (`single_campaign`) já com preço resolvido (`amountCents`), preço formatado (`formattedPrice`, ex.: `"R$ 9,90"`), partes de exibição (`priceParts: { currencySymbol: "R$", integerPart: "9", decimalPart: "90", formattedDecimal: "9,90" }`) e direitos (`maxPostPaymentRegenerations`, `formatsLabel`).
  - `getCampaignPlanById(planId, envOverrides?)`: resolve qualquer `CampaignPlanId` válido ou lança erro de domínio se o `planId` for desconhecido.
  - `formatPlanPrice(amountCents)` / reutilização de `formatBRL(amountCents)` em `src/lib/utils.ts`: garante formatação monetária determinística (`R$ X,XX`) em todo o codebase.
- **Override Opcional por Variável de Ambiente**:
  - Em `src/config/server-env.ts`, adicionar suporte opcional a `CAMPAIGN_SINGLE_PRICE_CENTS` (inteiro positivo). Quando definido no ambiente de execução do servidor, `CampaignCatalog` utiliza esse valor para `single_campaign`.

### 2. Schema de Pedidos (`src/server/db/schema/orders.ts`) e Contratos Zod (`checkout.schemas.ts`)
- Adicionar coluna `planId: text("plan_id").notNull().default("single_campaign")` na tabela `orders` para rastrear explicitamente qual **Plano de Campanha (`Campaign Plan`)** originou o pedido.
- Remover os `.default(990)` mágicos ou torná-los explicitamente derivados da criação autoritativa no serviço, garantindo que `orders.amountCents` e `paymentCharges.amountCents` recebam sempre o valor resolvido pelo `CampaignCatalog` no momento da compra.
- No `initiateCheckoutSchema` (`src/features/checkout/data/checkout.schemas.ts`), aceitar `planId: campaignPlanIdSchema.optional().default("single_campaign")` (O cliente nunca envia `amountCents`; envia no máximo o identificador do plano, cujo preço é resolvido exclusivamente no backend).
- No `Frozen Snapshot` (`buildFrozenSnapshot`), congelar além dos dados do rascunho:
  - `planId`: ID do plano contratado (`"single_campaign"`).
  - `planName`: Nome comercial do plano (`"Campanha Avulsa"`).
  - `amountCents`: Valor autoritativo em centavos congelado no ato do pedido.
  - `maxPostPaymentRegenerations`: Cota de regenerações pós-pagamento congelada para o pedido (`3`).

### 3. Aprofundamento do `PixCheckoutService`
- **`initiateCheckout`**:
  - Resolve o plano via `CampaignCatalog` (`getCampaignPlanById(validated.planId ?? "single_campaign")`).
  - Verifica se o plano está ativo para compra (`plan.isActiveInMvp`); caso alguém tente iniciar checkout de um plano ainda inativo no MVP, rejeita com erro claro de domínio.
  - Emite cobrança na Pushin Pay com `valueCents: plan.amountCents`.
  - Persiste `planId: plan.id` e `amountCents: plan.amountCents` em `orders` e `amountCents: plan.amountCents` em `paymentCharges`.
- **`handleWebhookPayment`**:
  - Substitui `if (Number(payload.value) !== 990)` por validação contra o valor real da cobrança persistida: `if (Number(payload.value) !== charge.amountCents)`, lançando erro com o valor esperado real (`charge.amountCents`).
- **`checkPaymentStatus`**:
  - Na reconciliação ativa com a Pushin Pay, substitui `remoteTx.valueCents === 990` por `remoteTx.valueCents === charge.amountCents`.
- **`regenerateExpiredCharge`**:
  - Emite a nova cobrança na Pushin Pay usando `valueCents: order.amountCents` (respeitando o preço congelado no `Order`) e grava `amountCents: order.amountCents` no novo registro de `paymentCharges`.

### 4. Desacoplamento de Preços na UI Mobile-First
- **Componentes orientados ao Pedido (`Order` / `CheckoutDetailsResult`)**:
  - `OrderSummaryCard`: recebe `amountCents` obrigatório (ou vindo do pedido), `planName` e `maxRegenerations` opcionais derivados do snapshot/catálogo, usando `formatBRL(amountCents)`.
  - `PixCopiaEColaCard`: recebe `amountCents: number` como prop e exibe `formatBRL(amountCents)` no passo 3 das instruções bancárias.
  - `PixQrCodeCard`: recebe `amountCents: number` como prop e interpola `formatBRL(amountCents)` no atributo `alt` de acessibilidade da imagem do QR Code.
  - `CheckoutView`: repassa `details.amountCents` para `OrderSummaryCard`, `PixCopiaEColaCard` e `PixQrCodeCard`.
- **Componentes orientados ao Plano Padrão do Catálogo (`CampaignCatalog`)**:
  - `PreviewCheckoutActionCard`: consome o plano padrão do `CampaignCatalog` (ou recebe prop opcional com default do catálogo) para exibir o preço formatado (`formattedPrice`) e os formatos incluídos, sem literais `"R$ 9,90"` fixos.
  - `AiQuotaExceededAlert`: consome `formattedPrice` e `maxPostPaymentRegenerations` do plano padrão do `CampaignCatalog`.
  - `LandingHeroSection`, `LandingPricingSection` e `LandingStepsSection`: consomem os metadados e preços formatados do plano padrão do `CampaignCatalog` (`formattedPrice`, `priceParts.formattedDecimal`, `maxPostPaymentRegenerations`).

## Testing Decisions

- **A Interface é a Superfície de Teste**:
  - Testar o módulo profundo `CampaignCatalog` diretamente através de sua interface pública (`src/lib/campaign-catalog.test.ts`), cobrindo resolução dos 3 planos (`single_campaign`, `pack_5_campaigns`, `pack_10_campaigns`), formatação BRL, partes inteira/decimal, override via configuração/env e rejeição de `planId` inválido.
  - Testar o `PixCheckoutService` em `src/features/checkout/server/services/pix-checkout.service.test.ts` usando banco in-memory (`pg-mem` / PGlite conforme prior art existente) e fake do gateway Pushin Pay:
    - Garantir que `initiateCheckout` congela `planId`, `amountCents` e `maxPostPaymentRegenerations` no `Order` e `Frozen Snapshot`.
    - Garantir que `handleWebhookPayment`, `checkPaymentStatus` e `regenerateExpiredCharge` conciliam contra `charge.amountCents` / `order.amountCents` tanto para o preço padrão (`990`) quanto para preços customizados/promocionais (ex.: `1490` ou `2990`), rejeitando divergências reais.
  - Testar os componentes visuais (`checkout-view.test.tsx`, `offer-brief-wizard.test.tsx`) verificando que a renderização reflete dinamicamente o `amountCents` fornecido no pedido e os dados do catálogo.

## Out of Scope

- **Carteira de Créditos Multi-Campanha e Login**: A gestão de saldo de créditos para abatimento gradual de 5 ou 10 campanhas ao longo do tempo (Fase 3 do Roadmap no `PRD.md`) está explicitamente fora de escopo (YAGNI). Os planos `pack_5_campaigns` e `pack_10_campaigns` ficam modelados no `CampaignCatalog` com `isActiveInMvp: false`.
- **Tabela de Planos no PostgreSQL e Painel Admin de Preços**: Não será criada tabela SQL para catálogo de planos nem CRUD administrativo; o catálogo reside in-process com suporte a override via variável de ambiente.

## Further Notes

- Referências:
  - [`PRD.md`](../../PRD.md) — Seção 4 (Monetização: 1 campanha = R$ 9,90; 5 campanhas = R$ 29,90; 10 campanhas = R$ 49,90) e Seção 6 (Preços Autoritativos no Backend e Política de Cotas).
  - [`GLOSSARY.md`](../../GLOSSARY.md) — Definições canônicas de `Campaign Catalog`, `Campaign Plan`, `Campaign`, `Frozen Snapshot`, `Order` e `Payment Charge`.
