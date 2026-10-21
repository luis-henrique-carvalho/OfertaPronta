# 01: Módulo Profundo Centralizado `PromptEngine` e Compilador Dinâmico Híbrido (`src/server/prompt-engine/`)

**Spec:** [`docs/specs/hybrid-dynamic-prompt-engine.md`](../../specs/hybrid-dynamic-prompt-engine.md)

**What to build:** Extrair e centralizar 100% da inteligência de prompts, blueprints de direção de arte, montagem de partes multimodais, classificador de intenção de edição e o novo Compilador Dinâmico Híbrido em 2 Etapas (Planejador IA Diretor de Arte + Guardrails Determinísticos com Zero Oclusão Tipográfica + Fallback resiliente) dentro de um módulo profundo e desacoplado em `src/server/prompt-engine/`, acompanhado de sua suíte completa de testes unitários (`src/server/prompt-engine/prompt-engine.test.ts`).

**Blocked by:** `None (can start immediately)`

**Status:** `completed`

## Acceptance Criteria (BDD)

- [x] **Given** a arquitetura de prompts do OfertaPronta, **When** `src/server/prompt-engine/index.ts` é inspecionado, **Then** expõe uma interface pública coesa centralizando:
  - Compilação de geração inicial síncrona/determinística (`buildPromptText` / `compileDeterministicCardPrompt`) e híbrida assíncrona com IA (`compileDynamicCardPrompt` / `planDynamicCompositionBrief`);
  - Montagem multimodal ordenada (`buildMultimodalPromptParts`);
  - Classificação de intenção de edição (`detectEditIntentMode`: `'SURGICAL' | 'RECOMPOSE'`) e compilação de prompt de edição adaptativa (`buildSurgicalEditPromptText` / `buildAdaptiveEditPromptText`);
  - Resolução de direção de arte (`resolveArtDirectionDirective`, `isReferenceDrivenMode`, `resolveRegenerationStyleInstructions`).
- [x] **Given** um `Offer Brief` com ou sem imagens (`productImageDataUrl`, `referenceImageDataUrl`, `logoImageDataUrl`), **When** `compileDynamicCardPrompt` é executado com um client Gemini disponível, **Then** executa a Etapa 1 (Planejador Diretor de Arte via modelo rápido de texto/visão `gemini-3.8-flash`, `DEFAULT_GEMINI_PROMPT_MODEL = "gemini-3.8-flash"`, com timeout seguro) gerando uma diretriz criativa adaptada ao formato do sujeito e comprimento do título, e funde-a na Etapa 2 com os guardrails obrigatórios (fidelidade ortográfica PT-BR, Safe Zone 15% para Story `9:16`, ancestralidade cromática do preset/referência e proibição de `"R$ 0,00"` em cards sem preço).
- [x] **Given** que a Etapa 1 (Planejador IA) falha, excede o timeout ou o client retorna apenas binário de imagem sem texto (ex.: fakes de teste legados), **When** `compileDynamicCardPrompt` é chamado, **Then** aplica fallback automático e transparente para o compilador determinístico enxuto sem lançar erro nem interromper a geração do card.
- [x] **Given** qualquer prompt compilado (inicial ou de edição, dinâmico ou fallback), **When** o texto final do prompt é inspecionado, **Then** contém a diretriz explícita de **Zero Oclusão Tipográfica (`Zero Text Occlusion / 100% Foreground Text Priority`)**, proibindo que qualquer texto, título ou preço fique posicionado atrás de personagens, pessoas, rostos, cabelos ou produtos e orientando o posicionamento em áreas livres ou containers de alto contraste em 1º plano absoluto.
- [x] **Given** um pedido de edição/regeneração onde `customStyleInstructions` solicita mudança espacial/estrutural ou desobstrução (ex.: *"não colocar o texto atrás do personagem"*, *"mover o título para baixo"*, *"mudar o layout"*, *"trocar o fundo"*) ou quando `presetChanged === true`, **When** `detectEditIntentMode` e `buildAdaptiveEditPromptText` são chamados, **Then** classificam o modo como `'RECOMPOSE'`, removem a trava *"Mantenha 100% da estrutura, faixas e posições da IMAGEM BASE rigorosamente inalterados"* e instruem a IA a reposicionar livremente o layout e colocar o texto 100% visível em 1º plano.
- [x] **Given** um pedido de edição pontual sem mudança de layout/estilo (ex.: *"mudar o telefone para (11) 98888-7777"*), **When** `detectEditIntentMode` e `buildAdaptiveEditPromptText` são chamados, **Then** classificam o modo como `'SURGICAL'`, preservam a estrutura geral da imagem base aplicando a alteração solicitada e mantendo a proteção anti-oclusão de texto.
