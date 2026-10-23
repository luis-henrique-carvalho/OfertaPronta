# 03: Server Function RPC & Atomic Quota Enforcement for AI Previews

**Spec:** [`docs/specs/epico-2-ai-generation-export.md`](../../specs/epico-2-ai-generation-export.md)

**What to build:**
Criar a Server Function TanStack Start `generatePreviewFn` (`src/features/promotions/server/functions/generator.functions.ts`) que conecta a requisição do usuário aos módulos profundos `AdCardGenerator` e `ExportEngine`. A Server Function deve aplicar rigorosamente a regra de negócio da cota gratuita (exatamente 1 geração gratuita por rascunho) com atualização atômica no banco de dados e garantia de que falhas transitórias de IA não consumam a cota do microempresário.

**Blocked by:**

- [`docs/tickets/epico-2-ai-generation-export/01-export-engine-watermark-and-formatting.md`](./01-export-engine-watermark-and-formatting.md)
- [`docs/tickets/epico-2-ai-generation-export/02-ad-card-generator-gemini-multimodal.md`](./02-ad-card-generator-gemini-multimodal.md)

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Fronteira RPC TanStack Start (`generator.functions.ts`):**
  - Implementar a Server Function `generatePreviewFn`:
    ```typescript
    export const generatePreviewFn = createServerFn({ method: "POST" })
      .validator((input: unknown) => generatePreviewInputSchema.parse(input))
      .handler(async ({ data }) => { ... });
    ```
  - Schema de entrada validado com Zod: `generatePreviewInputSchema` recebendo `{ draftId: string }`.
  - Exportar a Server Function e tipos de DTO em `src/features/promotions/server/index.ts`.

- [ ] **Controle Rígido de Cota de Prévia Gratuita:**
  - **Given** um rascunho persistido no banco com `aiGenerationCount >= 1`,
  - **When** `generatePreviewFn` for chamado com esse `draftId`,
  - **Then** deve interromper a execução ANTES de chamar o Gemini e retornar:
    ```typescript
    {
      success: false,
      code: "AI_QUOTA_EXCEEDED",
      message: "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a até 3 regenerações.",
      previewUrl: draft.previewCardImageUrl,
      aiGenerationCount: draft.aiGenerationCount
    }
    ```

- [ ] **Fluxo de Geração com Sucesso e Persistência Atômica:**
  - **Given** um rascunho com `aiGenerationCount === 0`,
  - **When** `generatePreviewFn` for executado:
    1. Recupera o rascunho do banco via `getOfferDraft(draftId)`.
    2. Invoca `AdCardGenerator.generateAdCardImage(draft)`.
    3. Passa o buffer bruto para `ExportEngine.applyWatermark(rawBuffer)`.
    4. Atualiza a tabela `drafts` no PostgreSQL via Drizzle:
       - `previewCardImageUrl`: recebe o Data URL da imagem protegida com marca d'água.
       - `aiGenerationCount`: incrementado para `1`.
       - `updatedAt`: atualizado para o instante corrente.
    5. Retorna:
       ```typescript
       {
         success: true,
         previewUrl: string,
         aiGenerationCount: 1
       }
       ```

- [ ] **Proteção de Cota em Caso de Falha de Inferência:**
  - **Given** um rascunho com `aiGenerationCount === 0`,
  - **When** a chamada à IA falhar (timeout, rate limit 429 ou erro de conexão),
  - **Then**:
    - O contador `aiGenerationCount` NÃO deve ser incrementado.
    - O banco de dados NÃO deve ter o rascunho corrompido.
    - A função deve retornar erro controlado:
      ```typescript
      {
        success: false,
        code: "AI_GENERATION_FAILED",
        message: "Não foi possível gerar a arte no momento. Nenhuma cota foi consumida. Por favor, tente novamente.",
        aiGenerationCount: 0
      }
      ```

- [ ] **Testes de Integração e Máquina de Estados:**
  - Implementar suíte de testes em `src/features/promotions/server/functions/generator.functions.test.ts`.
  - Cobrir:
    - Rascunho inexistente (erro `NOT_FOUND`).
    - Geração de 1ª prévia gratuita com sucesso e incremento de cota.
    - Tentativa de 2ª geração gratuita bloqueada com `AI_QUOTA_EXCEEDED`.
    - Simulação de erro da IA garantindo preservação de cota (`aiGenerationCount = 0`).
