# 01: Clean Master Art Persistence & Delivery Fulfillment Service

**Spec:** [`docs/specs/epico-4-entrega-e-regeneracao.md`](../../specs/epico-4-entrega-e-regeneracao.md)

**What to build:**
Garantir a persistência da arte mestre limpa gerada pela IA (sem marca d'água) no rascunho e no pedido, e implementar o módulo profundo de entrega `DeliveryService`. O serviço é responsável por validar o pagamento (`status === 'PAID'`), formatar os arquivos finais em alta resolução nos padrões oficiais (Feed 1080×1350 e Story 1080×1920) via `ExportEngine`, persistir a entidade `deliveryExports` no banco de dados com acesso permanente (sem expiração de downloads) e gerenciar métricas de entrega (`downloadCount`, `lastDownloadedAt`).

**Blocked by:** None (can start immediately)

**Status:** `complete`

## Acceptance Criteria (BDD)

- [x] **Dado** que o rascunho gera a prévia gratuita com a IA, **quando** a síntese do Gemini for concluída, **então** o buffer limpo deve ser preservado de forma protegida em `drafts.cleanMasterImageDataUrl` antes de aplicar a marca d'água visual.
- [x] **Dado** que um pedido é criado via `PixCheckoutService.initiateCheckout`, **quando** o snapshot for congelado, **então** a arte mestre limpa do rascunho deve ser incluída no `frozenSnapshot` e gravada no pedido `orders.cleanMasterImageDataUrl`.
- [x] **Dado** um pedido com status `PENDING`, `EXPIRED` ou `CANCELLED`, **quando** o método `DeliveryService.ensureDeliveryExports(orderId)` ou `getDeliveryDetails(orderId)` for invocado, **então** deve lançar um erro explícito de autorização (`ORDER_NOT_PAID`), impedindo a liberação de imagens sem marca d'água.
- [x] **Dado** um pedido com status `PAID`, **quando** `ensureDeliveryExports(orderId)` for executado pela primeira vez, **então** deve formatar o Card para Feed (1080×1350) e Story (1080×1920) em PNG via `formatFeedCard` e `formatStoryCard`, persistir em `deliveryExports` garantindo acesso permanente aos downloads, e retornar o DTO `DeliveryDetailsResult`.
- [x] **Dado** um pedido já processado, **quando** `ensureDeliveryExports(orderId)` for chamado novamente, **então** deve operar de forma estritamente idempotente, retornando os dados já existentes sem reprocessamento gráfico redundante.
- [x] **Dado** um download solicitado via `DeliveryService.recordDownload(orderId, format)`, **quando** for invocado, **então** deve incrementar atomicamente `deliveryExports.downloadCount` e atualizar `lastDownloadedAt` com a data atual.
- [x] **Dado** a suíte de testes de backend, **quando** executada com `pnpm test`, **então** todos os testes unitários e de integração de `delivery.service.test.ts` devem passar com 100% de sucesso.
