# Spec: Reset de Cota de Prévias Gratuitas na Confirmação de Pagamento

- **Slug**: `reset-preview-quota-on-payment`
- **Status**: `ready-for-agent`

## Problem Statement

Atualmente, o visitante do OfertaPronta possui uma cota de 2 prévias gratuitas por dia/janela de 24h registradas no `free_preview_ledger`. Quando ele cria um card publicitário, visualiza a prévia com marca d'água e avança para a compra efetuando o pagamento Pix (R$ 9,90), seu pedido é liberado para download em alta resolução (`/pedido/$orderId`) com 3 regenerações de IA pós-pagamento.

Entretanto, se esse mesmo cliente que acabou de pagar quiser criar uma nova campanha para outro produto da sua loja ou outro negócio imediatamente (clicando em "Nova Oferta" na barra de entrega ou voltando para `/criar`), ele encontra a cota de prévias bloqueada ("Você já utilizou suas 2 prévias grátis de hoje para este navegador"). Isso pune o cliente que converteu e quebra o incentivo imediato de recompra. O microempresário pagante deve ser recompensado: o pagamento de um pedido deve restaurar integralmente o contador de prévias gratuitas daquele visitante para novas criações.

## Solution

1. **Recompensa de Conversão & Desbloqueio Imediato**:
   - Assim que o pedido atinge o estado `PAID` (seja por webhook Pix da Pushin Pay em `handleWebhookPayment`, reconciliação ativa em `checkPaymentStatus` ou simulação de teste em `simulateDevPayment`), o sistema executa o reset da cota gratuita associada ao visitante que originou o pedido.
2. **Associação Segura via `draftId` no `free_preview_ledger`**:
   - O pedido (`orders`) possui o campo `draftId` apontando para o draft que gerou a compra.
   - O `free_preview_ledger` possui o vínculo `(draft_id, visitor_id)`.
   - Ao confirmar o pagamento de um pedido, o sistema localiza o `visitor_id` no ledger através do `draftId` do pedido.
   - Se o visitante for identificado, todas as linhas ativas (`RESERVED` ou `CONSUMED`) daquele visitante são transicionadas para um estado arquivado/recompensado: `RESET_BY_PURCHASE`.
3. **Preservação de Auditoria & Não Degradação Histórica**:
   - Nenhuma linha é deletada do banco de dados (`DELETE FROM`). A integridade histórica de auditoria, custos e métricas é 100% mantida.
   - Apenas o status da linha é alterado para `RESET_BY_PURCHASE`.
   - As consultas de cota (`checkQuotaLimits` e `getQuotaStatus`) consideram ativas apenas `CONSUMED` e `RESERVED` não expiradas; portanto, linhas com status `RESET_BY_PURCHASE` deixam de consumir a cota de 2 prévias do visitante, liberando imediatamente o saldo total (2 vagas) para novos drafts.
4. **Escopo Estrito do Reset (Visitante Pagante)**:
   - O reset é aplicado estritamente ao `visitor_id` pagante. Ele NÃO zera o consumo de outros visitantes que porventura compartilhem o mesmo IP (ex: rede Wi-Fi/CGNAT), evitando que um único pagamento abra brecha para abuso de terceiros no mesmo IP.
   - Contudo, para que o visitante pagante não seja bloqueado pela cota de IP do seu próprio roteador após pagar, as entradas do próprio visitante pagante deixam de somar no contador de IP, ou a cota de IP para aquele visitante pagante tem o peso das prévias pagas deduzido (na prática, ao marcar como `RESET_BY_PURCHASE`, a condição ativa `eq(status, 'CONSUMED') | eq(status, 'RESERVED')` já desconsidera essas linhas para a contagem, liberando a folga no IP referente àquele usuário).
5. **Independência dos Direitos Pós-Compra**:
   - O pedido atual mantém intacto seu direito a até 3 regenerações de IA em `/pedido/$orderId`.
   - O visitante ganha simultaneamente a restauração de suas 2 prévias grátis em `/criar` para testar sua próxima oferta.
6. **Experiência Visual e Reatividade no Frontend**:
   - Na tela de entrega (`/pedido/$orderId`), o botão "Nova Oferta" ou um aviso sutil/toast indica que novas prévias grátis estão disponíveis para uma nova campanha.
   - Ao acessar `/criar`, o hook `usePreviewQuota` (via chave de query `free-preview-quota`) reflete automaticamente as 2 prévias disponíveis sem exibir avisos de bloqueio remanescentes.

## User Stories

1. **Como microempresário que acabou de pagar meu card via Pix**, quero que minha cota de prévias grátis seja imediatamente restaurada, para que eu possa criar outro anúncio para outro produto da minha loja sem esperar 24 horas.
2. **Como cliente na tela de entrega pós-pagamento**, quero clicar em "Nova Oferta" e encontrar o formulário pronto para gerar um novo card com 2 prévias disponíveis, para manter a produtividade do meu negócio em alta.
3. **Como gestor financeiro do produto**, quero que o histórico de consumo de IA não seja apagado do banco ao resetar a cota, para que eu continue auditando o custo total e o ROI das campanhas.
4. **Como gestor de segurança**, quero que o reset seja associado exclusivamente ao visitante pagante via `draftId`, para que usuários não pagantes na mesma rede (mesmo IP) não ganhem prévias gratuitas indevidamente.
5. **Como sistema de pagamento**, quero que notificações de webhook duplicadas ou chamadas repetidas de polling sejam estritamente idempotentes, sem disparar resets redundantes ou corromper o estado do banco.
6. **Como cliente que pagou**, quero que o reset de prévias não interfira nem consuma as 3 regenerações de IA já garantidas no meu pedido atual em `/pedido/$orderId`.
7. **Como desenvolvedor em ambiente de teste/dev**, quero que `simulateDevPayment` também execute o reset da cota de prévias, facilitando os testes automatizados e o fluxo manual ponta a ponta.

## Implementation Decisions

### 1. Novo Status no Domínio do Ledger: `RESET_BY_PURCHASE`
- No schema Drizzle `freePreviewLedger` (`src/server/db/schema/free-preview.ts`), o campo `status` agora aceita:
  `'RESERVED' | 'CONSUMED' | 'FAILED' | 'RESET_BY_PURCHASE'`
- Linhas com `RESET_BY_PURCHASE` têm `settledAt` atualizado com o timestamp do pagamento (`now`).
- Como a cláusula `activeCondition` em `checkQuotaLimits` e `getQuotaStatus` verifica estritamente:
  ```ts
  const activeCondition = or(
    eq(freePreviewLedger.status, "CONSUMED"),
    and(
      eq(freePreviewLedger.status, "RESERVED"),
      gt(freePreviewLedger.reservedAt, reservationExpiryCutoff),
    ),
  );
  ```
  Ao transicionar as linhas para `RESET_BY_PURCHASE`, tanto a cota do visitante quanto a cota agregada por IP e o teto global (se aplicável) deixam de contabilizar as prévias antigas já convertidas, restaurando a capacidade do cliente pagante.

### 2. Deep Module `FreePreviewQuota`: Nova Função de Domínio `resetVisitorQuotaOnPayment`
- Adicionada ao serviço profundo `src/features/promotions/server/services/free-preview-quota.service.ts`:
  ```ts
  export interface ResetVisitorQuotaInput {
    draftId: string;
    now?: Date;
  }

  export interface ResetVisitorQuotaResult {
    resetCount: number;
    visitorId: string | null;
  }

  export async function resetVisitorQuotaOnPayment(
    input: ResetVisitorQuotaInput,
    database: AppDatabase = db,
  ): Promise<ResetVisitorQuotaResult>
  ```
- **Comportamento Interno**:
  1. Busca no `freePreviewLedger` a linha correspondente ao `draftId` fornecido (ordenando por `reservedAt` descendente).
  2. Se nenhuma linha for encontrada para o `draftId`, retorna `{ resetCount: 0, visitorId: null }` de forma segura (sem lançar exceção).
  3. Com o `visitorId` em mãos, executa uma atualização atômica de todas as linhas daquele `visitorId` com status `CONSUMED` ou `RESERVED`:
     ```ts
     await tx
       .update(freePreviewLedger)
       .set({
         status: "RESET_BY_PURCHASE",
         settledAt: now,
       })
       .where(
         and(
           eq(freePreviewLedger.visitorId, visitorId),
           or(
             eq(freePreviewLedger.status, "CONSUMED"),
             eq(freePreviewLedger.status, "RESERVED"),
           ),
         ),
       );
     ```
  4. Registra log estruturado de negócio (`log.info("Cota de prévias do visitante resetada por pagamento", { visitorId, draftId, resetCount })`).

### 3. Integração no Ponto Único de Liquidação de Pedidos (`PixCheckoutService`)
- No método privado `markOrderAndChargePaid` de `src/features/checkout/server/services/pix-checkout.service.ts`:
  - Após atualizar `orders.status = "PAID"` e `paymentCharges.status = "PAID"`, recupera o `order.draftId`.
  - Se `order.draftId` estiver presente, invoca `resetVisitorQuotaOnPayment({ draftId: order.draftId, now })`.
  - Esta execução ocorre dentro do fluxo transacional ou logo após a confirmação do pagamento, garantindo que qualquer canal de confirmação (Webhook Pushin Pay, Reconciliação em tempo real de `checkPaymentStatus` ou `simulateDevPayment`) restaure a cota com 100% de consistência.

### 4. Invalidação de Cache e UX no Frontend
- Na rota `/pedido/$orderId` ou no componente `OrderDeliveryView`:
  - Quando o pagamento for detectado como `PAID`, invalidar a query `PREVIEW_QUOTA_QUERY_KEY` (`["free-preview-quota"]`) no `queryClient` (se disponível no contexto cliente).
  - Um selo informativo ou tooltip sutil junto ao botão "Nova Oferta" (ex: "Criar novo card (2 prévias grátis liberadas)") para reforçar a percepção de valor e estímulo de recompra.

## Testing Decisions

1. **Testes Unitários no Domínio `free-preview-quota.service.test.ts`**:
   - Cenário 1: Visitante consome 2 prévias -> cota fica com `remaining: 0` e `blockedReason: "visitor"`. Ao chamar `resetVisitorQuotaOnPayment({ draftId })`, o status das linhas passa para `RESET_BY_PURCHASE` e `getQuotaStatus` volta a retornar `remaining: 2` e `blockedReason: null`.
   - Cenário 2: `resetVisitorQuotaOnPayment` com `draftId` inexistente deve retornar `resetCount: 0` sem estourar erro.
   - Cenário 3: Reset do visitante pagante não afeta prévias ativas de outro visitante independente.
2. **Testes de Integração em `pix-checkout.service.test.ts`**:
   - Verificar que a confirmação via webhook (`handleWebhookPayment`) ou polling ativo (`checkPaymentStatus`) aciona a liquidação e o reset no ledger para o draft associado ao pedido.
3. **Testes de Regressão em Delivery e Criação**:
   - Garantir que as 3 regenerações de IA em `/pedido/$orderId` continuam funcionando inalteradas.
   - Garantir que `getPreviewQuotaFn` reflete o reset no TanStack Query.

## Out of Scope

- Reset indiscriminado de todos os IPs da sub-rede (o reset é focado no `visitorId` pagante).
- Remoção física de registros do banco de dados (retenção obrigatória para compliance e métricas).
- Alteração do valor das cotas padrão (o limite diário permanece 2 por visitante e 6 por IP).
- Criação de contas de usuário ou autenticação com senha (mantém arquitetura frictionless sem login).

## Further Notes

- Respeita integralmente a arquitetura estabelecida em `docs/specs/free-preview-limits.md`.
- Mantém o padrão de *Deep Modules* sem criação de camadas rasas intermediárias.
