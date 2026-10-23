# 02: Frontend Stream — Card de Desconto no Checkout, Switch Reativo, Resumo Dinâmico & Mockup da Assinatura no Showcase

**Spec:** [`docs/specs/cobranding-discount.md`](../../specs/cobranding-discount.md)

**What to build:**
Construir a experiência visual e interativa mobile-first de co-branding no checkout (`checkout.$orderId.tsx`), permitindo ao microempresário:

1. Interagir com o `CobrandingDiscountCard`, componente acessível com `Switch` (shadcn/ui), Badge de economia destacada ("Economize R$ 2,97") e explicação transparente sobre a assinatura de marca.
2. Acionar o switch com feedback visual otimista, bloqueio temporário contra múltiplos cliques e recálculo reativo do valor em toda a tela.
3. Visualizar instantaneamente o novo valor (R$ 6,93 vs R$ 9,90) no `AdCardCheckoutShowcase` e no `UnifiedPixPaymentCard` (QR Code e código Copia e Cola recarregados).
4. Ver um mockup ou pill sutil de prévia da assinatura `"Design por @ofertapronta"` no rodapé da arte exibida no `AdCardCheckoutShowcase` quando o switch estiver ativado, gerando confiança de que o design não polui a promoção.
5. Integrar a chamada RPC no hook `usePixCheckout` (`toggleCobranding`), com reversão graciosa e mensagem de erro amigável se a requisição falhar.

**Blocked by:** None (Execução Concorrente com Stream 1 graças aos contratos Zod e DTOs tipados)

**Status:** `ready-for-agent`

## Arquivos a Modificar / Criar

- `src/features/checkout/components/cobranding-discount-card.tsx`: Componente mobile-first com Switch, Badge de desconto e textos claros.
- `src/features/checkout/components/cobranding-discount-card.test.tsx`: Testes unitários do componente visual e de interação.
- `src/features/checkout/components/index.ts`: Exportação de `CobrandingDiscountCard`.
- `src/features/checkout/components/ad-card-checkout-showcase.tsx`: Suporte a prop `cobrandingAccepted` e renderização de pill/mockup sutil no rodapé da prévia.
- `src/features/checkout/hooks/use-pix-checkout.ts` & testes: Adicionar função `toggleCobranding`, estado `isUpdatingCobranding` e tratamento de erros.
- `src/features/checkout/views/checkout-view.tsx`: Inserir `CobrandingDiscountCard` na hierarquia do checkout e conectar as props ao estado reativo.
- `src/features/checkout/views/checkout-view.test.tsx`: Testes de integração cobrindo a alternância do switch e atualização da tela.

## Acceptance Criteria (BDD)

- [ ] **Renderização do Card de Desconto no Checkout:**
  - _Given_ um microempresário acessando a tela de checkout de um pedido pendente,
  - _When_ a página carrega,
  - _Then_ o `CobrandingDiscountCard` é exibido entre o showcase da arte e o painel Pix, mostrando o switch desligado, a economia destacada ("Economize R$ 2,97" ou "30% OFF") e o valor com desconto ("R$ 6,93").
- [ ] **Alternância do Switch e Atualização Reativa:**
  - _Given_ o switch de desconto em estado desligado (valor R$ 9,90),
  - _When_ o usuário clica para ativar o desconto,
  - _Then_ o switch entra em estado de carregamento, dispara a Server Function `updateOrderCobrandingFn({ orderId, cobrandingAccepted: true })` e, com a resposta de sucesso, o preço exibido no showcase e no painel Pix é atualizado para R$ 6,93 com o novo QR Code e Copia e Cola.
- [ ] **Mockup Visual da Assinatura no Showcase:**
  - _Given_ o desconto ativado (`cobrandingAccepted === true`),
  - _When_ o comerciante observa a arte no `AdCardCheckoutShowcase`,
  - _Then_ uma indicação visual elegante (pill translúcido) com o texto `"Design por @ofertapronta"` é visível no rodapé da prévia.
- [ ] **Reversão do Desconto:**
  - _Given_ o desconto ativado (R$ 6,93),
  - _When_ o usuário desativa o switch,
  - _Then_ a tela atualiza para o valor integral de R$ 9,90, o mockup da assinatura desaparece da prévia e o novo Pix de valor integral é exibido.
- [ ] **Tratamento de Erros e Resiliência:**
  - _Given_ uma falha de rede ou erro retornado pelo servidor ao tentar alterar o desconto,
  - _When_ a chamada falhar,
  - _Then_ o estado do switch reverte para o anterior e uma mensagem amigável de erro é apresentada ao comerciante sem quebrar o layout.
- [ ] **Conformidade Mobile-First e Shadcn UI:**
  - _Given_ a tela renderizada em viewport mobile (360px a 430px),
  - _When_ executado o script de validação de linter de componentes,
  - _Then_ `./.agents/scripts/verify.sh --shadcn` passa com zero violações e nenhum elemento nativo sem estilização acessível é utilizado.
- [ ] **Qualidade e Testes:**
  - _Given_ a implementação dos componentes e hooks,
  - _When_ executados `pnpm vitest run src/features/checkout/components/cobranding-discount-card.test.tsx` e `src/features/checkout/views/checkout-view.test.tsx`,
  - _Then_ todos passam com 100% de sucesso e `pnpm typecheck` não acusa erros.
