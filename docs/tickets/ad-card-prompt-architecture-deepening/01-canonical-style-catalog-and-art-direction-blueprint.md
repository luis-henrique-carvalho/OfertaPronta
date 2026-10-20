# 01: Catálogo Canônico Unificado de `StylePreset` e Blueprints Arquiteturais por `LayoutVariant`

**Spec:** [`docs/specs/ad-card-prompt-architecture-deepening.md`](../../specs/ad-card-prompt-architecture-deepening.md)
**Plan:** [`docs/plans/ad-card-prompt-architecture-deepening.md`](../../plans/ad-card-prompt-architecture-deepening.md)

**What to build:** Implementar a arquitetura modular desacoplada em `src/features/promotions/data/segments/` (`types.ts`, `registry.ts`, `index.ts` e pasta `definitions/` com 1 arquivo autocontido para cada um dos 7 `BusinessSegment`), consolidando o `SegmentRegistry` como a Fonte Única da Verdade (*Single Source of Truth*) dos 28 `CuratedStylePreset` (4 por segmento). Adicionar os blueprints espaciais/tipográficos/ópticos para cada `LayoutVariant` (`LAYOUT_VARIANT_BLUEPRINTS`), enriquecer `resolveArtDirectionDirective(segment, presetId, options?)` para injetar os metadados de `mockup` (HEX `bgColor`, `accentColor`, `textColor`, `badgeText`, `layoutVariant`), `commercialGuide` e opções adaptativas, e re-exportar fachadas canônicas retrocompatíveis em `style-presets-catalog.ts`, `creation-catalog.ts` e `offer-brief.schema.ts`, permitindo que novos segmentos sejam adicionados no futuro criando apenas um arquivo em `definitions/` sem tocar em nenhum outro arquivo!

**Blocked by:** `None (can start immediately)`

**Status:** `completed`

## Escopo de Arquivos

- `src/features/promotions/data/segments/types.ts` (Novo: Contratos canônicos SegmentDefinition, CuratedStylePreset, etc.)
- `src/features/promotions/data/segments/registry.ts` (Novo: Implementação profunda do SegmentRegistry singleton)
- `src/features/promotions/data/segments/index.ts` (Novo: Ponto de entrada e fachada canônica do registro)
- `src/features/promotions/data/segments/definitions/supermarket.segment.ts` (Novo)
- `src/features/promotions/data/segments/definitions/fashion.segment.ts` (Novo)
- `src/features/promotions/data/segments/definitions/beauty-salon.segment.ts` (Novo)
- `src/features/promotions/data/segments/definitions/pizzeria.segment.ts` (Novo)
- `src/features/promotions/data/segments/definitions/burger-shop.segment.ts` (Novo)
- `src/features/promotions/data/segments/definitions/restaurant.segment.ts` (Novo)
- `src/features/promotions/data/segments/definitions/local-retail.segment.ts` (Novo)
- `src/features/promotions/data/style-presets-catalog.ts` (Fachada canônica retrocompatível consumindo SegmentRegistry)
- `src/features/promotions/data/creation-catalog.ts` (Fachada canônica retrocompatível derivando styles do SegmentRegistry)
- `src/features/promotions/data/offer-brief.schema.ts` (SEGMENT_CATALOG derivando do SegmentRegistry)
- `src/features/promotions/data/style-presets-catalog.test.ts`
- `src/features/promotions/data/creation-catalog.test.ts`

## Acceptance Criteria (BDD)

- [x] **Given** `src/features/promotions/data/segments/`, **When** `SegmentRegistry.getSegment(segment)` é chamado para qualquer um dos 7 `BusinessSegment` (`fashion`, `supermarket`, `beauty-salon`, `pizzeria`, `burger-shop`, `restaurant`, `local-retail`), **Then** retorna a `SegmentDefinition` carregada de seu arquivo isolado em `definitions/<segment>.segment.ts`, contendo metadados, placeholders, diretriz cênica de IA e exatamente os 4 `CuratedStylePreset` canônicos (totalizando 28 estilos únicos com `paletteSwatches` de 3 cores HEX válidas e `CommercialGuide` completo).
- [x] **Given** a adição futura de um novo segmento (ex: `pet-shop.segment.ts`), **When** um novo arquivo de definição é adicionado em `definitions/`, **Then** ele é registrado no `SegmentRegistry` sem exigir alterações em `creation-catalog.ts`, `ai-card-generator.service.ts` ou nos componentes do wizard (Locality Absoluta).
- [x] **Given** `src/features/promotions/data/style-presets-catalog.ts` e `creation-catalog.ts`, **When** `getSegmentPresets(segment)` ou `CREATION_CATALOG[segment].styles` é inspecionado, **Then** ambos retornam estilos canônicos sincronizados derivados do `SegmentRegistry`, preservando todos os exports históricos (`LayoutType`, `StyleVisualOption`, `CuratedStylePreset`, `CREATION_CATALOG`, `getCreationSegment`, etc.).
- [x] **Given** um ID de estilo legado (ex.: `"pizza-rustic"`, `"market-red"`, `"burger-dark"`, `"beauty-rose"`), **When** `getPresetById`, `resolveArtDirectionDirective` ou `getCreationStyleById` é chamado, **Then** resolve graciosamente para o respectivo preset canônico (`"pizza-rustic-wood"`, `"market-discount"`, `"burger-dark-bold"`, `"salon-glamour"`) via `LEGACY_PRESET_ID_ALIASES`.
- [x] **Given** `resolveArtDirectionDirective(segment, presetId, options?)`, **When** invocado para qualquer preset, **Then** preserva as 5 linhas contratuais originais e adiciona as especificações profundas do `LAYOUT_VARIANT_BLUEPRINTS[preset.mockup.layoutVariant]` (grid espacial, família tipográfica descritiva, setup óptico de câmera/lente/iluminação, códigos HEX `bgColor`/`textColor`/`accentColor`, estilo de badge e opções adaptativas para `hasReferenceImage`, `hasCustomPalette` e `hasPromoPrice: false`).
- [x] **Given** as suítes de teste unitário `style-presets-catalog.test.ts`, `creation-catalog.test.ts` e `offer-brief.schema.test.ts`, **When** `pnpm vitest run src/features/promotions/data/style-presets-catalog.test.ts src/features/promotions/data/creation-catalog.test.ts src/features/promotions/data/offer-brief.schema.test.ts && pnpm typecheck` é executado, **Then** todos os testes passam em 1-2s com zero erros de TypeScript.
