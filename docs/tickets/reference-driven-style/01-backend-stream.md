# 01: Modo `REFERENCE_DRIVEN` no `AdCardGenerator` e Eliminação de Attention Bleeding

**Spec:** [`docs/specs/reference-driven-style.md`](../../specs/reference-driven-style.md)
**Plan:** [`docs/plans/reference-driven-style.md`](../../plans/reference-driven-style.md)

**What to build:**
No Deep Module `AdCardGenerator` (`src/features/promotions/server/services/ai-card-generator.service.ts`), implementar o modo `REFERENCE_DRIVEN` para quando o usuário fornecer um print de referência (`referenceImageDataUrl`) e não tiver forçado um preset de catálogo (ou seja, `stylePresetId` for nulo, indefinido ou `"reference-style"`). No compilador de prompt, injetar uma diretriz autoritativa de direção de arte para o Gemini atuar como diretor de arte replicando a estética, grid, tipografia, iluminação e paleta da imagem de referência anexa. Eliminar estritamente a injeção de diretrizes, nomes de presets, códigos HEX e blueprints de catálogo (`presets[0]`, `#000000`, `dark-luxury`, `retail-burst`) quando o modo `REFERENCE_DRIVEN` estiver ativo, acabando com a poluição de prompt e o "attention bleeding". Se o usuário tiver selecionado conscientemente um preset de catálogo tendo uma referência, manter a estratégia híbrida coerente. Exportar a constante `REFERENCE_STYLE_PRESET_ID = "reference-style"` e o helper `isReferenceDrivenMode(...)`. Adicionar testes unitários completos em `ai-card-generator.service.test.ts`.

**Blocked by:** `None (can start immediately)`

**Status:** `ready-for-agent`

## Escopo de Arquivos

- `src/features/promotions/data/offer-brief.schema.ts` (Export da constante REFERENCE_STYLE_PRESET_ID)
- `src/features/promotions/server/services/ai-card-generator.service.ts` (Implementação do modo REFERENCE_DRIVEN, helper de modo e compilador de 4 camadas adaptado)
- `src/features/promotions/server/services/ai-card-generator.service.test.ts` (Testes unitários cobrindo modo de referência puro, modo híbrido e modo catálogo)

## Acceptance Criteria (BDD)

- [ ] **Given** uma requisição de geração com `referenceImageDataUrl` presente e `stylePresetId` nulo, indefinido ou `"reference-style"`, **When** `isReferenceDrivenMode(input)` é avaliado, **Then** retorna `true`.
- [ ] **Given** `isReferenceDrivenMode(input) === true`, **When** `buildPromptText(input, segmentConfig)` compila o prompt para o Gemini, **Then** o prompt:
  - Contém `--- DIRETRIZ DE DIREÇÃO DE ARTE: REPLICAÇÃO ESTÉTICA DA IMAGEM DE REFERÊNCIA ---`.
  - Contém instruções para emular a distribuição espacial, grid, paleta dominante, tipografia, iluminação e atmosfera da imagem de referência anexa.
  - Estrutura as 4 camadas narrativas derivadas 100% da imagem de referência anexa.
  - **NÃO CONTÉM** nomes de presets do catálogo (ex: `"Dark Burger & Fumaça"`, `"Boutique Minimalista"`), **NÃO CONTÉM** códigos HEX específicos do preset (ex: `#111111`, `#DC2626`, `#E11D48`), e **NÃO CONTÉM** especificações de blueprint de layout (`LayoutVariant: retail-burst`, `spatialGrid` de catálogo).
- [ ] **Given** uma requisição de geração com `referenceImageDataUrl` presente E `stylePresetId` preenchido com um preset de catálogo válido (ex: `"burger-gourmet-clean"` ou `"fashion-modern"`), **When** `buildPromptText` é executado, **Then** adota a estratégia híbrida (mantém o preset selecionado com prioridade cromática para a referência via `ResolveArtDirectionOptions`).
- [ ] **Given** uma requisição de geração sem `referenceImageDataUrl`, **When** `buildPromptText` é executado, **Then** o comportamento canônico existente permanece 100% inalterado.
- [ ] **Given** a suíte de testes `ai-card-generator.service.test.ts`, **When** `pnpm vitest run src/features/promotions/server/services/ai-card-generator.service.test.ts && pnpm typecheck` é executado, **Then** todos os testes passam em 1-2s com zero erros de TypeScript.
