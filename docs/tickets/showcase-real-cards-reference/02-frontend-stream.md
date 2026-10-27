# 02: Frontend Stream — Vitrine com Cards Reais de IA, Ação "Usar como Referência", Feedback Visual no Passo 4 e Integração de Rascunho

**Spec:** [`docs/specs/showcase-real-cards-reference.md`](../../specs/showcase-real-cards-reference.md)

**What to build:**
Construir a experiência de usuário integrada da vitrine no Passo 4 do assistente de criação (`Step4StyleAndPalette` e `ShowcaseGalleryDialog`), transformando o botão de ação em "Usar como Referência" (com ícone `Sparkles`), atualizando o hook `useOfferBriefDraft` com métodos dedicados para aplicar atomicamente o estilo visual (`stylePresetId`) e a imagem da vitrine (`referenceImageDataUrl`), implementando o banner/cartão de referência ativa no Passo 4 com miniatura do card selecionado e opções de troca/remoção, e garantindo feedback visual imediato (toast de substituição quando já existia print anterior, preservação da foto de produto do Passo 3 e sincronização com o grid de estilos rápidos).

**Blocked by:** `None (can start immediately in parallel with contracts defined in spec)`

**Status:** `completed`

---

## Acceptance Criteria (BDD)

### 1. Ação Unificada "Usar como Referência" no Modal da Vitrine (`ShowcaseGalleryDialog`)

- [x] **Dado** a abertura do modal da vitrine `ShowcaseGalleryDialog` no Passo 4, **quando** o comerciante visualizar os cards de exemplo de IA, **então** cada card deve exibir um botão de ação com o texto _"Usar como Referência"_ e ícone `Sparkles`.
- [x] **Dado** que um card da vitrine já foi selecionado como referência ativa do rascunho, **quando** o modal for reaberto, **então** o card correspondente deve exibir o botão no estado selecionado (_"Referência Ativa"_ com ícone `CheckCircle2` e estilo secundário), indicando claramente o status atual.
- [x] **Dado** o toque no botão _"Usar como Referência"_ de um card, **quando** acionado, **então** o diálogo deve invocar o callback passando o card de vitrine com `stylePresetId` e `imageUrl`, fechar o modal e aplicar a referência ao formulário.

### 2. Banner de Referência Ativa e Gestão Visual no Passo 4 (`Step4StyleAndPalette`)

- [x] **Dado** um rascunho com uma imagem de referência ativa (seja proveniente da vitrine ou de upload prévio), **quando** renderizado no Passo 4, **então** deve ser exibido um cartão/banner de destaque com:
  - Miniatura com proporção quadrada ou 4:5 da arte de referência;
  - Badge _"Referência Ativa"_ ou _"Inspiração da Vitrine"_;
  - Texto orientativo explicando que a IA usará a arte para guiar a iluminação, composição e paleta;
  - Botão de ação secundária para _"Trocar na Vitrine"_ (reabrindo o modal) e botão/ícone para _"Remover Referência"_.
- [x] **Dado** a seleção de um card da vitrine, **quando** o estilo associado for aplicado, **então** o grid de mini-posts (`StyleMiniPostCard`) deve sincronizar o estilo correspondente (ex.: `market-discount`, `market-fresh`), destacando-o com o badge de seleção.
- [x] **Dado** que o comerciante clica em _"Remover Referência"_, **quando** a ação for confirmada, **então** o banner de referência deve desaparecer, o campo `referenceImageDataUrl` deve ser limpo e o formulário deve manter o estilo pré-selecionado sem perda dos dados do briefing.

### 3. Integração com o Rascunho & Multimodalidade no Assistente (`useOfferBriefDraft` & `offer-creation-wizard.tsx`)

- [x] **Dado** o hook de estado `useOfferBriefDraft`, **quando** expostas as funções de manipulação de referência, **então** deve fornecer `setReferenceFromShowcase({ stylePresetId, imageUrl })` e `clearReferenceImage()`, atualizando os campos de formulário sem dependências de rede lentas.
- [x] **Dado** um usuário que fez upload de uma Foto de Produto no Passo 3 e seleciona um card da vitrine no Passo 4, **quando** a referência for aplicada, **então** a foto do produto (`productImageDataUrl`) deve ser preservada intacta, permitindo a multimodalidade dupla (Produto Real + Estilo da Vitrine).
- [x] **Dado** um usuário que já havia enviado um print de referência no Passo 3 e escolhe um card da vitrine no Passo 4, **quando** o card da vitrine for aplicado, **então** a nova imagem deve substituir o print anterior e um toast amigável deve informar: _"Referência da vitrine aplicada ao seu card!"_.

### 4. Acessibilidade, Ergonomia Mobile & Conformidade de UI

- [x] **Dado** o acesso por dispositivo móvel (viewport de 360px a 430px), **quando** o usuário interagir com o modal e o Passo 4, **então** todos os elementos interativos devem possuir área de toque mínima de 44px, sem estouro horizontal ou sobreposição de textos.
- [x] **Dado** a auditoria de componentes com `./.agents/scripts/check_shadcn_usage.py`, **quando** o script for executado, **então** 100% dos componentes devem utilizar os primitivos oficiais do shadcn/ui e tokens do Tailwind CSS v4, com zero tags HTML nativas desestilizadas (`<button>`, `<input>`).

### 5. Qualidade de Código e Testes de Frontend

- [x] **Dado** a suíte de testes de componentes, **quando** executado `pnpm vitest run src/features/promotions/components/wizard/step4-style-and-palette.test.tsx`, **então** os testes devem validar a abertura da vitrine, o clique em _"Usar como Referência"_, a renderização do banner de referência ativa e a remoção da referência com sucesso em menos de 2 segundos.
- [x] **Dado** a verificação de tipos estritos do TypeScript, **quando** executado `pnpm typecheck`, **então** o projeto deve compilar com zero erros de tipagem.
