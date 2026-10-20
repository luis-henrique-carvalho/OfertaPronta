# Ticket 01: Backend Contracts & Regeneration Service Alignment

**Blocked by:** N/A (Execução Imediata / Concorrente)

## Contexto & Objetivo
Atualizar o contrato de regeneração pós-pagamento (`RequestRegenerationInput`) para aceitar seletores de estilo (`stylePresetId`) e paleta de cores (`colorPalette`), mapeando-os adequadamente no `PostPaymentRegenerationService` para injeção no prompt multimodal da IA sem quebrar compatibilidade retroativa.

## Arquivos a Modificar / Criar
- `src/features/delivery/data/delivery.schemas.ts`: Adicionar campos opcionais `stylePresetId` e `colorPalette` ao `requestRegenerationInputSchema`.
- `src/features/delivery/server/services/post-payment-regeneration.service.ts`: Mapear `stylePresetId` e combinar `colorPalette` em `customStyleInstructions` dentro de `prepareRegenerationContext`.
- `src/features/delivery/server/services/post-payment-regeneration.service.test.ts`: Testes unitários cobrindo regeneração com novos parâmetros de estilo/cor.

## Critérios de Aceite (BDD)
- [ ] O schema `requestRegenerationInputSchema` valida com sucesso requisições contendo `stylePresetId` e/ou `colorPalette`.
- [ ] O serviço `PostPaymentRegenerationService` combina a paleta de cores solicitada com as instruções de estilo anteriores.
- [ ] Se nenhum estilo for informado, o comportamento padrão existente é estritamente preservado.
- [ ] Execução cirúrgica do teste: `pnpm vitest run src/features/delivery/server/services/post-payment-regeneration.service.test.ts` passa com 100% de sucesso.
- [ ] `pnpm typecheck` passa sem erros.
