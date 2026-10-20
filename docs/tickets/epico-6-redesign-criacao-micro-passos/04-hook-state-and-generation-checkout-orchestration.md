# 04: Hook de Estado e Orquestração de Geração com Redirecionamento ao Checkout

**Spec:** [`docs/specs/epico-6-redesign-criacao-micro-passos.md`](../../specs/epico-6-redesign-criacao-micro-passos.md)

**What to build:**
Evolução do hook `useOfferBriefDraft` (`src/features/promotions/hooks/use-offer-brief-draft.ts`) para gerenciar todos os estados do novo fluxo em micro-passos (`cardIntent`, `customIntentText`, `logoImageDataUrl`, `customStyleNote`, seleção de segmento e estilos). Implementação do método orquestrador de geração que salva o rascunho, invoca a Server Function `generatePreviewFn`, inicia o pedido via `initiateCheckoutFn` e retorna o `orderId` para redirecionamento direto para a tela de checkout Pix.

**Blocked by:**
- `01: Schemas de Banco, Zod e Snapshot Congelado com Preço Condicional`
- `02: Prompting Multimodal Gemini com Logotipo, Objetivos e Preço Opcional`

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Gerenciamento de Novos Estados no Hook**:
  - `cardIntent`: padrão `"promo"`, com setter tipado.
  - `customIntentText`: texto para objetivo personalizado.
  - `logoImageDataUrl`: base64 Data URL da logomarca da loja.
  - `customStyleNote`: texto ou paleta selecionada para personalização de cores.
- [ ] **Validação Inteligente de Formulário**:
  - `validateStep2()`:
    - Retorna `false` se `businessName` ou `offerTitle` estiverem vazios.
    - Se `cardIntent === "promo"`, retorna `false` se `promoPrice` estiver vazio.
    - Se `cardIntent !== "promo"` (e não for `custom` com preço ativo), valida com sucesso mesmo sem `promoPrice`.
    - Se `cardIntent === "custom"`, retorna `false` se `customIntentText` estiver vazio.
- [ ] **Fluxo Contínuo de Geração e Início de Checkout**:
  - Método `generateCardAndInitiateCheckout()`:
    1. Salva o rascunho atualizado via `saveDraft()`.
    2. Dispara a síntese via `generatePreviewFn({ data: { draftId } })` atualizando os estágios do loader (`briefing` -> `composing` -> `watermarking`).
    3. Em caso de sucesso na geração da prévia, chama imediatamente `initiateCheckoutFn({ data: { draftId, customerWhatsapp } })`.
    4. Retorna `{ success: true, orderId: string }` para que a tela navegue imediatamente para `/checkout/$orderId`.
- [ ] **Tratamento Resiliente de Erros e Cota**:
  - Em caso de falha de IA (timeout, rate limit ou safety filter), atualiza `generationError` sem queimar cota e sem disparar checkout.
  - Em caso de cota de prévia gratuita excedida (`AI_QUOTA_EXCEEDED`), aproveita a prévia existente e inicia o checkout Pix normalmente.
- [ ] **Suíte de Testes Automatizados**:
  - Testes do hook `useOfferBriefDraft.test.ts` cobrindo validação de cada objetivo, salvamento dos novos campos e orquestração do checkout.
