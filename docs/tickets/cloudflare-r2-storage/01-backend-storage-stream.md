# 01: Backend Storage Stream — Deep Module StorageService, R2 & Memory Drivers, Schemas Drizzle e Pipeline de Prévia e Entrega

**Spec:** [`docs/specs/cloudflare-r2-storage.md`](../../specs/cloudflare-r2-storage.md)

**What to build:**
Construir a camada profunda de armazenamento de objetos desacoplada (`StorageService`) com suporte híbrido a Cloudflare R2 e driver em memória (`InMemoryStorageDriver`), atualizar a configuração de ambiente do servidor, definir o schema Drizzle e migrações para a tabela `showcase_cards`, e integrar o pipeline de geração de prévias (`PreviewGenerator`) e de entrega final (`DeliveryService` e `/api/delivery/download`), garantindo retrocompatibilidade estrita com pedidos e rascunhos que possuam imagens gravadas em Data URLs Base64.

**Blocked by:** `None (can start immediately)`

**Status:** `ready-for-agent`

---

## Acceptance Criteria (BDD)

### 1. Deep Module `StorageService` & Drivers

- [ ] **Dado** que a aplicação precisa persistir um asset binário (PNG/WebP), **quando** `storageService.uploadAsset({ key, buffer, contentType, isPublic })` for invocado, **então** o arquivo deve ser gravado e retornar a chave (`key`) e a URL canônica (`url`).
- [ ] **Dado** um ambiente de testes ou execução local sem credenciais R2 (`STORAGE_DRIVER=memory` ou variáveis R2 ausentes), **quando** o `StorageService` for inicializado, **então** deve utilizar deterministicamente o `InMemoryStorageDriver`, executando operações em memória sem dependências externas de rede.
- [ ] **Dado** que variáveis válidas do Cloudflare R2 foram informadas (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`), **quando** `STORAGE_DRIVER=r2`, **então** deve ser instanciado o `CloudflareR2StorageDriver` utilizando `@aws-sdk/client-s3` apontando para o endpoint S3 do Cloudflare R2 com região `"auto"`.

### 2. Schema Drizzle & Migração `showcase_cards`

- [ ] **Dado** o schema `src/server/db/schema/showcase.ts`, **quando** o backend rodar `pnpm db:generate && pnpm db:migrate`, **então** a tabela `showcase_cards` deve ser criada no PostgreSQL com colunas tipadas: `id` (uuid), `business_segment` (text), `style_preset_id` (text), `card_intent` (text), `title` (text), `description` (text), `image_url` (text), `aspect_ratio` (text), `is_featured` (boolean), `display_order` (integer), `metadata` (jsonb), `created_at` e `updated_at`.
- [ ] **Dado** a atualização de schemas, **quando** exportado em `src/server/db/schema/index.ts`, **então** deve estar disponível no pool unificado do Drizzle sem erros de tipagem TypeScript.

### 3. Integração com `PreviewGenerator` & `DeliveryService`

- [ ] **Dado** a geração de um novo card publicitário no `preview-generator.service.ts`, **quando** a prévia for finalizada com marca d'água, **então** o buffer da prévia deve ser enviado para `previews/{draftId}/{timestamp}.png` como asset público, e a arte mestre limpa para `masters/{draftId}/{timestamp}.png`, salvando as referências leves no registro do rascunho em vez de strings Base64 de múltiplos megabytes.
- [ ] **Dado** a confirmação de um pedido pago no `delivery.service.ts`, **quando** os formatos Feed (1080×1350) e Story (1080×1920) forem gerados, **então** os buffers devem ser enviados para `deliveries/{orderId}/feed.png` e `deliveries/{orderId}/story.png`, persistindo as chaves `feedAssetKey` e `storyAssetKey` e as URLs finais na tabela `deliveryExports`.

### 4. Retrocompatibilidade Estrita & Endpoint de Download

- [ ] **Dado** um pedido ou rascunho antigo no banco contendo `data:image/png;base64,...` nas colunas de imagem, **quando** a visualização ou o download forem solicitados, **então** o sistema deve detectar o prefixo Base64 e processar o arquivo normalmente sem lançar exceções.
- [ ] **Dado** uma requisição de download para a rota `/api/delivery/download?token=...&orderId=...&format=feed`, **quando** o pedido for válido e pago, **então** o endpoint deve recuperar o buffer binário via `storageService.getAsset(key)` (ou decodificar Base64 se legado), enviar streaming com cabeçalho `Content-Disposition: attachment; filename="ofertapronta-feed-1080x1350.png"` e registrar atomicamente o incremento em `downloadCount`.

### 5. Qualidade e Testes de Backend

- [ ] **Dado** a suíte de testes de backend, **quando** executado `pnpm vitest run src/server/storage/storage.service.test.ts` e `pnpm vitest run src/features/delivery/server/services/delivery.service.test.ts`, **então** todos os testes devem passar em menos de 2 segundos com 100% de cobertura nos métodos públicos.
- [ ] **Dado** a verificação estrita de tipos, **quando** executado `pnpm typecheck`, **então** zero erros de TypeScript devem ser reportados.
