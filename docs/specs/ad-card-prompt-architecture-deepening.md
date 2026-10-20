# Spec: Aprofundamento Arquitetural do `AdCardGenerator` e Unificação Canônica de `StylePreset` (Custo Zero)

- **Slug**: `ad-card-prompt-architecture-deepening`
- **Status**: `ready-for-agent`
- **Pesquisa Base**: [`docs/research/ai-card-design-quality-and-prompt-engineering.md`](../research/ai-card-design-quality-and-prompt-engineering.md)

## Problem Statement

O motor de geração de Cards Publicitários (`AdCardGenerator` em [`src/features/promotions/server/services/ai-card-generator.service.ts`](../../src/features/promotions/server/services/ai-card-generator.service.ts)) e os catálogos de estilos visuais ([`src/features/promotions/data/style-presets-catalog.ts`](../../src/features/promotions/data/style-presets-catalog.ts) e [`src/features/promotions/data/creation-catalog.ts`](../../src/features/promotions/data/creation-catalog.ts)) apresentam 3 falhas estruturais diagnosticadas em [`docs/research/ai-card-design-quality-and-prompt-engineering.md`](../research/ai-card-design-quality-and-prompt-engineering.md):

1. **Bug Silencioso de Serialização na Costura do SDK `@google/genai` (`responseFormat` vs. `imageConfig`)**:
   - `generateAdCardImage` passa `config.responseFormat.image = { aspectRatio, imageSize: "2K" }`, propriedade inexistente no serializador `generateContentConfigToMldev` do SDK `@google/genai` v2.30.0 (que lê exclusivamente `config.imageConfig`).
   - Como consequência, `aspectRatio` (`"4:5"` ou `"9:16"`) é 100% descartado antes da requisição HTTP sair do Node.js; o Gemini gera imagens quadradas (`1:1`, `1024×1024`) por padrão e o `ExportEngine` aplica `fit: "cover"` decepando ~20% das laterais esquerda e direita (cortando textos, preços e logos).
2. **Deriva e Duplicação entre Catálogos de Estilo (`creation-catalog.ts` vs. `style-presets-catalog.ts`) + Descarte de 60% dos Metadados**:
   - `creation-catalog.ts` mantém arrays literais paralelos de estilos com IDs divergentes (ex.: `market-red`, `pizza-rustic`, `beauty-rose`, `burger-dark`, `rest-homestyle`, `retail-clean`) que não existem em `style-presets-catalog.ts` (`market-discount`, `pizza-rustic-wood`, `salon-glamour`, `burger-dark-bold`, `restaurant-homestyle`, `retail-vibrant`).
   - Quando o microempresário seleciona um estilo no Passo 4 do `OfferCreationWizard`, o backend não encontra o ID em `style-presets-catalog.ts` e cai silenciosamente no fallback `presets[0]`.
   - Além disso, `resolveArtDirectionDirective` extrai apenas 4 strings de `preset.artDirection` e descarta `preset.mockup` (`layoutVariant`, `bgColor`, `textColor`, `accentColor`, `badgeText`), `preset.paletteSwatches` e `preset.commercialGuide`.
3. **Prompt Fragmentado em Bullets vs. Compilação Narrativa em Camadas**:
   - `buildPromptText()` em `ai-card-generator.service.ts` envia uma lista rasa de tópicos desconectados, sem especificações ópticas de câmera/lente/iluminação física, sem geometria espacial por `LayoutVariant` e sem construção narrativa passo a passo recomendada pelo Guia Oficial de Prompting do Gemini Nano Banana.

## Solution

Aprofundar os módulos `StylePresetsCatalog` e `AdCardGenerator` com **Custo Zero Adicional de Inferência** (mantendo `gemini-nano-banana-2.1`, 1 única chamada por geração e resolução base `1K` = 1120 tokens), consolidando as 3 decisões arquiteturais aprovadas no Grilling Loop:

1. **Módulo Profundo `SegmentRegistry` e Desacoplamento Modular por Segmento**:
   - Criação da arquitetura modular em [`src/features/promotions/data/segments/`](../../src/features/promotions/data/segments/):
     - `types.ts`: Contratos canônicos (`SegmentDefinition`, `CuratedStylePreset`, `LayoutVariant`, `StyleMockupSpec`, `ArtDirectionDirective`, `CommercialGuide`).
     - `registry.ts`: Implementação profunda do registro singleton com indexação O(1), validação Zod e lookup gracioso.
     - `definitions/<segment>.segment.ts`: **1 arquivo coeso por segmento** (`supermarket`, `fashion`, `beauty-salon`, `pizzeria`, `burger-shop`, `restaurant`, `local-retail`), encapsulando metadados, placeholders, diretriz cênica de IA e seus 4 presets de estilo. Adicionar novos segmentos no futuro requer apenas criar um novo arquivo em `definitions/` sem tocar em nenhum outro arquivo!
   - [`src/features/promotions/data/style-presets-catalog.ts`](../../src/features/promotions/data/style-presets-catalog.ts) torna-se a fachada canônica retrocompatível consumindo `SegmentRegistry`, expondo `mapPresetToStyleVisualOption(preset)` e `LEGACY_PRESET_ID_ALIASES`.
   - [`src/features/promotions/data/creation-catalog.ts`](../../src/features/promotions/data/creation-catalog.ts) e [`src/features/promotions/data/offer-brief.schema.ts`](../../src/features/promotions/data/offer-brief.schema.ts) (`SEGMENT_CATALOG`) derivam seus dados diretamente do `SegmentRegistry`, garantindo 100% de sincronia entre o Wizard e o backend sem quebrar nenhum import existente.
2. **Compilador Narrativo Adaptativo em 4 Camadas no `AdCardGenerator` + Blueprints Geométricos por `LayoutVariant`**:
   - Enriquecer `resolveArtDirectionDirective(segment, presetId, options?)` em `style-presets-catalog.ts` com blueprints arquiteturais por `LayoutVariant` (`retail-burst`, `fresh-organic`, `dark-luxury`, `rustic-wood`, `clean-minimal`, `neon-urban`), injetando grid espacial, família tipográfica descritiva, estilo de badge, setup óptico de câmera/iluminação e códigos HEX exatos (`mockup.bgColor`, `mockup.accentColor`, `mockup.textColor`, `paletteSwatches`).
   - Estruturar `buildPromptText()` em `ai-card-generator.service.ts` em **4 Camadas Narrativas Progressivas**:
     - **Camada 1 (Fundo Full-Bleed & Atmosfera)**: Enquadramento positivo *full-bleed edge-to-edge* preenchendo 100% do canvas até as 4 bordas, paleta HEX exata do preset, cedendo prioridade cromática quando o comerciante enviar `referenceImageDataUrl` ou paleta customizada em `customStyleInstructions`.
     - **Camada 2 (Sujeito Hero & Óptica Fotográfica Comercial)**: Especificação explícita de ângulo de câmera, lente comercial (`85mm f/2.8 macro`, `50mm f/2.8 studio`, etc.), iluminação física (`three-point softbox lighting`, `rim light`, sombras de contato realistas) e preservação fiel da `Product Image` quando enviada.
     - **Camada 3 (Geometria de Grid, Safe Zone & Tipografia Descritiva)**: Coordenadas espaciais do `LayoutVariant`, família tipográfica descritiva, selo contextualizado ao `Offer Brief` / `cardIntent`, incorporação fiel do logotipo (`logoImageDataUrl`) e respeito estrito à `SAFE ZONE OBRIGATÓRIA` (15% no topo e 15% na base para `9:16` Story).
     - **Camada 4 (Ancoragem do Preço / Mensagem Institucional & Rodapé)**: Container do preço promocional em destaque máximo usando `mockup.accentColor` (ou diretriz institucional estrita sem preços nem `"R$ 0,00"` quando `promoPrice` for vazio) + barra de CTA e WhatsApp.
3. **Correção da Costura do SDK `@google/genai` a Custo Zero (`imageConfig`)**:
   - Em `ai-card-generator.service.ts`, substituir `responseFormat` por `imageConfig: { aspectRatio: geminiAspectRatio, imageSize: "1K" }`, garantindo geração nativa em `4:5` (`928×1152`) ou `9:16` (`768×1376`) pelo custo base de 1120 tokens e eliminando o corte lateral no `ExportEngine`.

## User Stories

1. Como um **Microempresário (`Merchant`)** no Passo 4 do Wizard de Criação (`/criar`), quero que o estilo visual que selecionei na miniatura (`StyleMiniPostCard`) seja exatamente o mesmo `StylePreset` utilizado pela IA no servidor, para que a paleta de cores, o layout e a atmosfera do card gerado correspondam fielmente à opção escolhida.
2. Como um **Microempresário (`Merchant`)**, quero que o Card Publicitário gerado para Feed (`4:5`) e Story (`9:16`) já saia do modelo Gemini na proporção nativa correta sem ter 20% das bordas laterais decepadas no pós-processamento, para que nenhum texto, preço ou logotipo apareça cortado.
3. Como um **Microempresário (`Merchant`)** que envia um Print de Referência (`referenceImageDataUrl`) ou escolhe um chip de Paleta da Loja (`customStyleInstructions`), quero que o compilador de prompt priorize a atmosfera cromática da minha referência/paleta sem conflitar com cores fixas do preset padrão, mantendo a estrutura de grid e tipografia profissional.
4. Como um **Microempresário (`Merchant`)** que cria um Card Institucional (ex.: `new-arrival`, `special-date`, `announcement`, `schedule` sem `promoPrice`), quero que a direção de arte adapte os selos e o rodapé para o objetivo institucional sem desenhar badges de preço vazios nem inserir `"R$ 0,00"`.

## Testing Decisions

- **A Interface é a Superfície de Teste**:
  - Testar `style-presets-catalog.ts` e `creation-catalog.ts` em `src/features/promotions/data/style-presets-catalog.test.ts` e `src/features/promotions/data/creation-catalog.test.ts`, validando:
    - Os 28 estilos canônicos (4 por cada um dos 7 `BusinessSegment`) e paridade 1:1 de IDs entre `getSegmentPresets(segment)` e `getSegmentStyles(segment)` / `CREATION_CATALOG[segment].styles`.
    - Mapeamento determinístico de `CuratedStylePreset` para `StyleVisualOption` (`layoutType`, `paletteSwatches`, `badgeText`, `tag`, classes de preview).
    - Resolução de aliases legados (`LEGACY_PRESET_ID_ALIASES`) em `getPresetById` e `resolveArtDirectionDirective`.
    - Preservação de todas as substrings contratuais existentes em `resolveArtDirectionDirective` acrescidas dos metadados de `mockup` (HEX `bgColor`, `accentColor`, `textColor`, `layoutVariant`), `commercialGuide` e blueprint óptico/tipográfico.
  - Testar `generateAdCardImage` em `src/features/promotions/server/services/ai-card-generator.service.test.ts` com fake client (`createFakeGeminiClient`), validando:
    - Envio de `config.imageConfig = { aspectRatio: "4:5" | "9:16", imageSize: "1K" }` e `config.responseModalities = ["image"]`.
    - Presença das 4 camadas narrativas no prompt sintetizado (Camada 1 Full-Bleed, Camada 2 Sujeito Hero & Óptica, Camada 3 Grid, Safe Zone & Tipografia, Camada 4 Ancoragem de Preço/Institucional & Rodapé).
    - Adaptação de prioridade cromática quando `referenceImageDataUrl` ou `customStyleInstructions` estão presentes.
    - Preservação integral dos contratos existentes (edição cirúrgica com `baseCardImageDataUrl`, logotipo `logoImageDataUrl`, 6 `cardIntent`, supressão de preço proibindo `"R$ 0,00"`, `SAFE ZONE OBRIGATÓRIA` de 15% para Story).

## Out of Scope

- Alteração de modelo de IA ou múltiplas chamadas de inferência por card (mantém estritamente `gemini-nano-banana-2.1` com 1 chamada e `imageSize: "1K"`).
- Alterações em schemas de banco de dados PostgreSQL/Drizzle (nenhuma migração SQL é necessária, pois `stylePresetId` é armazenado como `text`).
- Redesign de componentes visuais ou rotas (os componentes `Step4StyleAndPalette`, `StyleMiniPostCard` e `StylePresetGallery` continuam consumindo as mesmas assinaturas públicas).
