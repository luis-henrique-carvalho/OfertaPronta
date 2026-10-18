# 02: Delivery Server Functions & Download API Route

**Spec:** [`docs/specs/epico-4-entrega-e-regeneracao.md`](../../specs/epico-4-entrega-e-regeneracao.md)

**What to build:**
Implementar a fronteira RPC e os contratos de comunicação da feature de entrega: schemas Zod de validação de entrada/saída, Server Functions RPC com TanStack Start (`getOrderDeliveryDetailsFn` e `recordCardDownloadFn`) e a rota de endpoint de download de arquivos binários (`src/routes/api.delivery.download.ts`). O endpoint deve servir os arquivos PNG Feed (1080×1350) e Story (1080×1920) com headers de cabeçalho `Content-Disposition: attachment; filename="ofertapronta-<format>-<orderId>.png"` e registrar a métrica de download com acesso permanente.

**Blocked by:** `docs/tickets/epico-4-entrega-e-regeneracao/01-clean-master-art-and-delivery-service.md`

**Status:** `complete`

## Acceptance Criteria (BDD)

- [x] **Dado** o módulo de dados `src/features/delivery/data/delivery.schemas.ts`, **quando** validado com Zod, **então** deve definir tipagem estrita para `getOrderDeliveryDetailsInputSchema`, `deliveryDetailsResultSchema`, `recordDownloadInputSchema` e `downloadFormatEnum` ("feed" | "story").
- [x] **Dado** a Server Function `getOrderDeliveryDetailsFn`, **quando** chamada com um `orderId` válido e pago, **então** deve delegar ao `DeliveryService`, garantindo o retorno completo com `feedCardUrl`, `storyCardUrl`, cota de regeneração (`remainingRegenerations`) e fim da janela de ajuste (`regenerationWindowEndsAt`).
- [x] **Dado** a Server Function `getOrderDeliveryDetailsFn`, **quando** chamada com um `orderId` pendente de pagamento, **então** deve retornar erro amigável estruturado informando que o pagamento ainda não foi confirmado, orientando o redirecionamento para o checkout.
- [x] **Dado** o endpoint HTTP `src/routes/api.delivery.download.ts`, **quando** receber uma requisição `GET ?orderId=<id>&format=feed`, **então** deve verificar a autenticidade do pedido pago, invocar `DeliveryService.getExportBinary`, registrar o download e retornar o buffer PNG com headers HTTP adequados (`Content-Type: image/png`, `Content-Disposition: attachment; filename="ofertapronta-feed-<orderId>.png"` e `Cache-Control: private, no-transform`).
- [x] **Dado** uma requisição de download para um formato inválido ou pedido não pago/inexistente, **quando** o endpoint processar a requisição, **então** deve retornar HTTP 400 ou HTTP 403 com mensagem JSON explicativa.
- [x] **Dado** o isolamento de camadas do projeto, **quando** os testes `server-isolation.test.ts` forem executados, **então** nenhum código de backend (Sharp, Drizzle, bibliotecas de imagem) deve ser importado fora de diretórios `server/`.
