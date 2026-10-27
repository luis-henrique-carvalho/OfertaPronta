# 01: Backend Stream — Catálogo de Cards de IA Reais, Persistência de Referência e Injeção Multimodal no Gemini

**Spec:** [`docs/specs/showcase-real-cards-reference.md`](../../specs/showcase-real-cards-reference.md)

**What to build:**
Substituir integralmente as fotos brutas de banco de imagens (Unsplash) por cards publicitários reais de IA no catálogo estático de semente (`SHOWCASE_SEED_CATALOG`) e na tabela `showcase_cards`, aprimorar o serviço de rascunhos (`drafts.service.ts`) para persistir URLs públicas de cards de referência sem perda de dados ou geração de chaves fictícias vazias, capacitar o gerador de prévias (`preview-generator.service.ts` / `resolveDraftVisualInputs`) a converter URLs externas de CDN/R2 em partes multimodais válidas (`InlineDataPart`) com timeout seguro (5s) e fallback determinístico offline para testes, e garantir que o `PromptEngine` e o `AdCardGenerator` recebam a arte da vitrine como referência estética multimodal preservando a foto do produto real quando presente (multimodalidade dupla).

**Blocked by:** `None (can start immediately)`

**Status:** `completed`

---

## Acceptance Criteria (BDD)

### 1. Catálogo de Cards de IA Reais & Showcase Service

- [x] **Dado** a consulta de cards de vitrine via `getShowcaseCards({ segment })` ou pela Server Function `getShowcaseCardsFn`, **quando** o banco ou o catálogo de semente for lido, **então** 100% dos cards retornados devem apontar para imagens de cards publicitários completos (diagramados com títulos, preços e composição publicitária em Cloudflare R2 ou asset público), com zero ocorrências de `images.unsplash.com`.
- [x] **Dado** qualquer um dos segmentos comerciais do catálogo (`supermarket`, `beauty-salon`, `pizzeria`, `burger-shop`, `restaurant`, `local-retail`, `fashion`), **quando** a vitrine for consultada, **então** deve retornar pelo menos 2 a 3 cards de alta qualidade com metadados ricos (`title`, `promoPrice`, `originalPrice`, `highlights`, `stylePresetId`, `cardIntent`).
- [x] **Dado** a execução em ambiente offline ou de testes sem credenciais R2, **quando** o catálogo de semente for acessado, **então** o sistema deve prover fallbacks resilientes garantindo que a aplicação nunca quebre por falta de conexão externa.

### 2. Persistência de Referência em Rascunhos (`drafts.service.ts`)

- [x] **Dado** a chamada para salvar um rascunho com `saveDraftFn`, **quando** o payload contiver uma URL pública no campo `referenceImageDataUrl` (ex.: `https://pub-ofertapronta.r2.dev/showcase/...`), **então** o serviço deve persistir a URL no banco de dados na coluna `reference_image_data_url` sem descartá-la e sem registrar chaves vazias inexistentes no `StorageService`.
- [x] **Dado** a leitura de um rascunho salvo via `formatDraftForClient`, **quando** o rascunho possuir uma URL de referência da vitrine, **então** o DTO de retorno deve conter a URL exata no campo `referenceImageDataUrl` para renderização imediata na UI.

### 3. Resolução Isomórfica de Assets em `resolveDraftVisualInputs`

- [x] **Dado** a geração de prévia gratuita via `generatePreviewFn` ou `preview-generator.service.ts`, **quando** o rascunho contiver uma URL pública HTTPS em `referenceImageDataUrl`, **então** a função `resolveDraftVisualInputs` deve resolver o buffer da imagem (com timeout limite de 5s em produção ou buffer determinístico in-memory em testes) e formatá-la como `data:${contentType};base64,...`.
- [x] **Dado** um erro de rede ou timeout ao tentar baixar uma imagem externa de referência, **quando** a resolução de asset falhar, **então** o sistema deve aplicar fallback gracioso registrando log informativo de alerta, permitindo que a geração do card prossiga utilizando as diretivas textuais do `stylePresetId` sem travar o servidor.

### 4. Injeção Multimodal no Gemini & Multimodalidade Dupla

- [x] **Dado** a montagem do prompt para o modelo de imagem Gemini no `PromptEngine` (`assembleCompileResult` e `appendVisualInputs`), **quando** `referenceImageDataUrl` estiver presente, **então** deve ser injetada a parte correspondente com o marcador `[IMAGEM DE REFERÊNCIA ESTÉTICA: Absorver iluminação, paleta de cores e estilo visual]`.
- [x] **Dado** um rascunho que possui simultaneamente Foto do Produto (`productImageDataUrl`) enviada no Passo 3 e Card da Vitrine (`referenceImageDataUrl`) selecionado no Passo 4, **quando** o prompt multimodal for compilado, **então** ambos os insumos visuais devem ser incluídos como partes independentes do Gemini, orientando a IA a manter o produto real no centro e absorver a atmosfera visual do card de referência.

### 5. Qualidade de Código e Testes Unitários

- [x] **Dado** a suíte de testes de backend, **quando** executado `pnpm vitest run src/features/promotions/server/services/showcase.service.test.ts src/features/promotions/server/services/preview-generator.service.test.ts src/server/prompt-engine/prompt-engine.test.ts`, **então** todos os testes devem passar em menos de 2 segundos com 100% de sucesso.
- [x] **Dado** a verificação de integridade estrita do TypeScript, **quando** executado `pnpm typecheck`, **então** zero erros de tipagem devem ser reportados.
