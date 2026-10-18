# 04: Integração do Fluxo do Rascunho, Troca Reativa de Segmento e Validação E2E

**Spec:** [`docs/specs/epico-5-galeria-estilos.md`](../../specs/epico-5-galeria-estilos.md)

**What to build:**
Integrar a nova `StylePresetGallery` de ponta a ponta na jornada do microempresário na rota `/criar`. Conecta o componente visual dentro de `FlexibleVisualInputs`, sincroniza o estado no hook `useOfferBriefDraft`, garante a troca reativa de estilos quando o usuário altera o segmento comercial no Passo 1, preserva o estilo selecionado ao salvar rascunhos no banco de dados (`drafts.stylePresetId`), garante a aplicação das novas diretrizes de arte na geração da prévia via `generatePreviewFn`, atualiza a suíte de testes do wizard (`offer-brief-wizard.test.tsx`) e executa o pipeline completo de verificação e qualidade do projeto.

**Blocked by:** 03: Galeria Visual Mobile-First com Seleção de 1 Toque e Abas de Referência

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Dado** um rascunho com o segmento *"Supermercado"* no Passo 1, **quando** o usuário voltar e alterar para *"Salão de Beleza"*, **então** ao avançar para o Passo 2 a galeria deve atualizar reativamente exibindo os estilos de salão e redefinindo o estilo ativo para o primeiro estilo padrão do novo segmento (`salon-glamour`).
- [ ] **Dado** um rascunho com estilo selecionado na galeria, **quando** persistido no banco via `saveDraftFn`, **então** o campo `drafts.stylePresetId` deve gravar o ID do preset curado selecionado.
- [ ] **Dado** um rascunho existente recarregado via `getDraftFn`, **quando** renderizado no formulário `/criar`, **então** o estilo salvo deve ser recuperado e visualmente selecionado na galeria sem perda de estado.
- [ ] **Dado** o acionamento de *"Gerar Prévia com IA"* com um estilo curado ativo, **quando** a Server Function `generatePreviewFn` for executada, **então** deve sintetizar o card passando a Diretriz de Direção de Arte do preset para o Gemini e renderizar a prévia com marca d'água na tela de conferência.
- [ ] **Dado** os testes existentes de rascunho e wizard em `src/features/promotions/`, **quando** executados com `pnpm test`, **então** todos os testes unitários e de integração devem passar com 100% de sucesso sem quebras de regressão.
- [ ] **Dado** o script oficial de verificação do projeto (`./.agents/scripts/verify.sh` ou `pnpm test && pnpm typecheck && pnpm lint`), **quando** executado, **então** todo o pipeline de Shadcn UI, tipagem estrita TypeScript, ESLint e testes Vitest deve ser aprovado com código 0.
