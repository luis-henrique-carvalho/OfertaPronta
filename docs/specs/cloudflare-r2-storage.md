# Spec: Migração para Cloudflare R2 Storage & Vitrine de Exemplos no Passo 4

- **Slug**: `cloudflare-r2-storage`
- **Status**: `ready-for-agent`

---

## Problem Statement

Atualmente, o OfertaPronta armazena todas as imagens geradas pela IA (`previewCardImageUrl`, `cleanMasterImageDataUrl`, `feedUrl`, `storyUrl`) diretamente no banco de dados PostgreSQL como strings Base64 gigantescas (`data:image/png;base64,...`).

Esse modelo apresenta problemas críticos de escala e performance:

1. **Bloat e Degradação do Banco de Dados:** Cada imagem em alta resolução (1080×1350 ou 1080×1920) gera um payload Base64 de 2MB a 5MB. No PostgreSQL, isso aciona armazenamento TOAST em massa, consome dezenas de megabytes por pedido/rascunho, encarece backups e estrangula a memória e I/O do servidor durante serializações JSON em Server Functions.
2. **Latência de Rede e Carga no Navegador:** O tráfego de megabytes de Base64 em respostas RPC e payloads de hidratação do TanStack Start prejudica a experiência mobile, consome a franquia 4G/5G do microempresário e atrasa a renderização do Card Publicitário.
3. **Falta de Referência Visual Concreta no Passo 4:** No assistente de criação (`Step4StyleAndPalette`), os estilos visuais são apresentados apenas como miniaturas simuladas por CSS e SVG genérico. O comerciante tem dificuldade de antecipar o realismo da arte que o Gemini produzirá para o seu ramo (ex.: Supermercado, Salão, Pizzaria), o que aumenta a hesitação e abandono antes do checkout.

---

## Solution

Implementar uma arquitetura de **Armazenamento de Objetos Desacoplada e Alta Performance** com **Cloudflare R2** combinada à **Vitrine de Exemplos Reais (`Showcase`)** no Passo 4 do assistente de criação:

1. **Módulo Profundo `StorageService` (Server-Only):**
   - Criação de interface pública concisa em `src/server/storage/index.ts` para persistência, recuperação e exclusão de assets.
   - **Driver Cloudflare R2 (`CloudflareR2StorageDriver`):** Integração com Cloudflare R2 via API compatível com S3 (`@aws-sdk/client-s3`), aproveitando custo zero de transferência de saída (_zero egress fees_) e entrega em altíssima velocidade.
   - **Driver em Memória (`InMemoryStorageDriver`):** Driver in-memory determinístico para desenvolvimento local e testes unitários ultrarrápidos (1-2s), ativado automaticamente quando `STORAGE_DRIVER=memory` ou quando as credenciais R2 não estiverem configuradas.
   - **Arquitetura de Acesso Híbrida:**
     - Assets públicos (prévias com marca d'água e vitrine pública): URLs diretas de CDN/domínio personalizado R2 com cache no edge para renderização instantânea no mobile.
     - Assets finais pagos (Feed e Story limpos): armazenados em pastas privadas no R2 e servidos exclusivamente através da rota segura `/api/delivery/download`, garantindo proteção, validação do pedido pago (`status === "PAID"`) e incremento atômico do contador de downloads.

2. **Retrocompatibilidade Estrita (Zero Quebra):**
   - Suporte transparente e universal tanto para novos links R2 quanto para registros legados gravados em Base64 Data URLs (`data:image/...`).
   - Frontend renderiza sem qualquer alteração na tag `<img src={url} />`.
   - `DeliveryService` e o endpoint `/api/delivery/download` detectam se a arte é Base64 ou chave de storage R2, decodificando ou fazendo streaming dos bytes com cabeçalho `Content-Disposition: attachment`.

3. **Modelo de Domínio e Serviço de Vitrine (`showcase_cards`):**
   - Nova tabela Drizzle `showcase_cards` armazenando exemplos reais de cards publicitários gerados por IA, classificados por segmento comercial (`businessSegment`), estilo (`stylePresetId`), objetivo (`cardIntent`) e metadados de demonstração.
   - Curadoria e privacidade estritas: semente inicial curada (`SHOWCASE_SEED_CATALOG`), sem exposição automatizada de dados de clientes reais, em estrita conformidade com a LGPD.

4. **Experiência de Vitrine no Passo 4 (`Step4StyleAndPalette`):**
   - Botão e seção acessível mobile-first _"Ver Exemplos Reais Criados por IA"_ com badge e ícone contextual.
   - Diálogo modal responsivo com visualização ampliada dos cards reais do segmento selecionado, exibindo tag do estilo e dados da oferta.
   - Ação de 1 toque _"Usar este Estilo"_, que aplica o `stylePresetId` do exemplo selecionado ao formulário do comerciante e fecha o diálogo com feedback visual imediato.

---

## User Stories

### Armazenamento R2 & Entrega de Assets

1. Como microempresário navegando em conexão móvel 4G, quero que a prévia com marca d'água do meu card carregue via CDN veloz com URL leve, para que a página não fique lenta ou travando com megabytes de Base64.
2. Como comerciante que acabou de pagar via Pix, quero fazer o download dos meus PNGs de alta resolução (Feed e Story) de forma confiável e rápida, recebendo os arquivos com o nome correto sem vazamento de links privados.
3. Como cliente com um pedido antigo gerado antes da migração, quero continuar acessando e baixando meus arquivos sem quebras ou erros de formatação.
4. Como desenvolvedor rodando a suíte de testes Vitest, quero que todos os testes de backend e exportação executem em 1 a 2 segundos em memória, sem depender de conexão de rede ou buckets reais na nuvem.
5. Como operador da plataforma, quero configurar facilmente as credenciais do Cloudflare R2 no ambiente (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`) sabendo que o sistema usará fallback gracioso em memória caso estejam ausentes em desenvolvimento.

### Vitrine de Exemplos no Passo 4

6. Como comerciante de supermercado no Passo 4, quero ver exemplos de cards reais de encartes já criados pela plataforma para o meu ramo, para ter certeza da qualidade antes de gerar a minha própria arte.
7. Como cabeleireira ou dona de salão no Passo 4, quero tocar em um exemplo real de card sofisticado e aplicar aquele estilo ao meu briefing em 1 toque, sem precisar adivinhar qual opção do catálogo combina mais.
8. Como microempresário em celular com tela pequena, quero poder ampliar os exemplos da vitrine em modal acessível, visualizando os detalhes de composição, iluminação e tipografia gerados pela IA.
9. Como comerciante usuário do OfertaPronta, quero ter a garantia de que meus dados comerciais, telefones pessoais e imagens próprias nunca serão publicados na vitrine pública sem curadoria e consentimento prévio.

---

## Implementation Decisions

### 1. Módulo Profundo `StorageService` (`src/server/storage/`)

- **Interface Pública Única:**

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

  export interface StorageService {
    uploadAsset(options: AssetUploadOptions): Promise<AssetUploadResult>;
    getAsset(
      key: string,
    ): Promise<{ buffer: Buffer; contentType: string } | null>;
    deleteAsset(key: string): Promise<void>;
    getPublicUrl(key: string): string;
  }
  ```

- **Implementações:**
  - `CloudflareR2StorageDriver`: Inicializa `@aws-sdk/client-s3` com `endpoint: https://${accountId}.r2.cloudflarestorage.com`, credenciais R2 e região `"auto"`. Assets públicos resolvem a URL usando `${R2_PUBLIC_URL}/${key}`.
  - `InMemoryStorageDriver`: Mantém um `Map<string, { buffer: Buffer; contentType: string; isPublic: boolean }>` para execução em testes e desenvolvimento offline.
  - **Fábrica Singleton:** `getStorageService()` avalia `serverEnv`: se `STORAGE_DRIVER === "r2"` e credenciais válidas existem, instancia `CloudflareR2StorageDriver`; caso contrário, instancia e reutiliza `InMemoryStorageDriver` com log informativo.

### 2. Estrutura Canônica de Chaves de Armazenamento (_Asset Keys_)

As chaves no bucket R2 seguem convenção hierárquica determinística:

- **Prévias com Marca d'Água:** `previews/{draftId}/{timestamp}.png` (pública)
- **Artes Mestre Limpas:** `masters/{draftId}/{timestamp}.png` (privada)
- **Exportações Finais Pagas:** `deliveries/{orderId}/feed.png` e `deliveries/{orderId}/story.png` (privada)
- **Cards da Vitrine:** `showcase/{businessSegment}/{stylePresetId}-{slug}.png` (pública)

### 3. Integração com `PreviewGenerator` e `DeliveryService`

- **`preview-generator.service.ts`:**
  - Após aplicação da marca d'água via `ExportEngine`, envia o buffer da prévia para `storageService.uploadAsset({ key: previewKey, buffer, contentType: "image/png", isPublic: true })`.
  - Envia a arte mestre limpa para `storageService.uploadAsset({ key: masterKey, buffer: masterBuffer, contentType: "image/png", isPublic: false })`.
  - Salva no banco as URLs/chaves retornadas em `preview_card_image_url` e `clean_master_image_data_url`.
- **`delivery.service.ts`:**
  - Ao derivar os formatos finais (Feed 1080×1350 e Story 1080×1920), faz upload de ambos os buffers no R2:
    - `feedAssetKey = deliveries/${order.id}/feed.png`
    - `storyAssetKey = deliveries/${order.id}/story.png`
  - Persiste em `deliveryExports` as chaves `feedAssetKey`, `storyAssetKey`, e preenche `feedUrl` e `storyUrl` com URLs canônicas.
- **Rota `/api/delivery/download`:**
  - Recebe requisição autenticada de download de formato (`feed` ou `story`).
  - Obtém o registro de exportação. Se `feedAssetKey`/`storyAssetKey` existir, obtém o buffer via `storageService.getAsset(key)`.
  - Se a coluna contiver um Data URL legado (`data:image/png;base64,...`), decodifica o buffer via fallback `parseDataUrlBuffer` (garantindo 100% de retrocompatibilidade).
  - Envia o binário com streaming HTTP e cabeçalhos:
    - `Content-Type: image/png`
    - `Content-Disposition: attachment; filename="ofertapronta-${format}-1080x...png"`
    - `Content-Length: <size>`
  - Incrementa o contador de downloads atomicamente no banco.

### 4. Tabela Drizzle `showcase_cards` e Catálogo de Semente

- **Schema Drizzle (`src/server/db/schema/showcase.ts`):**
  ```typescript
  import {
    pgTable,
    uuid,
    text,
    boolean,
    integer,
    jsonb,
    timestamp,
  } from "drizzle-orm/pg-core";

  export const showcaseCards = pgTable("showcase_cards", {
    id: uuid("id").defaultRandom().primaryKey(),
    businessSegment: text("business_segment").notNull(),
    stylePresetId: text("style_preset_id").notNull(),
    cardIntent: text("card_intent").notNull().default("promo"),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url").notNull(),
    aspectRatio: text("aspect_ratio").notNull().default("feed"),
    isFeatured: boolean("is_featured").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    metadata: jsonb("metadata").$type<{
      businessName?: string;
      promoPrice?: string;
      originalPrice?: string;
      highlights?: string[];
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  });

  export type ShowcaseCard = typeof showcaseCards.$inferSelect;
  export type NewShowcaseCard = typeof showcaseCards.$inferInsert;
  ```
- **Catálogo de Semente Resiliente (`src/features/promotions/data/showcase-catalog.ts`):**
  - Mapeamento estático com pelo menos 18 cards curados de alta qualidade cobrindo todos os segmentos (`supermarket`, `beauty_salon`, `pizzeria`, `burger`, `restaurant`, `retail`) e estilos principais.
  - Utilizado como fallback em memória caso a tabela `showcase_cards` esteja vazia em ambiente local ou de teste, eliminando telas em branco.
- **Showcase Service (`src/features/promotions/server/services/showcase.service.ts`):**
  - Função `getShowcaseCards({ segment, stylePresetId, limit })` com cache e fallback para a semente local.

### 5. Frontend & UX no Passo 4 (`Step4StyleAndPalette`)

- Inclusão do componente acessível `ShowcaseGalleryDialog`:
  - Botão de acionamento mobile-first: _"Exemplos Reais por IA"_ posicionado acima ou ao lado das instruções de paleta.
  - Dialog modal (Radix UI / shadcn `Dialog`) com carrossel ou grid responsivo dos cards reais filtrados pelo segmento ativo.
  - Botão de destaque _"Usar este Estilo"_ em cada card da vitrine. Ao clicar:
    - Invoca `onSelectStyle(showcaseCard.stylePresetId)`.
    - Fecha o modal e destaca o card correspondente no grid de estilos.
    - Exibe toast ou feedback sutil (_"Estilo aplicado ao seu card!"_).
- Preservação integral do grid de miniaturas rápidas (`StyleMiniPostCard`), sem regressão de velocidade para usuários que preferem seleção direta.

---

## Testing Decisions

1. **Testes Baseados na Superfície Pública do Módulo (Replace-Don't-Layer):**
   - Não serão criados mocks complexos ou monkey-patching em bibliotecas de terceiros.
   - O `InMemoryStorageDriver` atua como a costura oficial (_seam_) para todos os testes unitários e de integração de serviços.
2. **Suíte de Testes do `StorageService` (`storage.service.test.ts`):**
   - Validação de upload, recuperação, resolução de URL pública e exclusão de assets.
   - Validação do chaveamento automático de driver baseado nas variáveis de ambiente.
3. **Suíte de Testes de Retrocompatibilidade (`delivery.service.test.ts` e `preview-generator.service.test.ts`):**
   - Validação de que pedidos e rascunhos contendo Data URLs Base64 legados continuam gerando downloads e visualizações válidas sem exceções.
   - Validação de que novos rascunhos e pedidos gravam e recuperam URLs e chaves do `StorageService`.
4. **Suíte de Testes da Vitrine e RPC (`showcase.test.ts` e `step4.test.tsx`):**
   - Validação da recuperação de cards curados filtrados por segmento e estilo.
   - Validação da seleção de estilo a partir da vitrine e atualização do estado do formulário no Passo 4.
   - Conformidade com o linter `./.agents/scripts/check_shadcn_usage.py` e responsividade mobile-first.

---

## Out of Scope

- **Upload direto via Presigned URL do browser do cliente (Direct Client Upload):** O upload de insumos continua sendo orquestrado pelo backend em Server Functions validadas por Zod para manter segurança e simplicidade (YAGNI).
- **Painel administrativo CMS para gerenciamento visual da vitrine:** A curadoria é gerenciada via seeds versionadas no código e migrações SQL no banco.
- **Migração em lote de banco de dados legado (Batch Migration Script):** Como há retrocompatibilidade total implementada na leitura, não há necessidade de rodar scripts pesados de migração de dados antigos para o R2 no MVP.
- **Redimensionamento dinâmico on-the-fly via Cloudflare Images Workers:** A formatação 1080×1350 e 1080×1920 permanece sendo executada pelo `ExportEngine` (Sharp) no servidor.

---

## Further Notes

- Compatível com a arquitetura descrita em `PRD.md` (Seção 7 - Armazenamento S3 compatível).
- Alinhado com o vocabulário canônico em `GLOSSARY.md` (`Export`, `Draft`, `Ad Card`, `Style Preset`, `Business Segment`).
- Atende aos requisitos de LGPD e segurança de arquivos descritos em `docs/specs/trust-compliance.md`.
