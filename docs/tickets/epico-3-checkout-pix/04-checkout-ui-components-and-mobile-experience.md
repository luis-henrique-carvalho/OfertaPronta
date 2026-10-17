# 04: Mobile-First Checkout UI Components & TanStack Start Route

**Spec:** [`docs/specs/epico-3-checkout-pix.md`](../../specs/epico-3-checkout-pix.md)

**What to build:**
Desenvolver os componentes visuais acessíveis e mobile-first de checkout utilizando Tailwind CSS v4 e primitivos shadcn/ui. Integrar a rota dinâmica `src/routes/checkout.$orderId.tsx` com polling automático em tempo real, conectar o botão "Liberar em HD sem marca d'água (R$ 9,90)" da etapa de prévia para transicionar ao checkout, e orquestrar o redirecionamento automático para a tela do pedido assim que o Pix for confirmado.

**Blocked by:** `03: Server Functions RPC & Order Polling Hooks`

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Componentes Mobile-First em `src/features/checkout/components/`:**
  - `order-summary-card.tsx`:
    - Exibe o resumo do pedido: R$ 9,90 avulso, título da promoção e miniatura da prévia com marca d'água aprovada.
    - Componente acessível construído exclusivamente com primitivos shadcn/ui (`Card`, `Typography`, `Badge`).
  - `pix-copia-cola-card.tsx`:
    - Área de texto com o código EMV do Pix Copia e Cola.
    - Botão grande proeminente com ícone e texto "Copiar Código Pix".
    - Ao tocar, aciona cópia para a área de transferência e exibe feedback de sucesso temporário ("Código Pix Copiado!").
  - `pix-qr-code-card.tsx`:
    - Renderiza o QR Code visual a partir da imagem Base64 retornada pela Pushin Pay.
    - Opção retrátil ou otimizada para visualização rápida no celular ou leitura por outro aparelho.
  - `payment-polling-indicator.tsx`:
    - Indicador com animação sutil de pulso indicando *"Aguardando pagamento via Pix..."*.
    - Cronômetro regressivo com contagem de minutos e segundos restantes até a expiração (iniciando em 30 min).
    - Botão de fallback *"Já paguei? Verificar agora"* para forçar checagem imediata.
    - Quando o tempo esgotar (`EXPIRED`), exibe aviso contextual claro e botão proeminente *"Gerar Novo Código Pix"*.
  - `order-whatsapp-recovery-card.tsx`:
    - Campo opcional amigável: *"Receber link por WhatsApp caso feche o navegador (opcional)"*.
    - Pré-preenchido caso o usuário tenha informado WhatsApp na etapa do briefing.
    - Salva alteração de forma não obstrutiva.

- [ ] **View Consolidada (`src/features/checkout/views/checkout-view.tsx`):**
  - Orquestra os componentes em layout vertical mobile-first fluido (viewport 360px a 430px sem estouro horizontal).
  - Escuta o hook `use-order-polling` e, na transição para `PAID`, apresenta feedback de sucesso com transição suave para `/pedido/$orderId`.
  - Se o pedido já chegar na rota com status `PAID`, redireciona imediatamente para `/pedido/$orderId`.

- [ ] **Rota TanStack Start (`src/routes/checkout.$orderId.tsx`):**
  - Rota dinâmica com carregamento inicial via loader ou Server Function `getOrderCheckoutDetailsFn`.
  - Tratamento de pedido não encontrado com página amigável e botão para voltar ao início.

- [ ] **Integração com a Etapa de Prévia:**
  - Atualizar `src/features/promotions/components/preview-checkout-action-card.tsx` e `offer-brief-wizard.tsx`.
  - Substituir o placeholder `alert(...)` pelo disparo da Server Function `initiateCheckoutFn`.
  - Exibir estado de carregamento no botão ("Preparando Pix...") enquanto o pedido é criado, navegando em seguida para `/checkout/{orderId}`.

- [ ] **Conformidade de Qualidade & Testes:**
  - Testes em `src/features/checkout/views/checkout-view.test.tsx` cobrindo os estados `PENDING`, `EXPIRED` e redirecionamento no `PAID`.
  - Execução bem-sucedida do pipeline de verificação:
    - `./.agents/scripts/verify.sh --quick` (Shadcn UI check + Typecheck + ESLint + Vitest).
