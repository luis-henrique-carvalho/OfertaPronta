# 04: Mobile-First UX: Contextual AI Loader, Real Preview Display & Error Handling

**Spec:** [`docs/specs/epico-2-ai-generation-export.md`](../../specs/epico-2-ai-generation-export.md)

**What to build:**
Conectar o fluxo de criação da rota `/criar` (`OfferBriefWizard`, `LiveCardPreview` e `CardArtCanvas`) à Server Function `generatePreviewFn`. Prover uma experiência de carregamento mobile-first de 4 a 10 segundos com micro-feedbacks contextuais, renderizar o card real gerado por IA com marca d'água na etapa de prévia (com alternador instantâneo Feed 1080×1350 e Story 1080×1920), e fornecer banners claros para limite de cota gratuita e recuperação amigável de erros de IA.

**Blocked by:** [`docs/tickets/epico-2-ai-generation-export/03-preview-quota-and-rpc-generation.md`](./03-preview-quota-and-rpc-generation.md)

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Integração no Hook `useOfferBriefDraft`:**
  - Adicionar suporte a estado de geração por IA:
    - `isGenerating: boolean`
    - `generationStage: string` ("briefing" | "composing" | "watermarking")
    - `generationError: { code: string; message: string } | null`
    - `previewCardImageUrl: string | null`
    - `aiGenerationCount: number`
  - Ação `generateAiPreview()` que invoca `saveDraft()` seguido de `generatePreviewFn({ draftId })`.

- [ ] **Experiência de Carregamento Contextual (Mobile-First):**
  - **Given** o usuário no Passo 2 clicando em "Gerar Prévia com IA",
  - **When** a inferência multimodal do Gemini estiver em andamento (4 a 10 segundos),
  - **Then** deve exibir um modal ou card de carregamento moderno com:
    - Indicador de pulso ou brilho animado (Sparkles / AI loader).
    - Mensagens progressivas que mudam automaticamente a cada 2.5s:
      - _0s - 2.5s:_ "Interpretando seu briefing e insumos visuais..."
      - _2.5s - 5.5s:_ "Compondo o cenário e iluminação comercial com IA..."
      - _5.5s - 8.5s:_ "Integrando textos e aplicando proteção de prévia..."
    - Botões de navegação desabilitados durante a chamada para evitar envios concorrentes.

- [ ] **Renderização da Prévia Real Gerada por IA (`LiveCardPreview`):**
  - **Given** a conclusão bem-sucedida da geração,
  - **When** o usuário é direcionado para a Etapa 3 ("Prévia do Card IA"),
  - **Then**:
    - O `CardArtCanvas` deve renderizar a imagem real protegida gerada pelo servidor (`previewCardImageUrl`).
    - O alternador **Feed (1080×1350)** e **Story (1080×1920)** deve alternar o enquadramento fluido sem distorção.
    - A marca d'água diagonal server-side deve estar visível e integrada nos pixels do card.

- [ ] **Tratamento de Cota Esgotada & Paywall Informativo:**
  - **Given** que o usuário já gerou 1 prévia gratuita e tenta acionar a geração novamente no mesmo rascunho,
  - **When** a Server Function retornar `AI_QUOTA_EXCEEDED`,
  - **Then**:
    - O wizard deve navegar para a Etapa 3 mantendo a prévia já existente.
    - Exibir um banner de destaque informativo: _"Você já gerou sua prévia gratuita deste rascunho. Para gerar novas variações ou refinar com IA, conclua o pagamento Pix (R$ 9,90) — com direito a até 3 regenerações pós-compra!"_.
    - O botão de ação primária foca em _"Pagar com Pix (R$ 9,90)"_.

- [ ] **Recuperação Amigável de Erros da IA:**
  - **Given** que a chamada ao Gemini falhe (código `AI_GENERATION_FAILED`),
  - **When** a resposta de erro for recebida,
  - **Then**:
    - O usuário permanece na etapa de insumos visuais com todos os dados preenchidos preservados.
    - Um alerta amigável em português é exibido informando a instabilidade temporária.
    - Um botão _"Tentar Novamente"_ permite disparar a geração novamente sem recarregar a página.

- [ ] **Testes de Componentes e Fluxo UI:**
  - Implementar testes em `src/features/promotions/components/offer-brief-wizard.test.tsx` cobrindo:
    - Transição de passos com geração de prévia.
    - Exibição das etapas do loader contextual.
    - Renderização da imagem gerada por IA na etapa 3.
    - Exibição do banner de paywall quando a cota estiver esgotada.
