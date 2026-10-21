# 01: Backend Storage Stream — Sealing da Costura StorageService, Drivers R2/Memória, Módulo Profundo ExportEngine e Schemas de Insumos

**Spec:** [`docs/specs/storage-architecture-deepening.md`](../../specs/storage-architecture-deepening.md)

**What to build:**
Vedar a costura do `StorageService` para garantir que tanto o driver em memória quanto o driver R2 retornem URLs válidas e renderizáveis no browser, sem checagem de strings `storage.local.fake`, com validação fail-fast em `CloudflareR2StorageDriver` quando `R2_PUBLIC_URL` estiver ausente; transformar o `ExportEngine` em um Módulo Profundo que absorve o pipeline do Sharp (Feed 1080×1350, Story 1080×1920 com barras harmônicas, marca d'água e co-branding), persistência com chaves canônicas determinísticas e CDN cache-busting (`?v=timestamp`); e atualizar os schemas Drizzle com as colunas de assets de insumos (`product_asset_key`, `reference_asset_key`, `logo_asset_key`) gerando a migração SQL oficial em `drizzle/`, guiado por TDD cirúrgico com testes unitários em milissegundos.

**Blocked by:** `None (can start immediately)`

**Status:** `completed`

---

## Acceptance Criteria (BDD)

### 1. Sealing do `StorageService` & Driver em Memória sem Strings Mágicas
- [x] **Scenario: Retorno de URLs válidas e consumíveis pelo navegador no InMemoryStorageDriver**
  - **Given** que o `InMemoryStorageDriver` é instanciado em ambiente de testes ou desenvolvimento offline sem `publicUrlBase`
  - **When** um asset binário é enviado via `storageService.uploadAsset({ key: "test/card.png", buffer, contentType: "image/png" })`
  - **Then** a propriedade `url` retornada e o resultado de `storageService.getPublicUrl("test/card.png")` devem ser Data URLs válidas no formato `data:image/png;base64,...` imediatamente renderizáveis em elementos `<img />`
  - **And** a string de retorno NÃO deve conter `"storage.local.fake"` sob nenhuma circunstância.

- [x] **Scenario: Suporte a base URL customizada no InMemoryStorageDriver**
  - **Given** que o `InMemoryStorageDriver` é instanciado com `publicUrlBase: "https://cdn.teste.local"`
  - **When** `storageService.getPublicUrl("inputs/draft-123/product.png")` for invocado
  - **Then** deve retornar `"https://cdn.teste.local/inputs/draft-123/product.png"`.

- [x] **Scenario: Isolamento e limpeza determinística entre testes**
  - **Given** múltiplos assets persistidos no `InMemoryStorageDriver`
  - **When** o método `storageService.clear()` for chamado no `beforeEach` da suíte de testes
  - **Then** o mapa interno deve ser esvaziado e `storageService.getAsset(key)` deve retornar `null` para qualquer chave anterior.

### 2. Validação Fail-Fast no Driver Cloudflare R2
- [x] **Scenario: Inicialização do CloudflareR2StorageDriver sem URL pública de CDN**
  - **Given** que as credenciais do bucket R2 estão configuradas, mas `publicUrl` está ausente ou vazia
  - **When** uma instância de `CloudflareR2StorageDriver` for criada
  - **Then** o construtor deve lançar imediatamente um erro descritivo exigindo `R2_PUBLIC_URL`
  - **And** nenhuma chamada de rede S3 deve ser disparada.

- [x] **Scenario: Geração de URLs públicas de CDN no CloudflareR2StorageDriver**
  - **Given** que o driver R2 foi instanciado com `publicUrl: "https://assets.ofertapronta.com.br"`
  - **When** `storageService.getPublicUrl("deliveries/order-1/feed.png")` for invocado
  - **Then** deve retornar exatamente `"https://assets.ofertapronta.com.br/deliveries/order-1/feed.png"` sem barras duplicadas.

### 3. Módulo Profundo `ExportEngine` (Sharp + Storage + Chaves Canônicas)
- [x] **Scenario: Geração e upload de prévia protegida com marca d'água (`exportPreviewCard`)**
  - **Given** uma arte gerada pela IA para o rascunho `draft-abc` em buffer PNG bruto
  - **When** `exportEngine.exportPreviewCard({ draftId: "draft-abc", rawImageBuffer })` for chamado
  - **Then** o `ExportEngine` deve aplicar a marca d'água diagonal de proteção
  - **And** fazer upload da prévia pública para `previews/draft-abc/{timestamp}.webp`
  - **And** fazer upload da arte mestre limpa privada para `masters/drafts/draft-abc/{timestamp}.png`
  - **And** retornar `previewUrl`, `previewAssetKey`, `cleanMasterAssetKey` e `watermarkedBuffer`.

- [x] **Scenario: Geração e upload de formatos finais de entrega com co-branding (`exportFinalCampaign`)**
  - **Given** o buffer mestre limpo de um pedido pago `order-xyz` com `cobranding: { accepted: true, creditText: "Design por @ofertapronta" }`
  - **When** `exportEngine.exportFinalCampaign({ orderId: "order-xyz", masterBuffer, cobranding })` for chamado
  - **Then** o `ExportEngine` deve formatar o Feed em 1080×1350 e o Story em 1080×1920 com barras harmônicas desfocadas
  - **And** aplicar a assinatura de co-branding sutil no canto inferior direito de ambos os formatos
  - **And** persistir os arquivos no storage sob `deliveries/order-xyz/feed.png` e `deliveries/order-xyz/story.png`
  - **And** retornar `feedUrl` e `storyUrl` acompanhadas do sufixo de cache-busting de CDN `?v={timestamp}`.

- [x] **Scenario: Persistência isolada de arte mestre (`saveCleanMaster`)**
  - **Given** um buffer binário de arte mestre limpa para um pedido pós-regeneração `order-xyz`
  - **When** `exportEngine.saveCleanMaster({ ownerId: "order-xyz", buffer: masterBuffer, prefix: "orders" })` for chamado
  - **Then** deve fazer upload para `masters/orders/order-xyz/{timestamp}.png` e retornar a chave canônica e URL correspondente.

### 4. Drizzle Schemas & Migrações SQL de Chaves de Insumos
- [x] **Scenario: Adição das colunas de chaves de insumos na tabela drafts**
  - **Given** o schema `src/server/db/schema/promotions.ts`
  - **When** as colunas `productAssetKey`, `referenceAssetKey` e `logoAssetKey` forem adicionadas como texto opcional
  - **And** os comandos `pnpm db:generate && pnpm db:migrate` forem executados na worktree
  - **Then** um novo arquivo de migração SQL deve ser persistido em `drizzle/` e aplicado com sucesso ao banco PostgreSQL
  - **And** `pnpm typecheck` deve validar sem erros de tipos.

### 5. Qualidade e Testes Unitários TDD
- [x] **Scenario: Execução cirúrgica dos testes de storage e export-engine**
  - **Given** os testes `src/server/storage/storage.service.test.ts` e `src/server/export-engine/export-engine.test.ts`
  - **When** executados via `pnpm vitest run src/server/storage/storage.service.test.ts src/server/export-engine/export-engine.test.ts`
  - **Then** todos os testes devem passar em menos de 2 segundos com 100% de sucesso nas novas operações.
