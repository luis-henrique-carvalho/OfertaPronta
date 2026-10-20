# 02: Card Especial de Referência no Passo 4 e Hook `useOfferBriefDraft`

**Spec:** [`docs/specs/reference-driven-style.md`](../../specs/reference-driven-style.md)
**Plan:** [`docs/plans/reference-driven-style.md`](../../plans/reference-driven-style.md)

**What to build:**
No hook `src/features/promotions/hooks/use-offer-brief-draft.ts`, impedir a atribuição forçada do primeiro preset de catálogo quando houver imagem de referência ativa (`referenceImageDataUrl`), mantendo `stylePresetId` como `REFERENCE_STYLE_PRESET_ID` (`"reference-style"`). Permitir que o usuário selecione um preset sem limpar destrutivamente o print de referência.
No componente `src/features/promotions/components/wizard/step4-style-and-palette.tsx`, quando `referenceImageDataUrl` estiver presente, renderizar no topo da grade de estilos um card especial em destaque: **"Estilo do seu Print de Referência"** (`data-testid="reference-style-card"`), com miniatura do print enviado, selo *"Ativo / Recomendado"*, indicador visual de seleção (`aria-pressed`) e selecionado por padrão. Na grade de mini-posts de catálogo abaixo, não forçar a seleção do primeiro item se a referência estiver ativa. O microempresário pode tocar em qualquer preset de catálogo para selecionar conscientemente uma combinação híbrida ou tocar no card de referência para reativá-lo.
Atualizar e expandir a suíte de testes de integração em `offer-creation-wizard.test.tsx`.

**Blocked by:** `None (pode rodar em paralelo com a Stream 1, pois o contrato REFERENCE_STYLE_PRESET_ID está congelado no Plano Técnico)`

**Status:** `ready-for-agent`

## Escopo de Arquivos

- `src/features/promotions/hooks/use-offer-brief-draft.ts` (Ajuste de getInitialFields, setReferenceImageDataUrl e setStylePresetId para respeitar o modo de referência)
- `src/features/promotions/components/wizard/step4-style-and-palette.tsx` (Renderização do card especial de referência, desacoplamento da seleção default do primeiro preset do catálogo)
- `src/features/promotions/components/offer-creation-wizard.test.tsx` (Novos testes de integração do Passo 4 com print de referência ativo, seleção padrão e override)

## Acceptance Criteria (BDD)

- [ ] **Given** um rascunho com `referenceImageDataUrl` preenchido no Passo 3, **When** o usuário avança para o Passo 4, **Then** o hook `useOfferBriefDraft` mantém `stylePresetId` como `"reference-style"`, não forçando o primeiro preset do segmento.
- [ ] **Given** a renderização de `Step4StyleAndPalette` com `referenceImageDataUrl` presente, **When** a tela é exibida, **Then**:
  - Exibe o card destacado **"Estilo do seu Print de Referência"** (`data-testid="reference-style-card"`) com miniatura do print, selo *"Ativo / Recomendado"* e estado selecionado ativo (`aria-pressed="true"`).
  - Nenhum dos mini-posts do catálogo na grade 2x3 abaixo é marcado como selecionado por padrão.
- [ ] **Given** o card especial de referência ativo no Passo 4, **When** o usuário clica em um dos mini-posts do catálogo (ex: segundo preset), **Then** o preset clicado torna-se selecionado e o card de referência é desmarcado.
- [ ] **Given** um preset de catálogo selecionado no Passo 4 na presença de `referenceImageDataUrl`, **When** o usuário clica novamente no card especial de referência, **Then** o estilo de referência é reativado como selecionado e os presets do catálogo são desmarcados.
- [ ] **Given** que o usuário remove ou limpa a imagem de referência no Passo 3, **When** retorna ao Passo 4, **Then** o card de referência desaparece e o sistema volta ao comportamento padrão com seleção de catálogo.
- [ ] **Given** a suíte de testes `offer-creation-wizard.test.tsx`, **When** `pnpm vitest run src/features/promotions/components/offer-creation-wizard.test.tsx && pnpm typecheck && ./.agents/scripts/verify.sh --shadcn` é executado, **Then** todos os testes passam com zero erros de tipo e 100% de conformidade de acessibilidade e Shadcn UI.
