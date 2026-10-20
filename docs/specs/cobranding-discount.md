# Spec: Desconto de Co-Branding / Assinatura de Marca no Checkout

- **Slug**: `cobranding-discount`
- **Status**: `ready-for-agent`

## Problem Statement

Microempresários de comércio local (supermercados, salões, barbearias, pizzarias, hamburguerias, restaurantes) são extremamente sensíveis a preço no momento da conversão final e buscam maximizar o retorno de cada centavo investido na criação dos seus anúncios. Ao mesmo tempo, o **OfertaPronta** precisa acelerar sua aquisição orgânica de clientes sem depender exclusivamente de tráfego pago, alavancando os próprios cards gerados pela ferramenta como vitrines de atração para outros comerciantes que visualizam as peças nas redes sociais e no WhatsApp (Product-Led Growth - PLG).

Atualmente:
1. O checkout possui apenas o preço padrão da Campanha Avulsa (R$ 9,90), sem uma alavanca promocional com contrapartida de crescimento viral.
2. Os cards publicitários em alta resolução exportados após a compra saem 100% anônimos, perdendo a oportunidade de alcançar outros empresários locais que visualizam o anúncio publicado no Feed e nos Stories do Instagram.
3. Não há mecanismo para o comerciante optar livremente por um desconto em troca de apoiar a divulgação da ferramenta com uma assinatura sutil e profissional.

## Solution

Introduzir a funcionalidade de **Desconto de Co-Branding / Assinatura de Marca** na tela de Checkout Pix (`checkout.$orderId.tsx`).

O comerciante visualiza um card promocional opcional e transparente:
- **Proposta:** Ao ativar o switch de co-branding, o comerciante recebe um desconto imediato (padrão de 30%, reduzindo o valor de R$ 9,90 para **R$ 6,93**, com economia visível de R$ 2,97).
- **Contrapartida:** A arte final (nos formatos Feed 1080×1350 e Story 1080×1920) recebe uma assinatura discreta, elegante e profissional no canto inferior: `"Design por @ofertapronta"` (ou texto configurado no servidor).
- **Recálculo Reativo do Pix:** Ao acionar o toggle, o backend recalcula o valor da cobrança Pix de forma atômica e autoritativa, emitindo uma nova cobrança instantânea na Pushin Pay e atualizando o QR Code e o código Copia e Cola na tela do comerciante em tempo real.
- **Renderização Vetorial Determinística:** A assinatura de marca **NUNCA** é gerada pela IA do Gemini (evitando alucinações, artefatos ou fontes distorcidas). Ela é aplicada diretamente pelo módulo profundo `ExportEngine` (`image-processor.ts`) utilizando SVG vetorial com Sharp, garantindo contraste, legibilidade e proporção visual ideais tanto sobre fundos claros quanto escuros.
- **Congelamento e Integridade:** A decisão de co-branding é congelada no `orders.frozenSnapshot` e nas colunas `cobrandingAccepted` e `cobrandingCreditText` da tabela `orders`. Caso o comerciante solicite até 3 regenerações por IA pós-pagamento, as novas versões continuam recebendo obrigatoriamente a assinatura de marca contratada.
- **Zero Bloat de Admin (YAGNI/Ponytail):** Sem telas de administração ou banco dinâmico para regras de desconto. A promoção é totalmente governada via variáveis de ambiente no servidor (`COBRANDING_PROMOTION_ENABLED`, `COBRANDING_CREDIT_TEXT`, `COBRANDING_DISCOUNT_PERCENT`).

---

## User Stories

### Happy Paths (Jornada Principal)

1. **Visualização da Oferta de Co-Branding no Checkout:**
   - *Como um* **Microempresário (`Merchant`)** na tela de checkout Pix,
   - *quero* visualizar com clareza a opção de obter 30% de desconto em troca da inclusão de uma assinatura discreta no rodapé do meu card,
   - *para que* eu possa avaliar a economia financeira antes de realizar o pagamento.

2. **Ativação do Desconto e Atualização Dinâmica do Pix:**
   - *Como um* **Microempresário (`Merchant`)**,
   - *quero* ativar o botão/switch de co-branding e ver o valor do pedido ser reduzido imediatamente de R$ 9,90 para R$ 6,93 no Resumo do Pedido, no QR Code Pix e no código Copia e Cola,
   - *para que* eu pague exatamente o valor promocional com total comodidade.

3. **Prévia Visual da Assinatura no Showcase:**
   - *Como um* **Microempresário (`Merchant`)**,
   - *quero* que o card de visualização do anúncio (`AdCardCheckoutShowcase`) exiba uma indicação visual sutil de onde e como a assinatura `"Design por @ofertapronta"` será posicionada,
   - *para que* eu tenha certeza de que ela não irá cobrir o preço, telefone ou informações críticas da minha oferta.

4. **Desativação do Desconto (Reversão para Preço Normal):**
   - *Como um* **Microempresário (`Merchant`)**,
   - *quero* poder desativar o switch de co-branding a qualquer momento antes do pagamento caso decida que prefiro minha arte 100% limpa,
   - *para que* o sistema restaure a cobrança original de R$ 9,90 com novo QR Code e código Copia e Cola.

5. **Exportação dos Arquivos com Assinatura após Pagamento com Desconto:**
   - *Como um* **Microempresário (`Merchant`)** que pagou o pedido com desconto de co-branding ativado,
   - *quero* baixar meus arquivos em alta resolução (Feed 1080×1350 e Story 1080×1920) contendo a assinatura vetorial limpa no rodapé,
   - *para que* eu possa postar o anúncio nas minhas redes sociais e no WhatsApp.

6. **Exportação dos Arquivos Sem Assinatura após Pagamento Normal:**
   - *Como um* **Microempresário (`Merchant`)** que optou por não ativar o desconto de co-branding,
   - *quero* receber meus arquivos finais 100% livres de qualquer assinatura ou marca do OfertaPronta,
   - *para que* minha arte seja estritamente personalizada para o meu negócio.

### Edge Cases, Concorrência e Resiliência

7. **Preservação do Co-Branding em Regenerações Pós-Pagamento:**
   - *Como o* **Sistema de Entrega (`PostPaymentRegenerationService`)**,
   - *quero* verificar o status de `order.cobrandingAccepted` ao derivar novos formatos gerados pelas regenerações permitidas por IA,
   - *para que* novas artes geradas pós-compra continuem recebendo a assinatura de marca contratada pelo desconto.

8. **Reemissão de Cobrança Pix Expirada:**
   - *Como um* **Microempresário (`Merchant`)** cujo Pix expirou (>30 minutos),
   - *quero* que a reemissão do Pix mantenha o mesmo valor promocional de R$ 6,93 (se o desconto estava ativo no pedido),
   - *para que* eu não perca o desconto já configurado.

9. **Bloqueio de Alteração em Pedido Já Pago:**
   - *Como o* **Módulo de Checkout (`PixCheckoutService`)**,
   - *quero* rejeitar qualquer tentativa de alterar a opção de co-branding se o pedido já estiver com status `PAID`,
   - *para que* o valor acordado e a composição visual do pedido permaneçam imutáveis.

10. **Desativação Global pelo Administrador via `.env`:**
    - *Como o* **Administrador do Sistema**,
    - *quero* desativar a promoção definindo `COBRANDING_PROMOTION_ENABLED=false` no `.env`,
    - *para que* nenhum novo checkout exiba o card de desconto, enquanto pedidos anteriores já criados ou pagos mantenham sua integridade histórica no banco.

---

## Implementation Decisions

### 1. Configurações de Ambiente (`src/config/server-env.ts`)
Adicionar variáveis de configuração server-only validadas via Zod:
```typescript
COBRANDING_PROMOTION_ENABLED: z.coerce.boolean().default(true),
COBRANDING_CREDIT_TEXT: z.string().default("Design por @ofertapronta"),
COBRANDING_DISCOUNT_PERCENT: z.coerce.number().int().min(1).max(90).default(30),
```

### 2. Módulo de Catálogo e Precificação (`src/lib/campaign-catalog.ts`)
- Estender o `CampaignCatalog` com utilitários puros de cálculo e resolução de co-branding:
  ```typescript
  export interface CobrandingPriceCalculation {
    originalAmountCents: number;
    discountAmountCents: number;
    amountCents: number;
    discountPercent: number;
    formattedOriginalPrice: string;
    formattedDiscountedPrice: string;
    formattedSavings: string;
  }

  export function calculateCobrandingPrice(
    baseAmountCents: number,
    discountPercent: number = 30,
  ): CobrandingPriceCalculation;
  ```
- **Regra de Arredondamento Financeiro**: O desconto em centavos é calculado com `Math.round(baseAmountCents * (discountPercent / 100))`. Para o preço base de 990 centavos com 30% de desconto:
  - Desconto: `round(990 * 0.3) = 297` centavos (R$ 2,97).
  - Preço final com desconto: `990 - 297 = 693` centavos (R$ 6,93).

### 3. Schema Drizzle (`src/server/db/schema/orders.ts`)
- Adicionar colunas transacionais na tabela `orders`:
  ```typescript
  cobrandingAccepted: boolean("cobranding_accepted").notNull().default(false),
  cobrandingCreditText: text("cobranding_credit_text"),
  ```
- No `frozenSnapshot` do pedido, incluir os campos imutáveis:
  - `cobrandingAccepted: boolean`
  - `cobrandingDiscountPercent: number | null`
  - `cobrandingCreditText: string | null`
  - `originalAmountCents: number`

### 4. Contratos RPC e Server Functions (`src/features/checkout/`)
- Adicionar schema e tipo em `src/features/checkout/data/checkout.schemas.ts`:
  ```typescript
  export const updateOrderCobrandingSchema = z.object({
    orderId: z.string().uuid("orderId deve ser um UUID válido"),
    cobrandingAccepted: z.boolean(),
  });
  export type UpdateOrderCobrandingInput = z.infer<typeof updateOrderCobrandingSchema>;
  ```
- Enriquecer `checkoutDetailsOutputSchema`:
  - `cobrandingAccepted: z.boolean().default(false)`
  - `cobrandingPromotionAvailable: z.boolean().default(true)`
  - `cobrandingCreditText: z.string().optional()`
  - `cobrandingDiscountPercent: z.number().int().default(30)`
  - `originalAmountCents: z.number().int().optional()`
- Criar Server Function RPC em `checkout.functions.ts`:
  - `updateOrderCobrandingFn`: método `POST`, recebe `UpdateOrderCobrandingInput` e retorna `CheckoutDetailsResult`.

### 5. Lógica de Checkout (`src/features/checkout/server/services/pix-checkout.service.ts`)
- Implementar o método `updateOrderCobranding(orderId: string, cobrandingAccepted: boolean)`:
  1. Localiza o pedido no banco. Se não existir, erro 404.
  2. Valida status: se `order.status === "PAID"`, lança erro `ORDER_ALREADY_PAID`.
  3. Se `cobrandingAccepted` for igual ao valor atual do pedido, retorna os detalhes atuais (idempotente).
  4. Se `cobrandingAccepted === true`:
     - Verifica se `serverEnv.COBRANDING_PROMOTION_ENABLED` está ativo. Se falso, rejeita com `PROMOTION_DISABLED`.
     - Calcula `amountCents` com desconto a partir do preço base original do plano (`originalAmountCents`).
     - Define `creditText = serverEnv.COBRANDING_CREDIT_TEXT`.
  5. Se `cobrandingAccepted === false`:
     - Restaura `amountCents` para o preço integral original.
     - Define `creditText = null`.
  6. Emite nova cobrança na Pushin Pay com o novo `amountCents`.
  7. Em transação atômica Drizzle:
     - Marca as cobranças `PENDING` anteriores deste pedido como `EXPIRED` ou canceladas.
     - Insere novo registro em `paymentCharges` com o novo `amountCents` e novo `txId`.
     - Atualiza `orders`: `amountCents`, `cobrandingAccepted`, `cobrandingCreditText`, `frozenSnapshot` e `updatedAt`.
  8. Retorna o `CheckoutDetailsResult` completo atualizado para o frontend.

### 6. Processamento Visual no Módulo Profundo `ExportEngine` (`src/server/export-engine/`)
- Adicionar interface e função em `image-processor.ts`:
  ```typescript
  export interface CobrandingOptions {
    creditText: string;
    aspectRatio?: "feed" | "story";
  }

  export async function applyCobrandingSignature(
    imageBuffer: Buffer,
    options: CobrandingOptions,
  ): Promise<Buffer>;
  ```
- **Especificação da Composição Vetorial**:
  - Renderizado via SVG composto em camada com Sharp.
  - Posição no Feed (1080×1350):
    - Alinhado no rodapé inferior central ou inferior direito: `y = 1315`, `x = 540` (centralizado) ou margem direita de 40px.
    - Margem de segurança de pelo menos 35px das bordas para evitar corte em telas móveis e carrosséis.
  - Posição no Story (1080×1920):
    - Posicionado em `y = 1840` (acima da barra de resposta do Instagram Stories, que ocupa os 120px inferiores).
  - Tipografia e Contraste:
    - Fonte: `Inter, -apple-system, system-ui, sans-serif`.
    - Tamanho: 22px a 24px no Feed / 24px a 26px no Story.
    - Peso: Medium (`font-weight="500"`).
    - Cor: Branco com opacidade de 80% (`rgba(255, 255, 255, 0.85)`) com drop shadow escuro sutil (`filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.75))"`) ou container pill semitransparente (`background: rgba(0, 0, 0, 0.45)` com cantos arredondados de 12px e padding horizontal de 14px e vertical de 6px), garantindo legibilidade perfeita independente de a arte ter fundo preto, branco ou colorido.

### 7. Integração no `DeliveryService` e `PostPaymentRegenerationService`
- Em `DeliveryService.deriveAndPersistFormats`:
  - Se `order.cobrandingAccepted === true` e houver `creditText`:
    - Aplica `applyCobrandingSignature` nos buffers gerados de Feed e Story antes de persistir em `deliveryExports`.
- Em `PostPaymentRegenerationService.regenerateCleanArt`:
  - Respeita `order.cobrandingAccepted` ao entregar a nova versão regenerada com IA, aplicando a mesma assinatura na arte final.

### 8. Frontend Mobile-First na Tela de Checkout (`src/features/checkout/`)
- Criar o componente `CobrandingDiscountCard` (`src/features/checkout/components/cobranding-discount-card.tsx`):
  - Design system mobile-first com shadcn/ui (`Card`, `Switch`, `Badge`, `Typography`).
  - Badge em destaque: `"Economize R$ 2,97"` ou `"30% OFF"`.
  - Headline convidativo: `"Ativar Desconto com Assinatura"`.
  - Subtexto explicativo: `"Adicione uma assinatura discreta 'Design por @ofertapronta' no rodapé da sua arte e pague apenas R$ 6,93."`.
  - Switch interativo com estado de loading otimista e desabilitação durante a troca de cobrança Pix.
- Atualizar a `CheckoutView` (`src/features/checkout/views/checkout-view.tsx`):
  - Posicionar `CobrandingDiscountCard` diretamente abaixo do `AdCardCheckoutShowcase` e acima do `UnifiedPixPaymentCard`.
  - Conectar ao hook `usePixCheckout` com método `toggleCobranding(accepted: boolean)`.
  - Refletir o valor atualizado no `AdCardCheckoutShowcase` e no `UnifiedPixPaymentCard`.
- Atualizar o `AdCardCheckoutShowcase` (`src/features/checkout/components/ad-card-checkout-showcase.tsx`):
  - Quando `cobrandingAccepted` estiver ativo, renderizar um badge ou mock da assinatura sutil no rodapé da imagem de prévia, demonstrando a discrição do crédito.

---

## Testing Decisions

- **Superfície de Teste nos Limites da Interface Pública**:
  - Testar `calculateCobrandingPrice` diretamente no `campaign-catalog.test.ts`: cálculos de 30%, arredondamentos e formatações monetárias.
  - Testar `updateOrderCobranding` em `pix-checkout.service.test.ts`:
    - Alternar para `true`: reduz `amountCents` para 693, atualiza colunas, emite nova cobrança na Pushin Pay e expira a anterior.
    - Alternar para `false`: restaura `amountCents` para 990, remove `cobrandingCreditText` e emite nova cobrança de valor cheio.
    - Tentativa de alteração com pedido `PAID`: lança erro de domínio `ORDER_ALREADY_PAID`.
    - Tentativa de ativação quando `COBRANDING_PROMOTION_ENABLED=false`: rejeita com erro `PROMOTION_DISABLED`.
  - Testar `applyCobrandingSignature` em `image-processor.test.ts`:
    - Verifica que o buffer gerado preserva dimensões exatas (1080×1350 no Feed e 1080×1920 no Story).
    - Valida que a assinatura não corrompe a imagem.
  - Testar `DeliveryService` e `PostPaymentRegenerationService`:
    - Pedido com `cobrandingAccepted: true` invoca a aplicação da assinatura no export final.
    - Pedido com `cobrandingAccepted: false` gera arquivos limpos sem assinatura.
  - Testar componentes frontend (`cobranding-discount-card.test.tsx` e `checkout-view.test.tsx`):
    - Renderização inicial respeitando o estado do pedido.
    - Disparo do evento ao alternar o switch.
    - Exibição acessível das informações de preço e economia.

---

## Out of Scope (YAGNI)

- Criar tela administrativa para editar textos ou percentuais de desconto em tempo de execução (as variáveis de ambiente do servidor são suficientes para o MVP).
- Permitir ao microempresário customizar o texto ou posição da assinatura (o OfertaPronta determina o formato e local para garantir padrão estético).
- Sistema genérico de cupons de desconto manuais (códigos promocionais digitados).
- Integração da assinatura de marca via prompt do Gemini (proibido; o Gemini alucina texto; a assinatura é 100% vetorial via Sharp/SVG).
- Desconto aplicável a pacotes futuros de 5 ou 10 campanhas neste momento (o foco é a Campanha Avulsa de R$ 9,90).

---

## Further Notes

- Alinhado com o princípio de crescimento sustentável e Product-Led Growth (PLG) documentado no `PRD.md`.
- Respeita o vocabulário canônico do `GLOSSARY.md` (`Merchant`, `Ad Card`, `Campaign Plan`, `Order`, `Payment Charge`, `Export`, `Frozen Snapshot`).
- Cumpre as regras de isolamento de código cliente/servidor e a arquitetura de **Módulos Profundos** descrita no `AGENTS.md`.
