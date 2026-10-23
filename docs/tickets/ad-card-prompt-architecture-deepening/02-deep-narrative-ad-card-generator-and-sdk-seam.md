# 02: Compilador Narrativo de 4 Camadas no `AdCardGenerator` e Correção da Costura `imageConfig` no SDK `@google/genai`

**Spec:** [`docs/specs/ad-card-prompt-architecture-deepening.md`](../../specs/ad-card-prompt-architecture-deepening.md)
**Plan:** [`docs/plans/ad-card-prompt-architecture-deepening.md`](../../plans/ad-card-prompt-architecture-deepening.md)

**What to build:** Corrigir a costura de configuração do SDK `@google/genai` em `src/features/promotions/server/services/ai-card-generator.service.ts` substituindo `responseFormat` por `imageConfig: { aspectRatio: geminiAspectRatio, imageSize: "1K" }` (custo base de 1120 tokens, zero aumento de custo), e aprofundar `buildPromptText()` em um **Compilador Narrativo Adaptativo de 4 Camadas** (Camada 1: Fundo Full-Bleed & Atmosfera; Camada 2: Sujeito Hero & Óptica Fotográfica Comercial; Camada 3: Geometria de Grid, Safe Zone & Tipografia Descritiva; Camada 4: Ancoragem de Preço/Mensagem Institucional & Rodapé), preservando 100% das substrings de contrato validadas pelos testes existentes.

**Blocked by:** `01-canonical-style-catalog-and-art-direction-blueprint.md` (consome `resolveArtDirectionDirective`, `getPresetById`, `getSegmentPresets` e `LAYOUT_VARIANT_BLUEPRINTS` de `style-presets-catalog.ts`)

**Status:** `completed`

## Escopo de Arquivos

- `src/features/promotions/server/services/ai-card-generator.service.ts`
- `src/features/promotions/server/services/ai-card-generator.service.test.ts`

## Acceptance Criteria (BDD)

- [x] **Given** `generateAdCardImage(input, client)` em `src/features/promotions/server/services/ai-card-generator.service.ts`, **When** invocado para `targetAspectRatio: "feed"` (default) ou `"story"`, **Then** chama `geminiClient.models.generateContent` com `model: "gemini-nano-banana-2.1"`, `config.responseModalities: ["image"]` e `config.imageConfig: { aspectRatio: "4:5" | "9:16", imageSize: "1K" }`.
- [x] **Given** uma geração completa de card (`baseCardImageDataUrl` ausente), **When** `buildPromptText` compila o prompt textual, **Then** estrutura a direção de arte nas **4 Camadas Narrativas Progressivas**:
  - `CAMADA 1 — FUNDO FULL-BLEED & ATMOSFERA`: enquadramento positivo _full-bleed edge-to-edge_ preenchendo 100% do canvas até as 4 extremidades sem margens externas, aplicando os códigos HEX do preset (`bgColor`, `accentColor`, `textColor`) ou cedendo prioridade cromática quando `referenceImageDataUrl` ou `customStyleInstructions` estiverem presentes.
  - `CAMADA 2 — SUJEITO HERO & ÓPTICA FOTOGRÁFICA COMERCIAL`: ângulo de câmera, lente comercial (`85mm f/2.8`, `50mm f/2.8`, etc.), iluminação física de estúdio e sombras de contato do `LayoutVariant`, preservando com fidelidade a `FOTO DO PRODUTO` quando anexada.
  - `CAMADA 3 — GEOMETRIA DE GRID, SAFE ZONE & TIPOGRAFIA DESCRITIVA`: posicionamento espacial do `LayoutVariant`, família tipográfica descritiva, incorporação do `LOGOTIPO DA LOJA FORNECIDO` quando anexo, e `SAFE ZONE OBRIGATÓRIA` (`15% da altura no topo e 15% na base`) quando `targetAspectRatio === "story"`.
  - `CAMADA 4 — ANCORAGEM DE PREÇO & RODAPÉ COMERCIAL`: container de preço promocional em destaque máximo na cor `accentColor` quando `promoPrice` estiver preenchido, ou diretriz institucional estrita proibindo preços e `'R$ 0,00'` quando `promoPrice` for vazio, mais CTA e WhatsApp no rodapé.
- [x] **Given** todos os contratos existentes de `ai-card-generator.service.ts`, **When** a suíte de testes é executada, **Then** todas as invariantes anteriores permanecem intactas (`EDIÇÃO CIRÚRGICA DE IMAGEM EXISTENTE`, `PRESERVAÇÃO ESTRITA`, `PROIBIDO REINVENTAR`, `SAFE ZONE OBRIGATÓRIA`, `15% da altura no topo e 15% na base`, `LOGOTIPO DA LOJA FORNECIDO`, `ESTE É UM CARD INSTITUCIONAL / INFORMATIVO`, `DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL`, tratamento de erros `SAFETY_BLOCK`, `NO_IMAGE_RETURNED`, `RATE_LIMIT`, `TIMEOUT`, `CONFIG_ERROR`).
- [x] **Given** a suíte `src/features/promotions/server/services/ai-card-generator.service.test.ts`, **When** `pnpm vitest run src/features/promotions/server/services/ai-card-generator.service.test.ts && pnpm typecheck` é executado, **Then** todos os testes unitários (incluindo novos testes para `imageConfig`, 4 camadas narrativas, óptica fotográfica e adaptação cromática) passam em 1-2s com zero erros de TypeScript.
