# 01: Schemas de Banco, Zod e Snapshot Congelado com Preço Condicional

**Spec:** [`docs/specs/epico-6-redesign-criacao-micro-passos.md`](../../specs/epico-6-redesign-criacao-micro-passos.md)

**What to build:**
Evolução dos schemas centrais de dados da aplicação para suportar o novo fluxo de criação em micro-passos:

1. Oficialização de `fashion` ("Moda & Roupas") no enum `BUSINESS_SEGMENTS`.
2. Adição dos campos `cardIntent`, `customIntentText` e `logoImageDataUrl` na tabela Drizzle `drafts` e no schema Zod `saveOfferDraftSchema`.
3. Validação condicional de preço no schema Zod (`promoPrice` obrigatório apenas para `cardIntent === "promo"`, opcional para `custom` e omitido/opcional para os outros 4 objetivos).
4. Persistência dos 3 novos campos no `frozenSnapshot` imutável do pedido no `PixCheckoutService`.

**Blocked by:** None (can start immediately)

**Status:** `completed`

## Acceptance Criteria (BDD)

- [x] **Segmento Fashion em Schemas**:
  - `BUSINESS_SEGMENTS` contém `"fashion"`.
  - `saveOfferDraftSchema` aceita `businessSegment: "fashion"`.
- [x] **Novas Colunas na Tabela `drafts`**:
  - `drafts.cardIntent` (`text` com default `"promo"`).
  - `drafts.customIntentText` (`text`, nullable).
  - `drafts.logoImageDataUrl` (`text`, nullable).
  - `saveOfferDraft` persiste e recupera com sucesso os três campos no PostgreSQL via Drizzle.
- [x] **Validação Condicional Zod**:
  - Dado um rascunho com `cardIntent: "promo"`, quando submetido sem `promoPrice`, a validação falha indicando que o preço promocional é obrigatório.
  - Dado um rascunho com `cardIntent: "new-arrival"` (ou `special-date`, `announcement`, `schedule`), quando submetido sem `promoPrice`, a validação passa com sucesso.
  - Dado um rascunho com `cardIntent: "custom"`, quando submetido sem `customIntentText`, a validação falha exigindo a descrição do objetivo.
- [x] **Snapshot Congelado do Pedido**:
  - Quando um pedido é criado via `initiateCheckout`, o objeto `frozenSnapshot` gravado na tabela `orders` inclui `cardIntent`, `customIntentText` e `logoImageDataUrl`.
- [x] **Suíte de Testes Automatizados**:
  - Testes unitários cobrindo o schema Zod (`offer-brief.schema.test.ts`).
  - Testes cobrindo persistência de rascunhos (`drafts.service.test.ts`).
  - Testes cobrindo congelamento do snapshot (`pix-checkout.service.test.ts`).
