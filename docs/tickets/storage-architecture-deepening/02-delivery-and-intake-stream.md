# 02: Delivery & Intake Stream — Refatoração de Chamadores (Delivery, Preview, Regeneração) e Ingestão de Insumos no Assistente

**Spec:** [`docs/specs/storage-architecture-deepening.md`](../../specs/storage-architecture-deepening.md)

**What to build:**
Refatorar os serviços de negócio (`DeliveryService`, `PreviewGeneratorService`, `PostPaymentRegenerationService`) para consumirem o `ExportEngine` consolidado e a costura vedada do `StorageService`, eliminando qualquer condicional de `storage.local.fake`; garantir simetria rigorosa na regeneração pós-pagamento, persistindo a nova arte mestre gerada pela IA no storage e atualizando atomicamente `cleanMasterAssetKey` no banco; atualizar o pipeline de salvamento de rascunhos (`drafts.service.ts`) e o assistente de criação (`Step3VisualAssets`) para persistir fotos enviadas pelo microempresário (Produto, Referência e Logotipo) no `StorageService` sob `inputs/{draftId}/...`, gravando no PostgreSQL apenas as chaves leves de assets e eliminando o inchaço de tabelas TOAST; e assegurar retrocompatibilidade transparente com registros legados gravados em Base64 Data URLs.

**Blocked by:** [`docs/tickets/storage-architecture-deepening/01-backend-storage-stream.md`](01-backend-storage-stream.md)

**Status:** `completed`

---

## Acceptance Criteria (BDD)

### 1. Eliminação de `storage.local.fake` & Consumo do `ExportEngine` no `DeliveryService`
- [x] **Scenario: Geração e persistência de exports finais via ExportEngine**
  - **Given** um pedido pago com arte mestre limpa disponível
  - **When** `deliveryService.getDeliveryDetails(orderId)` ou `deliveryService.updateExports(orderId, masterBuffer)` for executado
  - **Then** deve delegar a formatação e o upload para `exportEngine.exportFinalCampaign(...)`
  - **And** persistir as chaves `feedAssetKey` e `storyAssetKey` e URLs na tabela `deliveryExports`
  - **And** nenhuma linha de código do `delivery.service.ts` deve conter referências ou checagens de substring com `"storage.local.fake"`.

- [x] **Scenario: Downloads seguros e streaming a partir do StorageService**
  - **Given** um cliente requisitando download via `/api/delivery/download?orderId=...&format=feed`
  - **When** o pedido tiver `status === "PAID"` e `feedAssetKey` estiver preenchida
  - **Then** o endpoint deve recuperar o buffer binário via `storageService.getAsset(feedAssetKey)`
  - **And** enviar o arquivo via streaming com `Content-Disposition: attachment; filename="ofertapronta-feed-1080x1350.png"`
  - **And** incrementar atomicamente `downloadCount` no PostgreSQL.

### 2. Simetria na Regeneração Pós-Pagamento (`PostPaymentRegenerationService`)
- [x] **Scenario: Persistência da nova arte mestre limpa pós-regeneração**
  - **Given** um pedido elegível com ajustes solicitados pelo cliente via `regenerateOrderCard(...)`
  - **When** o motor de IA Gemini gerar com sucesso a nova arte mestre
  - **Then** o serviço deve invocar `exportEngine.saveCleanMaster({ ownerId: order.id, buffer: generationResult.rawImageBuffer, prefix: "orders" })`
  - **And** atualizar a coluna `orders.cleanMasterAssetKey` com a nova chave canônica retornada (ex: `masters/orders/{orderId}/{timestamp}.png`)
  - **And** atualizar os exports finais chamando `deliveryService.updateExports(...)` com CDN cache-busting renovado.

- [x] **Scenario: Preservação de integridade em falhas de IA na regeneração**
  - **Given** uma solicitação de regeneração pós-pagamento
  - **When** a chamada à IA falhar por timeout ou indisponibilidade
  - **Then** a cota `aiRegenerationCount` NÃO deve ser incrementada
  - **And** a arte mestre anterior e os exports existentes em `deliveryExports` devem permanecer intocados.

### 3. Consumo do `ExportEngine` no `PreviewGeneratorService`
- [x] **Scenario: Geração de prévia protegida delegada ao ExportEngine**
  - **Given** um rascunho de oferta no Passo 4 do assistente
  - **When** o microempresário aciona a geração da prévia gratuita
  - **Then** o `PreviewGeneratorService` deve invocar `exportEngine.exportPreviewCard(...)`
  - **And** salvar no registro de `drafts` a `previewCardImageUrl`, `previewAssetKey` e `cleanMasterAssetKey`
  - **And** descarregar a lógica de manipulação direta de Sharp e formatação de caminhos de arquivos para o `ExportEngine`.

### 4. Ingestão de Insumos Desacoplada e Fim do Bloat TOAST no PostgreSQL
- [x] **Scenario: Salvamento de fotos do usuário no StorageService via saveOfferDraft**
  - **Given** um payload de rascunho em `saveOfferDraft` contendo foto do produto em Data URL Base64 (`productImageDataUrl: "data:image/jpeg;base64,..."`)
  - **When** o rascunho for persistido no backend
  - **Then** o buffer binário da foto deve ser enviado para o `StorageService` sob `inputs/{draftId}/product.png`
  - **And** a coluna `productAssetKey` deve ser gravada no PostgreSQL com a chave do asset
  - **And** a coluna de texto Base64 `productImageDataUrl` no banco deve ser mantida nula para impedir inchaço da tabela TOAST.

- [x] **Scenario: Remoção de foto no assistente de criação**
  - **Given** um rascunho com `productAssetKey` previamente preenchida
  - **When** o usuário tocar em remover a foto no `Step3VisualAssets` e salvar o rascunho com imagem indefinida
  - **Then** a coluna `productAssetKey` deve ser definida como `null` no PostgreSQL
  - **And** o asset anterior pode ser excluído via `storageService.deleteAsset(...)`.

### 5. Resolução Transparente de Insumos para Geração Multimodal Gemini
- [x] **Scenario: Resolução de imagens armazenadas para o gerador de cards**
  - **Given** um rascunho salvo que possui `productAssetKey` e `logoAssetKey` configuradas
  - **When** `PreviewGeneratorService` preparar o input para o `aiCardGenerator`
  - **Then** deve carregar os buffers binários correspondentes via `storageService.getAsset(key)`
  - **And** repassar os insumos de imagem formatados para o Gemini compor o Card Publicitário completo.

### 6. Retrocompatibilidade Estrita com Registros Legados
- [x] **Scenario: Rascunhos ou pedidos com imagens legadas em Base64 Data URL**
  - **Given** um rascunho ou pedido criado antes da migração contendo imagens salvas em Base64 Data URL
  - **When** carregado pelo assistente, pelo gerador de prévia ou pela tela de entrega
  - **Then** o sistema deve detectar o prefixo `data:` e processá-lo com sucesso sem exigir migração manual de dados prévia.

### 7. Testes de Integração e Conformidade de UI
- [x] **Scenario: Execução da suíte de testes de entrega, regeneração e drafts**
  - **Given** as suítes `delivery.service.test.ts`, `post-payment-regeneration.service.test.ts` e `drafts.service.test.ts`
  - **When** executadas via `pnpm vitest run src/features/delivery/server/services/delivery.service.test.ts src/features/delivery/server/services/post-payment-regeneration.service.test.ts src/features/promotions/server/services/drafts.service.test.ts`
  - **Then** todos os testes devem passar com 100% de sucesso em menos de 3 segundos
  - **And** `pnpm typecheck` deve validar sem erros de tipos.
