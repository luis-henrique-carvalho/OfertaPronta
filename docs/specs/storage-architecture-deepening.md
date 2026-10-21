# Spec: Aprofundamento Arquitetural de Armazenamento & ExportEngine (Cloudflare R2 + Ingestão de Insumos)

- **Slug**: `storage-architecture-deepening`
- **Status**: `ready-for-agent`

---

## Problem Statement

O OfertaPronta avançou na integração inicial com o Cloudflare R2 para armazenamento de cards gerados por IA, porém uma auditoria arquitetural nos quatro pilares de engenharia revelou vazamentos de abstração, acoplamento desnecessário e risco de inchaço (*bloat*) no banco de dados PostgreSQL:

1. **Vazamento de Abstração e Verificação Frágil de Strings (`storage.local.fake`):**
   O `InMemoryStorageDriver` atualmente retorna URLs contendo o domínio simulado `https://storage.local.fake/...`, que não é resolúvel por navegadores nem renderizável em tags `<img />`. Para contornar isso, o `DeliveryService` introduziu condicionais frágeis (`isFakeStorage = feedUpload.url.includes("storage.local.fake")`) para forçar redirecionamento via endpoint local de download. Essa verificação é um vazamento evidente de detalhes de implementação do driver para a camada de serviço.
2. **Falta de Fail-Fast no Driver Cloudflare R2:**
   O `CloudflareR2StorageDriver` aceita `publicUrl` como opcional. Quando não fornecido, gera URLs no formato `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`, que são privadas/não autenticadas no R2 e falham ao serem acessadas por clientes externos, sem acusar erro em tempo de inicialização.
3. **Módulo de Exportação Raso (`ExportEngine`):**
   O módulo `ExportEngine` atual funciona apenas como coleção de funções utilitárias do Sharp (`formatFeedCard`, `formatStoryCard`, `applyWatermark`, `applyCobrandingSignature`). Os chamadores (`DeliveryService`, `PreviewGeneratorService`) são obrigados a orquestrar manualmente transformações visuais, formatação de chaves canônicas (`deliveries/{orderId}/feed.png`, `previews/{draftId}/{timestamp}.png`), chamadas ao `StorageService`, e concatenação de sufixos de cache-busting (`?v=timestamp`), violando o princípio de *Deep Modules* (módulos profundos com interface concisa e implementação substancial).
4. **Assimetria na Regeneração Pós-Pagamento:**
   Na geração inicial da prévia, a arte mestre é armazenada no `StorageService` sob `masters/{draftId}/{timestamp}.png` e registrada em `cleanMasterAssetKey`. No entanto, na regeneração pós-compra em `PostPaymentRegenerationService`, a nova arte mestre gerada pela IA é gravada apenas como Base64 no snapshot do pedido, sem persistência no `StorageService` e sem atualização da coluna `cleanMasterAssetKey`, criando inconsistência de dados.
5. **Inchaço Crítico de TOAST no PostgreSQL por Insumos do Usuário:**
   No assistente de criação (`Step3VisualAssets`), as fotos enviadas pelo microempresário (Foto do Produto, Imagem de Referência e Logotipo) são transmitidas e persistidas diretamente na tabela `drafts` do PostgreSQL como strings Base64 gigantescas (`product_image_data_url`, etc.). Cada rascunho com 2 ou 3 fotos consome entre 5MB e 15MB de armazenamento TOAST, degradando o pool de conexões, serializações de Server Functions e backups do banco.

---

## Solution

Aprofundar a arquitetura de armazenamento e exportação em três etapas complementares e de alto impacto, garantindo vedação hermética da costura de storage, consolidação profunda do `ExportEngine` e desinchamento definitivo das tabelas do PostgreSQL:

1. **Vedar a Costura de Armazenamento (`StorageService`):**
   - Garantir que **todos** os adaptadores (`CloudflareR2StorageDriver` e `InMemoryStorageDriver`) retornem URLs válidas e imediatamente consumíveis por navegadores e elementos `<img />`. O `InMemoryStorageDriver` passa a retornar Data URLs autocontidas (`data:${contentType};base64,...`) ou URLs base resolúveis, eliminando completamente a necessidade de checagem por `storage.local.fake`.
   - Adicionar validação *fail-fast* no construtor do `CloudflareR2StorageDriver`: caso seja instanciado sem `publicUrl` (`R2_PUBLIC_URL`), lança erro operacional imediato impedindo inicializações silenciosamente corrompidas.
   - Corrigir a assimetria na regeneração pós-pagamento: a nova arte mestre gerada pela IA é obrigatoriamente persistida no `StorageService` sob chave canônica e o campo `orders.cleanMasterAssetKey` é atualizado atomicamente no banco.

2. **Consolidar o Módulo Profundo de Exportação (`ExportEngine`):**
   - Transformar o `ExportEngine` em um módulo profundo que encapsula o pipeline completo de processamento de imagem (Sharp) e persistência (`StorageService`).
   - Interface pública consolidada:
     - `exportPreviewCard(input)`: aplica marca d'água diagonal de proteção, formata master limpa, faz upload para `previews/` e `masters/` via `StorageService` e retorna chaves e URLs canônicas.
     - `exportFinalCampaign(input)`: gera formatos Feed (1080×1350) e Story (1080×1920) com barras harmônicas desfocadas, aplica assinatura de co-branding se contratada, persiste em `deliveries/` e retorna chaves e URLs com cache-busting de CDN (`?v=timestamp`).
     - `saveCleanMaster(input)`: persiste a arte mestre em `masters/orders/{orderId}/{timestamp}.png` e retorna chave e URL canônica.
   - Os serviços consumidores (`DeliveryService`, `PreviewGeneratorService`, `PostPaymentRegenerationService`) passam a ser clientes concisos do `ExportEngine`, delegando toda a complexidade de layouts de arquivos e buffers.

3. **Aprofundar a Ingestão de Insumos (`Drafts Intake`):**
   - Adicionar colunas leves no schema Drizzle `drafts`: `product_asset_key`, `reference_asset_key` e `logo_asset_key`.
   - Na ingestão de insumos do assistente de criação (`Step3VisualAssets`), os arquivos enviados pelo microempresário são salvos no `StorageService` sob as chaves canônicas `inputs/{draftId}/product.png`, `inputs/{draftId}/reference.png` e `inputs/{draftId}/logo.png`.
   - A tabela `drafts` armazena exclusivamente as chaves leves de assets de texto, zerando o inchaço de tabelas TOAST no PostgreSQL.
   - Manter retrocompatibilidade transparente: se um registro antigo contiver `product_image_data_url`, o sistema o processa normalmente; para novos registros, o `preview-generator` resolve os assets binários a partir do `StorageService` antes de despachar o briefing multimodal para a API do Google Gemini.

---

## User Stories

### Armazenamento Confiável & Integridade da Costura (StorageService)
1. Como microempresário visualizando a prévia do meu card publicitário no celular, quero que a imagem carregue imediatamente sem erros de domínio inválido ou links quebrados, para que eu possa avaliar o card com segurança antes do Pix.
2. Como cliente navegando na tela de entrega `/pedido/$orderId`, quero visualizar e baixar minhas artes nos formatos Feed e Story com URLs públicas funcionais e cache atualizado, para que eu não visualize artes antigas em cache após solicitar uma alteração.
3. Como desenvolvedor rodando a suíte de testes locais com Vitest, quero que o `InMemoryStorageDriver` retorne URLs válidas para `<img />` (Data URLs base64) sem exigir conexões reais de rede ou condicionais especiais de `storage.local.fake`, mantendo a suíte de testes verde em menos de 2 segundos.
4. Como engenheiro de DevOps implantando o OfertaPronta em produção, quero que o servidor falhe imediatamente na inicialização caso `R2_PUBLIC_URL` não esteja configurada no ambiente com `STORAGE_DRIVER=r2`, para evitar deploys com URLs quebradas em produção.

### Módulo Profundo ExportEngine & Regeneração Pós-Pagamento
5. Como microempresário que solicitou um ajuste de preço ou texto pós-compra (regeneração com IA), quero que a minha nova arte mestre seja salva com segurança e que os formatos Feed e Story sejam atualizados instantaneamente, para que meus downloads reflitam com fidelidade o novo card aprovado.
6. Como cliente que contratou o plano com desconto e aceitou o co-branding, quero que a marca d'água de crédito sutil do OfertaPronta seja aplicada de forma idêntica tanto na entrega inicial quanto em quaisquer regenerações subsequentes.
7. Como engenheiro de software mantendo o `DeliveryService`, quero invocar uma única função `exportEngine.exportFinalCampaign(...)` passando apenas o buffer mestre e dados de co-branding, sem me preocupar com dimensões Sharp, layouts de pastas no S3 ou concatenação manual de timestamps de cache.

### Ingestão Leve de Insumos & Performance do Banco (Drafts Intake)
8. Como microempresário com conexão 4G lenta enviando fotos do meu celular (produto, referência e logo) no Passo 3, quero que o envio ocorra sem travamentos na interface e sem estourar o limite de payload do servidor.
9. Como microempresário que decidiu remover uma foto enviada por engano no Passo 3, quero tocar em "Remover" e ter a certeza de que aquele insumo foi desvinculado do meu rascunho, para que a IA não utilize a foto antiga na composição final.
10. Como administrador do banco de dados, quero que os registros de rascunhos em `drafts` ocupem menos de 2 KB cada no PostgreSQL em vez de 10 MB, para que as consultas, migrações e rotinas de backup permaneçam ultrarrápidas à medida que a plataforma escala.
11. Como usuário com um rascunho ou pedido criado antes desta melhoria, quero que minhas artes com imagens legadas continuem sendo processadas e exibidas sem regressões ou mensagens de erro.

---

## Implementation Decisions

### 1. Sealing do Módulo Profundo `StorageService` (`src/server/storage/`)

- **Interface Pública Estrita:**
  ```typescript
  export interface AssetUploadOptions {
    key: string;
    buffer: Buffer;
    contentType: string;
    isPublic?: boolean;
    metadata?: Record<string, string>;
  }

  export interface AssetUploadResult {
    key: string;
    url: string;
  }

  export interface StorageAsset {
    buffer: Buffer;
    contentType: string;
  }

  export interface StorageService {
    uploadAsset(options: AssetUploadOptions): Promise<AssetUploadResult>;
    getAsset(key: string): Promise<StorageAsset | null>;
    deleteAsset(key: string): Promise<void>;
    getPublicUrl(key: string): string;
  }
  ```

- **Comportamento do `InMemoryStorageDriver`:**
  - Armazena os buffers em `Map<string, StoredMemoryAsset>`.
  - `getPublicUrl(key)`: se `publicUrlBase` for fornecido explicitamente, retorna `${publicUrlBase}/${cleanKey}`. Caso contrário, busca o asset na memória e retorna sua representação em Data URL compatível com qualquer browser: `data:${asset.contentType};base64,${asset.buffer.toString("base64")}`. Se a chave não existir no momento da chamada, retorna uma Data URL neutra para evitar referências nulas.
  - O método `uploadAsset` retorna a URL canônica gerada por `getPublicUrl(key)`.

- **Comportamento do `CloudflareR2StorageDriver`:**
  - Validação no construtor (*Fail-Fast*):
    ```typescript
    if (!options.publicUrl || options.publicUrl.trim().length === 0) {
      throw new Error(
        "CloudflareR2StorageDriver requer publicUrl (R2_PUBLIC_URL) obrigatória para distribuição pública via CDN.",
      );
    }
    ```
  - `getPublicUrl(key)`: retorna invariavelmente `${this.publicUrl}/${cleanKey}`.
  - Eliminação completa de qualquer menção ou teste com a string `"storage.local.fake"` no código da aplicação.

### 2. Módulo Profundo `ExportEngine` (`src/server/export-engine/`)

- **Superfície da Interface Pública:**
  ```typescript
  export interface ExportPreviewCardInput {
    draftId: string;
    rawImageBuffer: Buffer;
    mimeType?: string;
    watermarkText?: string;
    subText?: string;
  }

  export interface ExportPreviewCardResult {
    previewUrl: string;
    previewAssetKey: string;
    cleanMasterAssetKey: string;
    watermarkedBuffer: Buffer;
  }

  export interface ExportFinalCampaignInput {
    orderId: string;
    masterBuffer: Buffer;
    cobranding?: {
      accepted: boolean;
      creditText?: string;
    };
  }

  export interface ExportFinalCampaignResult {
    feedUrl: string;
    feedAssetKey: string;
    storyUrl: string;
    storyAssetKey: string;
    feedBuffer: Buffer;
    storyBuffer: Buffer;
  }

  export interface SaveCleanMasterInput {
    ownerId: string; // draftId ou orderId
    buffer: Buffer;
    contentType?: string;
    prefix?: "drafts" | "orders";
  }

  export interface SaveCleanMasterResult {
    key: string;
    url: string;
  }

  export interface ExportEngine {
    exportPreviewCard(input: ExportPreviewCardInput): Promise<ExportPreviewCardResult>;
    exportFinalCampaign(input: ExportFinalCampaignInput): Promise<ExportFinalCampaignResult>;
    saveCleanMaster(input: SaveCleanMasterInput): Promise<SaveCleanMasterResult>;
  }
  ```

- **Layout Determinístico de Chaves Canônicas:**
  - Prévias: `previews/{draftId}/{timestamp}.webp`
  - Mestres limpas de rascunhos: `masters/drafts/{draftId}/{timestamp}.png`
  - Mestres limpas de pedidos (pós-regeneração): `masters/orders/{orderId}/{timestamp}.png`
  - Campanhas finais pagas:
    - Feed: `deliveries/{orderId}/feed.png`
    - Story: `deliveries/{orderId}/story.png`
  - Cache-busting automático: URLs finais de entrega retornam com sufixo `?v=${Date.now()}` para forçar revalidação no CDN Cloudflare e no browser do cliente após regeneração.

- **Fábrica e Injeção de Dependências:**
  - `getExportEngine(deps?: { storageService?: StorageService })`: singleton resiliente que injeta `getStorageService()` como padrão, permitindo fakes in-memory nos testes unitários sem acoplamento.

### 3. Ingestão de Insumos e Schemas Drizzle (`src/server/db/schema/promotions.ts`)

- **Atualização na Tabela `drafts`:**
  - Novas colunas adicionadas ao schema:
    - `productAssetKey: text("product_asset_key")`
    - `referenceAssetKey: text("reference_asset_key")`
    - `logoAssetKey: text("logo_asset_key")`
  - Novas migrações geradas em `drizzle/` via `pnpm db:generate && pnpm db:migrate`.
  - Layout das chaves de insumos no storage:
    - Produto: `inputs/{draftId}/product.png`
    - Referência: `inputs/{draftId}/reference.png`
    - Logotipo: `inputs/{draftId}/logo.png`

- **Fluxo de Ingestão no `saveOfferDraft`:**
  - Quando o payload contiver strings Data URL (`data:image/...`), o backend:
    1. Decodifica o buffer binário.
    2. Realiza upload para o `StorageService` sob a respectiva chave de input (`inputs/{draftId}/...`).
    3. Grava no PostgreSQL apenas a chave canônica correspondente (`productAssetKey`, etc.).
    4. Define a coluna legada de dados como nula no banco para evitar bloat no TOAST.
  - Quando o usuário remove um insumo (`undefined` ou `null`), a chave correspondente é limpa e o asset anterior pode ser excluído via `storageService.deleteAsset(key)`.

- **Resolução de Insumos para Geração Multimodal Gemini (`PreviewGeneratorService`):**
  - O `PreviewGeneratorService` avalia o rascunho:
    - Se `productAssetKey` estiver presente, busca o asset via `storageService.getAsset(draft.productAssetKey)` e converte em Data URL para o SDK `@google/genai`.
    - Se apenas a coluna legada `productImageDataUrl` estiver presente, utiliza-a diretamente (retrocompatibilidade total).
    - Aplica a mesma regra para a imagem de referência e logotipo.

### 4. Simetria na Regeneração Pós-Pagamento (`PostPaymentRegenerationService`)

- Ao receber a nova arte gerada pelo Gemini:
  1. Invoca `exportEngine.saveCleanMaster({ ownerId: order.id, buffer: generationResult.rawImageBuffer, prefix: "orders" })`.
  2. Atualiza `orders.cleanMasterAssetKey` com a nova chave retornada e incrementa `aiRegenerationCount`.
  3. Invoca `deliveryService.updateExports(order.id, generationResult.rawImageBuffer)`, que delega para `exportEngine.exportFinalCampaign(...)`.
  4. Ambas as colunas de assets e os arquivos finais em `deliveries/{orderId}/` permanecem 100% sincronizados.

---

## Testing Decisions

1. **Princípio dos Módulos Profundos e Testes nas Costuras Públicas:**
   - Testar o comportamento observável externamente nas fronteiras públicas de `StorageService`, `ExportEngine`, `drafts.service.ts` e `DeliveryService`.
   - Proibido testar métodos privados ou inspecionar detalhes internos de implementação (como buffers intermediários do Sharp ou estado interno do S3Client).
2. **Substituição sem Camadas Hipotéticas (*Replace-Don't-Layer*):**
   - Utilizar o `InMemoryStorageDriver` como fake real nos testes unitários e de integração, eliminando mocks do Vitest para APIs externas de armazenamento.
3. **Casos de Teste Mandatórios:**
   - `storage.service.test.ts`:
     - `CloudflareR2StorageDriver` lança exceção imediata se instanciado sem `publicUrl`.
     - `InMemoryStorageDriver` retorna URLs consumíveis por `<img />` sem conter a substring `"storage.local.fake"`.
     - Ciclo completo de upload, download via `getAsset`, `getPublicUrl` e `deleteAsset`.
   - `export-engine.test.ts`:
     - `exportPreviewCard` gera imagem com marca d'água e persiste prévia e mestre limpa no storage.
     - `exportFinalCampaign` gera Feed (1080×1350) e Story (1080×1920 com barras desfocadas), aplica co-branding se contratado e anexa cache-busting `?v=...`.
     - `saveCleanMaster` persiste a arte no caminho correto.
   - `drafts.service.test.ts`:
     - `saveOfferDraft` converte Base64 em asset keys no storage e salva chaves leves no PostgreSQL sem inchar o banco.
     - Remoção de foto limpa a chave correspondente.
     - Suporte a rascunhos legados com Data URLs intactos.
   - `post-payment-regeneration.service.test.ts`:
     - Regeneração bem-sucedida persiste novo master no storage e atualiza `orders.cleanMasterAssetKey`.
   - `delivery.service.test.ts`:
     - Zero dependência da string `storage.local.fake` para resolver URLs finais de entrega.

---

## Out of Scope

- **Upload Direto via Presigned URLs do Cliente:** O envio de insumos continuará passando pelo backend do TanStack Start/RPC para validação estrita de segurança, tipo MIME e integridade antes do storage (YAGNI para este épico).
- **Processamento de Vídeo ou GIFs Animados:** O OfertaPronta opera exclusivamente com imagens estáticas PNG e WebP em alta resolução (1080×1350 e 1080×1920).
- **Políticas de Ciclo de Vida Automatizadas no Bucket:** Expiração ou arquivamento de objetos em cold storage é de responsabilidade da configuração do painel Cloudflare R2 e não do código da aplicação.
- **Redimensionamento Manual no Cliente:** Filtros manuais de cor ou corte de imagem no navegador permanecem fora de escopo; o redimensionamento inteligente é executado no servidor pelo Sharp dentro do `ExportEngine`.

---

## Further Notes

- **Conformidade com AGENTS.md:** Módulos profundos com alta localidade, ausência de wrappers rasos, isolamento estrito client/server e mobile-first nos componentes visuais.
- **Conformidade com GLOSSARY.md:** Preservação estrita dos termos ubíquos: *Ad Card*, *Briefing da Oferta*, *Clean Master Art*, *Watermarked Preview*, *Style Preset*, *Co-branding Signature*.
- **Migração SQL:** Executar `pnpm db:generate && pnpm db:migrate` dentro da worktree para manter os esquemas e snapshots Drizzle sempre atualizados.
