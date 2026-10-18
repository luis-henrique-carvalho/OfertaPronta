# 03: Post-Payment AI Regeneration Service & Server Function

**Spec:** [`docs/specs/epico-4-entrega-e-regeneracao.md`](../../specs/epico-4-entrega-e-regeneracao.md)

**What to build:**
Implementar o motor de regeneração e refinamento com Inteligência Artificial pós-pagamento (`PostPaymentRegenerationService`) e a Server Function `requestCardRegenerationFn`. O serviço permite ao microempresário realizar até 3 ajustes no seu Card Publicitário (alterando título da oferta, preços promocionais e instrução livre para a IA) dentro da janela de 30 minutos pós-pagamento (`paidAt + 30 min`), reutilizando a foto de produto original e regerando os formatos Feed e Story sem custo adicional.

**Blocked by:** `docs/tickets/epico-4-entrega-e-regeneracao/01-clean-master-art-and-delivery-service.md`

**Status:** `complete`

## Acceptance Criteria (BDD)

- [x] **Dado** um pedido pago com cota disponível (`aiRegenerationCount < 3`) e dentro do prazo (`Date.now() <= paidAt + 30m`), **quando** `PostPaymentRegenerationService.regenerateOrderCard` for acionado com alterações de texto/preço e instrução de ajuste, **então** deve mesclar os novos dados com os dados originais do pedido (mantendo a foto original do produto).
- [x] **Dado** uma solicitação de regeneração elegível, **quando** o sintetizador de IA (`AdCardGenerator` / Gemini Multimodal) gerar com sucesso a nova arte limpa, **então** deve:
  - Formatar imediatamente a nova arte para Feed (1080×1350) e Story (1080×1920) via `ExportEngine`;
  - Incrementar atomicamente `orders.aiRegenerationCount` em 1;
  - Atualizar `orders.cleanMasterImageDataUrl` com a nova arte mestre;
  - Atualizar `deliveryExports` com as novas URLs e resetar a data de modificação;
  - Retornar o DTO `DeliveryDetailsResult` atualizado.
- [x] **Dado** um pedido onde `orders.aiRegenerationCount >= 3`, **quando** uma nova tentativa de regeneração for solicitada, **então** deve lançar o erro de negócio `REGENERATION_QUOTA_EXCEEDED` ("Você já utilizou o limite máximo de 3 regenerações incluídas neste pedido").
- [x] **Dado** um pedido pago há mais de 30 minutos (`Date.now() > paidAt + 30m`), **quando** uma nova regeneração for solicitada, **então** deve lançar o erro de negócio `REGENERATION_WINDOW_EXPIRED` ("A janela de 30 minutos para ajustes por IA neste pedido expirou").
- [x] **Dado** uma falha transitória ou erro na API externa do Gemini durante a regeneração, **quando** o erro for interceptado, **então** a cota de regeneração do usuário NÃO deve ser debitada (`aiRegenerationCount` permanece intacto) e uma exceção descritiva deve ser retornada ao chamador.
- [x] **Dado** a Server Function `requestCardRegenerationFn`, **quando** invocada pelo frontend, **então** deve validar a entrada com `requestRegenerationInputSchema` (Zod) e retornar a resposta tipada de sucesso ou erro amigável.
- [x] **Dado** a suíte de testes unitários em `post-payment-regeneration.service.test.ts`, **quando** executada com `pnpm test`, **então** deve cobrir exaustivamente: happy path de ajuste, cota esgotada (4ª tentativa), tempo expirado (>30min) e resiliência de erro sem consumo indevido de cota.
