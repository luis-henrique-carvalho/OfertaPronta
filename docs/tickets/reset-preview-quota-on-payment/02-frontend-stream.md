# 02 — Frontend Stream: Invalidação de Cache e Feedback de Cota Restaurada

- **Spec**: [`docs/specs/reset-preview-quota-on-payment.md`](../../specs/reset-preview-quota-on-payment.md)
- **Blocked by**: None (pode rodar em paralelo ou após o ticket 01, pois a chave de query e os contratos estão congelados)
- **Status**: `ready-for-agent`

## O que construir

Garantir que a experiência de recompra e criação de nova oferta seja fluida no frontend após a confirmação do pagamento. Quando o usuário estiver na tela de entrega pós-pagamento (`/pedido/$orderId`), o cache da cota de prévias deve ser invalidado no TanStack Query (`PREVIEW_QUOTA_QUERY_KEY`), e o botão "Nova Oferta" deve deixar claro ou permitir que o microempresário inicie imediatamente uma nova campanha com seu saldo de 2 prévias restabelecido, sem encontrar avisos de limite ultrapassado em `/criar`.

### Escopo Detalhado

1. **Invalidação de Cache no Pedido Confirmado**:
   - Em `src/routes/pedido.$orderId.tsx` ou `src/features/delivery/views/order-delivery-view.tsx`:
     - Ao carregar um pedido com status `PAID`, disparar a invalidação da query `PREVIEW_QUOTA_QUERY_KEY` (`["free-preview-quota"]`) via `useQueryClient()`.
     - Isso garante que qualquer dado em cache antigo que indicava "0 prévias restantes" seja atualizado para refletir o reset efetuado pelo backend.
2. **Incentivo Visual de Recompra no Delivery**:
   - No cabeçalho de `OrderDeliveryView` (próximo ao botão "Nova Oferta") ou no card de entrega:
     - Adicionar indicação visual ou tooltip de benefício (ex: badge ou texto auxiliar sutil: "+2 prévias grátis liberadas para sua próxima arte").
     - Assegurar conformidade estrita com o design system mobile-first (360-430px) e componentes shadcn/ui.
3. **Ergonomia e Navegação para `/criar`**:
   - Garantir que o clique em "Nova Oferta" direcione para `/criar` com o estado limpo e pronto para um novo card.
   - O hook `usePreviewQuota` em `/criar` deve carregar sem mensagens de bloqueio após o pagamento.

## Acceptance Criteria (BDD)

- [ ] **Dado** que o cliente acessa a tela de entrega de um pedido pago (`/pedido/$orderId`), **Quando** o componente for montado, **Então** a query de cota `['free-preview-quota']` é invalidada para sincronizar o saldo real do backend.
- [ ] **Dado** a tela de entrega do pedido pago, **Quando** o cliente visualizar a barra superior, **Então** o botão "Nova Oferta" está visível e acessível em dispositivos móveis (viewport 360px a 430px) com indicação do benefício de criação.
- [ ] **Dado** que o cliente clica em "Nova Oferta", **Quando** a rota `/criar` for aberta, **Então** o formulário de briefing exibe o indicador de prévias atualizado (ex: "2 prévias grátis restantes hoje") sem banners de bloqueio.

## Validação (Builder)

- Executar testes do componente de delivery: `pnpm vitest run src/features/delivery/views/order-delivery-view.test.tsx`
- Executar testes do hook de cota: `pnpm vitest run src/features/promotions/hooks/use-preview-quota.test.ts`
- Verificar conformidade estrita de tipos e shadcn: `pnpm typecheck` e `./.agents/scripts/verify.sh --shadcn`
