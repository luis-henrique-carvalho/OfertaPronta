# 02: Integração do `PromptEngine` nos Serviços de Geração e Regeneração Pós-Pagamento

**Spec:** [`docs/specs/hybrid-dynamic-prompt-engine.md`](../../specs/hybrid-dynamic-prompt-engine.md)

**What to build:** Integrar o módulo centralizado `src/server/prompt-engine/` em `ai-card-generator.service.ts`, `post-payment-regeneration.service.ts` e `style-presets-catalog.ts`, eliminando o código de prompt duplicado/espalhado, ativando o pipeline híbrido dinâmico na geração de cards e destravando a edição adaptativa (`SURGICAL` vs. `RECOMPOSE`) e troca de `StylePreset` no fluxo de regeneração pós-pagamento.

**Blocked by:** [`01-decoupled-prompt-engine-and-hybrid-compiler.md`](./01-decoupled-prompt-engine-and-hybrid-compiler.md)

**Status:** `completed`

## Acceptance Criteria (BDD)

- [x] **Given** `src/features/promotions/server/services/ai-card-generator.service.ts`, **When** refatorado para consumir `src/server/prompt-engine/`, **Then** toda a lógica de construção de texto de prompt, edição e montagem de partes multimodais é delegada ao `PromptEngine` (mantendo re-exports limpos de `buildPromptText`, `buildSurgicalEditPromptText`, `buildMultimodalPromptParts` e `isReferenceDrivenMode` para compatibilidade retroativa), reduzindo drasticamente o acoplamento do serviço.
- [x] **Given** uma chamada a `generateAdCardImage(input, options)` em `ai-card-generator.service.ts`, **When** executada para criação inicial ou regeneração, **Then** utiliza o compilador do `PromptEngine` (incluindo o planejamento dinâmico híbrido com fallback seguro na criação inicial e o modo adaptativo `SURGICAL`/`RECOMPOSE` quando `baseCardImageDataUrl` estiver presente) antes de invocar o modelo de imagem `gemini-nano-banana-2.1` com `imageConfig: { aspectRatio, imageSize: "1K" }`.
- [x] **Given** `src/features/delivery/server/services/post-payment-regeneration.service.ts`, **When** o comerciante solicita uma regeneração pós-pagamento trocando o `stylePresetId` ou enviando `customInstructions` de reposicionamento (ex.: *"não botar o texto atrás do personagem"*), **Then** o serviço delega a montagem das instruções para `resolveRegenerationStyleInstructions` do `PromptEngine` sinalizando se houve troca de preset (`presetChanged`), destravando a recomposição visual e estilística nos cards Feed e Story gerados.
- [x] **Given** `src/features/promotions/data/style-presets-catalog.ts`, **When** `resolveArtDirectionDirective` é chamado, **Then** permanece 100% compatível com os contratos existentes sem introduzir imports de pacotes Node.js/server-only no bundle do cliente.
- [x] **Given** as suítes de teste existentes e atualizadas (`ai-card-generator.service.test.ts`, `post-payment-regeneration.service.test.ts` e `style-presets-catalog.test.ts`), **When** executadas via Vitest e `pnpm typecheck`, **Then** 100% dos testes passam validando a geração híbrida, anti-oclusão de texto e edição destravada por intenção.
