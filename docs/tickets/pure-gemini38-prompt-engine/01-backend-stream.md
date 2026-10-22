# Ticket 01: Backend Stream — Pure Gemini 3.8 Prompt Engine (Zero Hardcoded Art Direction)

**Status:** `DONE`  
**Responsável:** `backend-builder`  
**Referência:** `docs/plans/pure-gemini38-prompt-engine.md`

---

## 1. Contexto e Objetivo
Eliminar resquícios de prompts hardcoded (`SEGMENT_AUTHOR_PROFILES`, templates de 4 camadas legados e templates estáticos gigantes de edição) em `src/server/prompt-engine/`.
Tornar o `gemini-3.8-flash` 100% responsável pela autoria dos Master Prompts tanto no fluxo de criação quanto no fluxo de regeneração/edição.

---

## 2. Tarefas de Implementação

1. **`src/server/prompt-engine/dynamic-planner.ts`**:
   - Remover `SEGMENT_AUTHOR_PROFILES`.
   - Simplificar `buildMasterPromptAuthorContents(input)` para passar briefing + estilo + imagens sem clichês pré-fabricados.
   - Atualizar `planDynamicEditIntent`:
     - O Gemini 3.8 Flash deve classificar a intenção (`mode: "RECOMPOSE" | "SURGICAL"`) E, para o modo `RECOMPOSE`, redigir o `authoredMasterPrompt` reestruturado.
     - Retornar `{ mode, authoredMasterPrompt, reason, source }`.
   - Reduzir `buildDeterministicCompositionBrief` para um fallback mínimo conciso.

2. **`src/server/prompt-engine/edit-prompt-compiler.ts`**:
   - Simplificar drasticamente os templates estáticos legados (`buildRecomposePromptTemplate` e `buildSurgicalPromptTemplate`), mantendo apenas strings mínimas para fallback síncrono offline.

3. **`src/server/prompt-engine/prompt-compiler.ts`**:
   - Em `compileDynamicCardPrompt`:
     - Para cards com `baseCardImageDataUrl`: se `planDynamicEditIntent` retornar `authoredMasterPrompt`, usar diretamente com `assembleAuthoredMasterPrompt`.
     - Para criação inicial: usar `brief.authoredMasterPrompt` com `assembleAuthoredMasterPrompt`.
   - Em `buildMultimodalPromptPartsAsync`: garantir que em modo `RECOMPOSE` a imagem base não seja enviada como `inlineData` para destravar os pixels.

4. **`src/server/prompt-engine/prompt-engine.test.ts`**:
   - Atualizar testes existentes para refletir a nova arquitetura enxuta.
   - Garantir que todos os testes passam com `pnpm vitest run src/server/prompt-engine/prompt-engine.test.ts` e `pnpm typecheck`.

---

## 3. Critérios de Aceite
- [x] `SEGMENT_AUTHOR_PROFILES` completamente removido de `dynamic-planner.ts`.
- [x] `gemini-3.8-flash` é autor do master prompt tanto na criação inicial quanto na regeneração `RECOMPOSE`.
- [x] Fallback determinístico síncrono mantido de forma concisa e limpa (sem bloat).
- [x] `pnpm vitest run src/server/prompt-engine/prompt-engine.test.ts` passa 100%.
- [x] `pnpm typecheck` passa com zero erros de tipo.
