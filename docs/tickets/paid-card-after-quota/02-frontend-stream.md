# 02 — Frontend Stream: Rodapé Ativo com Cota Esgotada, Mockup no Checkout e Loading na Entrega

**Spec:** [`docs/specs/paid-card-after-quota.md`](../../specs/paid-card-after-quota.md)

**What to build:**
Adequar a interface do usuário (mobile-first, baixo volume de texto) para que o microempresário com cota diária de 2 prévias esgotada encontre um botão ativo no Passo 4 do assistente ("Continuar e Gerar Card") e uma explicação concisa e amigável. Ao avançar, salva o rascunho sem acionar a IA e navega para o checkout, onde o showcase exibe um mockup visual com os dados preenchidos da oferta e o selo "Arte gerada por IA após o Pix". Na tela de entrega (`/pedido/$orderId`), adiciona estado de carregamento acolhedor enquanto a IA finaliza a arte em alta resolução pós-pagamento.

**Blocked by:** None (pode iniciar imediatamente; contratos de dados e rotas estão congelados).

**Status:** `ready-for-agent`

---

## Escopo Detalhado

1. **Rodapé Fixo do Wizard (`CreationFixedFooter` e `OfferCreationWizard`)**:
   - Arquivo: `src/features/promotions/components/wizard/creation-fixed-footer.tsx`
     - Quando `isLastStep && quotaBlocked`:
       - **Substituir o botão desabilitado** `"Prévias esgotadas hoje"` por um botão **ATIVO**:
         - Texto: `"Continuar e Gerar Card"` (atende à decisão do usuário de não exibir o preço dentro do botão).
         - Ícone: `Wand2` ou `Sparkles`.
         - TestId: `btn-wizard-generate`.
         - Estado de loading durante o envio: `"Iniciando Pix..."`.
       - Exibir acima do botão (na área do contador de cota) a mensagem explicativa concisa:
         > *"Você usou suas 2 prévias grátis de hoje. Confirme o Pix (R$ 9,90) e nossa IA criará seu card logo após o pagamento."*
   - Arquivo: `src/features/promotions/components/offer-creation-wizard.tsx` e `use-offer-brief-draft.ts`:
     - Quando o usuário clicar no botão de gerar com cota esgotada (`quotaBlocked === true`):
       - Executar salvamento do rascunho (`saveDraft`).
       - Invocar `initiateCheckoutFn({ draftId })` diretamente, **sem disparar chamada à API de geração de prévia Gemini**.
       - Redirecionar o usuário para `/checkout/$orderId`.

2. **Showcase Visual do Card no Checkout (`AdCardCheckoutShowcase` e `CheckoutView`)**:
   - Arquivo: `src/features/checkout/components/ad-card-checkout-showcase.tsx`
     - Quando `previewCardImageUrl` for `null` ou `undefined`:
       - Em vez de um ícone vazio simples, renderizar um **Mockup Estruturado do Card** na proporção correta (`4/5` Feed ou `9/16` Story):
         - Fundo visual contextual e estilizado (gradiente discreto com tons da identidade visual do segmento);
         - Nome da empresa e título da oferta destacados;
         - Preço promocional em destaque visual;
         - Selo de vidro/blur central: `Sparkles` + `"Arte gerada por IA após o Pix"`.
   - Arquivo: `src/features/checkout/views/checkout-view.tsx`:
     - Quando `!previewCardImageUrl`, exibir no topo da visualização um banner informativo:
       > *"Criação por IA Garantida: Seu card será gerado pela Inteligência Artificial assim que o pagamento Pix for confirmado."*

3. **Loading Contextual na Página de Entrega (`src/routes/pedido.$orderId.tsx`)**:
   - Adicionar `pendingComponent` à rota `/pedido/$orderId`:
     - Card acolhedor mobile-first com animação suave de pulso/spinner:
       - Título: *"Gerando sua arte publicitária com IA..."*
       - Descrição: *"Estamos criando suas versões em alta resolução para Feed (1080×1350) e Story (1080×1920). Isso leva menos de 15 segundos."*
   - Garantir transição fluida para o `OrderDeliveryView` quando o loader concluir.

---

## Acceptance Criteria (BDD)

- [ ] **Critério 1 (Botão ativo no Passo 4 com cota esgotada)**:
  - *Dado* que o usuário está no Passo 4 de `/criar` e a cota gratuita está esgotada (`quotaBlocked: true`)
  - *Quando* o rodapé fixo for renderizado
  - *Então* o botão principal deve estar habilitado para clique e exibir `"Continuar e Gerar Card"`.
  - *E* a mensagem `"Você usou suas 2 prévias grátis de hoje. Confirme o Pix (R$ 9,90) e nossa IA criará seu card logo após o pagamento."` deve estar presente.

- [ ] **Critério 2 (Ação do botão inicia checkout sem chamada à IA)**:
  - *Dado* que o usuário clica em `"Continuar e Gerar Card"`
  - *Quando* a ação for disparada
  - *Então* o rascunho deve ser salvo e o checkout iniciado diretamente, sem chamada à função de geração de prévia.

- [ ] **Critério 3 (Mockup do card no checkout)**:
  - *Dado* que a tela `/checkout/$orderId` carrega um pedido com `previewCardImageUrl` nulo
  - *Quando* `AdCardCheckoutShowcase` renderizar
  - *Então* deve exibir o mockup do card contendo o título da oferta, o preço e o selo `"Arte gerada por IA após o Pix"`.

- [ ] **Critério 4 (Loading state na entrega)**:
  - *Dado* que o cliente acessa `/pedido/$orderId` para um pedido recém-pago cuja geração está em curso
  - *Quando* a página estiver aguardando a resposta da Server Function
  - *Então* o componente de carregamento deve exibir mensagem informando que a IA está criando o card em alta resolução.

---

## Validação Cirúrgica (Builder)

- Rodar apenas os testes da área de frontend:
  - `pnpm vitest run src/features/promotions/components/wizard/creation-fixed-footer.test.tsx`
  - `pnpm vitest run src/features/promotions/components/offer-creation-wizard.test.tsx`
  - `pnpm vitest run src/features/checkout/components/ad-card-checkout-showcase.test.tsx`
- `pnpm typecheck`
- `./.agents/scripts/verify.sh --shadcn`
