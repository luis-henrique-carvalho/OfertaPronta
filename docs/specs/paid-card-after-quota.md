# Spec: Card Pago Direto após Cota de Prévias Esgotada

- **Slug**: `paid-card-after-quota`
- **Status**: `ready-for-agent`

## Problem Statement

Atualmente, o visitante do OfertaPronta possui uma cota de 2 prévias gratuitas por dia/24h. Quando essa cota é atingida, ao chegar no Passo 4 do assistente de criação (`/criar`), o usuário se depara com um botão morto e desabilitado exibindo o texto `"Prévias esgotadas hoje"`. Caso o usuário não possua um rascunho anterior com prévia já gerada, ele fica completamente bloqueado, incapaz de avançar. Mesmo se tiver um rascunho anterior, só consegue pagar por aquele antigo, e não pelo card que acabou de preencher com carinho nos passos 1 a 4.

Essa barreira quebra a experiência do usuário, frustra o microempresário pronto para comprar e causa perda direta de receita para a plataforma (onde o modelo de negócio é a venda avulsa de cards por R$ 9,90 via Pix).

## Solution

Permitir que qualquer microempresário com cota de prévias gratuitas esgotada continue normalmente o fluxo de criação do seu anúncio, pagando a taxa avulsa de R$ 9,90 via Pix antes da chamada à IA, com geração automática da arte mestre limpa e formatos Feed/Story imediatamente após a confirmação do pagamento.

### Fluxo de Experiência do Usuário (Mobile-First & Low-Text)

1. **Passo 4 do Assistente (`/criar`)**:
   - O microempresário preenche os passos normais (1: Segmento/Formato, 2: Dados da Oferta, 3: Imagens opcionais, 4: Estilo Visual).
   - Ao atingir o Passo 4 com cota esgotada (`quotaBlocked === true`):
     - Uma mensagem concisa, clara e acolhedora é exibida:
       > *"Você usou suas 2 prévias grátis de hoje. Confirme o Pix (R$ 9,90) e nossa IA criará seu card logo após o pagamento."*
     - O botão de ação principal no rodapé fixo fica **100% ativo** com o texto:
       **"Continuar e Gerar Card"** (com ícone `Wand2` ou `Sparkles`, sem menção redundante a preço no botão).
   - Ao clicar no botão:
     - O rascunho (`draft`) é salvo no banco com todos os dados preenchidos pelo usuário.
     - A chamada à IA Gemini **NÃO é executada** nesta etapa (custo zero de IA antes do pagamento garantido).
     - O checkout Pix é iniciado imediatamente (`initiateCheckout`) e o usuário é redirecionado de forma fluida para `/checkout/$orderId`.

2. **Tela de Pagamento Pix (`/checkout/$orderId`)**:
   - Um banner explicativo amigável e direto reforça a segurança e o fluxo:
     > *"Criação por IA Garantida: Seu card será gerado pela Inteligência Artificial assim que o pagamento Pix for confirmado."*
   - **Showcase Visual do Card (`AdCardCheckoutShowcase`)**:
     - Como a imagem final ainda não foi gerada pela IA, exibe um mockup visual elegante no aspect ratio escolhido (Feed 4:5 ou Story 9:16), renderizando os dados reais informados pelo usuário:
       - Título da Oferta e Nome do Estabelecimento;
       - Preço Promocional em destaque;
       - Badge central discreto: *"Arte gerada por IA após o Pix"*;
     - Transmite confiança profissional e evita uma tela vazia ou com placeholder quebrado.
   - O usuário pode aplicar o desconto de co-branding normalmente (ex: R$ 6,93) e efetuar o pagamento via Pix QR Code ou Copia e Cola.

3. **Confirmação e Entrega Automática (`/pedido/$orderId`)**:
   - Assim que o pagamento Pix é confirmado (`status === "PAID"`):
     - Ao acessar a página de entrega ou via polling ativo, o serviço `DeliveryService.ensureDeliveryExports` detecta que o pedido ainda não possui arte mestre limpa gerada (`cleanMasterAssetKey` e `cleanMasterImageDataUrl` nulos).
     - O `DeliveryService` consome os dados imutáveis do `frozenSnapshot`, aciona o gerador multimodal da IA (`generateAdCardImage`) para criar a arte limpa em alta resolução, armazena o asset no `StorageService` e deriva os formatos Feed (1080×1350) e Story (1080×1920) via `ExportEngine`.
     - Enquanto a IA gera o card (tempo médio de 5 a 12 segundos), a tela de entrega exibe um estado de carregamento contextual agradável: *"Criando seu card em alta resolução com IA... Isso leva menos de 15 segundos."*
     - Uma vez finalizado, os botões de download em alta resolução do Feed e Story são liberados instantaneamente.
     - O usuário mantém integralmente o direito a **3 regenerações/ajustes pós-pagamento** na janela de 30 minutos (`aiRegenerationCount: 0`).
     - A cota diária de 2 prévias gratuitas do visitante é **restaurada** no ledger para que ele possa criar novas ofertas sem restrições.

---

## User Stories

1. **Como microempresário que já usou minhas 2 prévias grátis**, quero poder preencher uma nova oferta e avançar para o pagamento Pix mesmo com a cota esgotada, para que eu não precise esperar 24 horas para criar meu anúncio de hoje.
2. **Como visitante no Passo 4 do assistente**, quero ver um botão ativo "Continuar e Gerar Card" e uma explicação simples e curta, para entender com clareza que o card será gerado pela IA assim que o Pix for aprovado.
3. **Como usuário na tela de checkout**, quero ver um mockup representativo do meu card com o título e preço que digitei, para ter certeza de que meus dados estão corretos antes de fazer o Pix.
4. **Como gestor de custos do produto**, quero que nenhum token de IA Gemini seja consumido antes do pagamento quando a cota estiver esgotada, para eliminar fraudes e custos desnecessários com rascunhos abandonados.
5. **Como comprador que acabou de pagar o Pix**, quero que a página de entrega gere automaticamente meu card e libere os arquivos Feed e Story sem que eu precise solicitar nada manualmente.
6. **Como cliente na página de entrega**, quero ver um indicador visual de carregamento transparente enquanto a IA cria a imagem final, para saber que o sistema está trabalhando no meu pedido.
7. **Como cliente pagante**, quero continuar tendo direito a até 3 ajustes/regenerações gratuitas pós-compra, para refinar detalhes da arte caso necessário.
8. **Como cliente pagante**, quero que minhas 2 prévias grátis sejam restabelecidas após o pagamento, para que eu possa experimentar um novo card logo em seguida.
9. **Como sistema em caso de instabilidade pontual da API de IA na entrega**, quero que o erro seja capturado com opção de retentativa segura ("Tentar gerar novamente"), sem debitar regenerações nem travar o pedido do cliente.

---

## Implementation Decisions

### 1. Desacoplamento no Serviço de Checkout (`PixCheckoutService`)
- **Remoção da restrição de prévia obrigatória**:
  - Em `pix-checkout.service.ts` método `initiateCheckout`, a validação que lançava `Error("Não é possível iniciar o checkout sem antes gerar a prévia do card com IA")` passa a permitir rascunhos sem `previewCardImageUrl`, marcando no snapshot `pendingAiGeneration: true`.
  - O `buildFrozenSnapshot` já inclui todos os campos do briefing (`businessSegment`, `targetAspectRatio`, `businessName`, `offerTitle`, `promoPrice`, `originalPrice`, `callToAction`, `whatsapp`, `productImageDataUrl`/`productAssetKey`, `referenceImageDataUrl`/`referenceAssetKey`, `stylePresetId`, `customStyleInstructions`, `cardIntent`, `customIntentText`, `logoImageDataUrl`/`logoAssetKey`).
  - Salva `visitorId` no `frozenSnapshot` a partir do contexto da requisição (cookie `op_vid` resolvido) para permitir a identificação direta do visitante no reset de cota.

### 2. Geração On-The-Fly no Módulo Profundo de Entrega (`DeliveryService`)
- Em `src/features/delivery/server/services/delivery.service.ts`:
  - Método `ensureDeliveryExports(orderId)`:
    - Se `order.status !== "PAID"`, mantém bloqueio 403 (`ORDER_NOT_PAID`).
    - Se `deliveryExports` já existir no banco, retorna imediatamente (idempotência).
    - Se não houver `deliveryExports`:
      - Verifica se `order.cleanMasterAssetKey` ou `order.cleanMasterImageDataUrl` ou `snapshot.cleanMaster*` existem.
      - **Se NÃO existir arte mestre**:
        - Aciona internamente a injeção do gerador de imagem: `this.generateAdCard(input)` com os dados do `frozenSnapshot`.
        - Salva o buffer da arte gerada no `StorageService` (`orders/{orderId}/clean-master.png`) e atualiza o registro `orders` (`cleanMasterAssetKey`).
        - O contador de regenerações pós-pagamento permanece em 0 (`aiRegenerationCount: 0`), garantindo 3 regenerações disponíveis.
      - Segue para `deriveAndPersistFormats` via `ExportEngine`, gerando Feed (1080×1350) e Story (1080×1920) e persistindo em `deliveryExports`.
- Tratamento de falhas de IA: se a chamada à IA falhar durante a entrega, lança `DeliveryError("FALHA_GERACAO_ENTREGA", "AI_GENERATION_FAILED", 502)` que é apresentado ao frontend com botão de retentativa acionado pelo usuário.

### 3. Reset Idempotente de Cota para Pedidos sem Prévia Prévia (`FreePreviewQuotaService`)
- Em `src/features/promotions/server/services/free-preview-quota.service.ts`:
  - Atualizar `resetVisitorQuotaOnPayment`:
    ```ts
    export interface ResetVisitorQuotaInput {
      draftId?: string;
      visitorId?: string;
      now?: Date;
    }
    ```
  - Se `input.visitorId` for informado (ou recuperado do `order.frozenSnapshot.visitorId`), utiliza-o diretamente para transicionar todas as linhas `CONSUMED` e `RESERVED` daquele visitante para `RESET_BY_PURCHASE`.
  - Se apenas `draftId` for informado, mantém o fallback atual buscando no ledger.

### 4. Experiência de Rodapé do Wizard (`CreationFixedFooter` & `OfferCreationWizard`)
- No componente `CreationFixedFooter`:
  - Quando `isLastStep && quotaBlocked`:
    - Em vez de botão desabilitado `"Prévias esgotadas hoje"`, renderiza botão **ATIVO**:
      - Rótulo: `"Continuar e Gerar Card"` (atendendo à preferência do usuário de não exibir o preço no botão).
      - Ícone: `Wand2` ou `Sparkles`.
      - TestId: `btn-wizard-generate`.
      - Ao clicar, invoca `onCheckoutDirect` (ou `onGeneratePaidCard`).
  - No topo do rodapé (ou sobre o botão), substitui o contador de cota por uma mensagem informativa clara:
    - `"Você usou suas 2 prévias grátis de hoje. Confirme o Pix (R$ 9,90) e nossa IA criará seu card logo após o pagamento."`
- Em `useOfferBriefDraft`:
  - Nova ação `checkoutWithoutPreview(overrideParams)`:
    1. Salva o rascunho com os dados atuais (`saveDraft()`).
    2. Invoca imediatamente `initiateCheckoutFn({ draftId })` **sem** chamar `generatePreviewFn`.
    3. Redireciona para `/checkout/${orderId}`.

### 5. Layout do Showcase no Checkout (`AdCardCheckoutShowcase` & `CheckoutView`)
- Em `src/features/checkout/components/ad-card-checkout-showcase.tsx`:
  - Quando `previewCardImageUrl` for nulo/indefinido:
    - Renderiza um **Mockup Visual do Card** estruturado na proporção solicitada (Feed 4:5 ou Story 9:16):
      - Fundo gradiente contextual do segmento;
      - Cabeçalho com o nome da empresa ou segmento;
      - Título da oferta em tipografia destacada;
      - Preço promocional em destaque;
      - Badge central estilizado com vidro/blur: `Sparkles` + *"Arte gerada por IA após o Pix"*;
- Em `src/features/checkout/views/checkout-view.tsx`:
  - Quando `previewCardImageUrl` for nulo, exibe um banner de lembrete acolhedor no topo:
    - *"Criação por IA Garantida: Seu card será gerado pela Inteligência Artificial assim que o pagamento Pix for confirmado."*

### 6. Loading State na Página de Entrega (`/pedido/$orderId`)
- Em `src/routes/pedido.$orderId.tsx`:
  - Adicionar `pendingComponent`:
    - Layout mobile-first com animação suave de pulso/spinner:
      - *"Gerando sua arte publicitária com IA..."*
      - *"Estamos criando as versões em alta resolução para Feed (1080×1350) e Story (1080×1920)."*
      - Subtexto: *"Leva apenas alguns segundos..."*

---

## BDD Acceptance Criteria (Gherkin Format)

### Cenário 1: Visitante com cota esgotada cria novo card e inicia checkout sem chamada à IA
```gherkin
Dado que o visitante já consumiu suas 2 prévias gratuitas nas últimas 24 horas
E está no Passo 4 do assistente de criação (/criar)
Quando o componente CreationFixedFooter é renderizado
Então a mensagem "Você usou suas 2 prévias grátis de hoje. Confirme o Pix (R$ 9,90) e nossa IA criará seu card logo após o pagamento." deve estar visível
E o botão "Continuar e Gerar Card" deve estar ativo e habilitado para clique
E ao clicar no botão:
  1. O rascunho é persistido com sucesso no banco de dados
  2. Nenhuma requisição à API Gemini é disparada (aiGenerationCount = 0)
  3. O serviço de checkout cria um pedido com status PENDING e cobrança Pix
  4. O usuário é redirecionado para /checkout/$orderId
```

### Cenário 2: Exibição do Showcase Mockup na tela de Checkout sem prévia
```gherkin
Dado que o usuário acessa /checkout/$orderId referente a um pedido sem prévia gerada
Quando a página de checkout carrega
Então o AdCardCheckoutShowcase deve exibir um mockup com o título da oferta, nome da empresa e preço promocional
E deve exibir o selo visual "Arte gerada por IA após o Pix" dentro da moldura do card
E o valor do pedido e o QR Code Pix devem ser exibidos normalmente para pagamento
```

### Cenário 3: Confirmação do pagamento Pix gera card limpo e formatos de entrega automaticamente
```gherkin
Dado um pedido com status PENDING originado sem prévia prévia
Quando o webhook Pix da Pushin Pay confirma o pagamento (transição para PAID)
E a rota de entrega /pedido/$orderId é acessada
Então o DeliveryService detecta a ausência de arte mestre limpa
E invoca o gerador multimodal de IA utilizando o frozenSnapshot do pedido
E armazena a arte mestre limpa gerada
E deriva os arquivos de alta resolução para Feed (1080x1350) e Story (1080x1920)
E disponibiliza os links de download sem marca d'água
E o saldo de regenerações do pedido inicia em 3 (aiRegenerationCount = 0)
```

### Cenário 4: Restauração da cota de prévias do visitante após pagamento
```gherkin
Dado que o visitante pagou por um card gerado pós-cota
Quando o pedido atinge o status PAID
Então as linhas de cota ativas daquele visitante no free_preview_ledger são transicionadas para RESET_BY_PURCHASE
E ao retornar para /criar, o saldo de prévias gratuitas do visitante é 2
```

### Cenário 5: Resiliência em caso de falha transitória da IA na entrega
```gherkin
Dado que o pedido está PAID mas a API Gemini falha por timeout temporário ao gerar o card na entrega
Quando o usuário recarrega a página /pedido/$orderId
Então uma tela amigável informa o ocorrido com um botão "Tentar gerar novamente"
E nenhuma cota de regeneração pós-compra é consumida pelo erro
E ao clicar em tentar novamente com sucesso, os cards são entregues
```

---

## Testing Decisions

1. **Seam de Teste do Backend (`PixCheckoutService` & `DeliveryService`)**:
   - `pix-checkout.service.test.ts`: testar que `initiateCheckout` aceita draft sem `previewCardImageUrl` e persiste snapshot com `visitorId`.
   - `delivery.service.test.ts`: testar que `ensureDeliveryExports` para pedido PAID sem master art chama `generateAdCard` fake, salva arte mestre, deriva exports e mantém `aiRegenerationCount: 0`.
   - `free-preview-quota.service.test.ts`: testar que `resetVisitorQuotaOnPayment` aceita `visitorId` diretamente e zera cota mesmo sem registro prévio do draft específico no ledger.
2. **Seam de Teste do Frontend**:
   - `creation-fixed-footer.test.tsx`: testar que com `quotaBlocked: true`, o botão não fica desabilitado nem exibe texto morto, exibindo `"Continuar e Gerar Card"` e disparando `onGenerate` / `onCheckout`.
   - `ad-card-checkout-showcase.test.tsx`: testar renderização do mockup quando `previewCardImageUrl` for `null` ou `undefined`, validando presença do título, preço e selo de IA.
   - `order-delivery-view.test.tsx` / `pedido.$orderId.test.tsx`: testar estados de loading e exibição correta pós-geração.

---

## Out of Scope (YAGNI)

- Cobrança de valores diferentes de R$ 9,90 (ou desconto de co-branding já suportado).
- Adição de novos gateways além do Pix da Pushin Pay.
- Criação de contas de usuário ou login por senha.
- Modificação dos prompts de IA existentes (utiliza a infraestrutura estável existente de prompts multimodais).
