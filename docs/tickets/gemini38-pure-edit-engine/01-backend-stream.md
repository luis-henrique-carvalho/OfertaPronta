# Macro-Ticket 01: Autoria Pura de Edição pelo Gemini 3.8 Flash & Preservação da Imagem Base

- **Status:** READY
- **Arquivo Alvo:**
  - `src/server/prompt-engine/types.ts`
  - `src/server/prompt-engine/dynamic-planner.ts`
  - `src/server/prompt-engine/prompt-compiler.ts`
  - `src/server/prompt-engine/edit-prompt-compiler.ts`
  - `src/server/prompt-engine/prompt-engine.test.ts`
  - `src/features/promotions/server/services/ai-card-generator.service.test.ts`

## Critérios de Aceite
1. `DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS` atualizado para 25.000ms.
2. `buildBaseCardMultimodalParts` anexa obrigatoriamente `input.baseCardImageDataUrl` em todos os modos (inclusive `RECOMPOSE`), garantindo consistência visual do produto e modelo.
3. `edit-prompt-compiler.ts` sem templates hardcoded de texto de mais de 100 linhas; fallback conciso e limpo.
4. `planDynamicEditIntent` instrui expressamente o `gemini-3.8-flash` a manter fidelidade estética e do sujeito à imagem base.
5. Todos os testes unitários de prompt-engine e ai-card-generator passando 100%.
