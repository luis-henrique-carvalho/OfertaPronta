# 03: Server Functions RPC & Order Polling Hooks

**Spec:** [`docs/specs/epico-3-checkout-pix.md`](../../specs/epico-3-checkout-pix.md)

**What to build:**
Criar a camada de RPC tipada de ponta a ponta utilizando as Server Functions (`createServerFn`) do TanStack Start com validação Zod, expondo as operações do checkout para o frontend sem vazamento de segredos de backend. Desenvolver os hooks de polling em tempo real (`use-order-polling.ts`) e operações de checkout (`use-pix-checkout.ts`) com TanStack Query para atualização automática do status e detecção imediata do pagamento.

**Blocked by:** `02: PixCheckoutService, Frozen Snapshot & Webhook Handler`

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Schemas e DTOs Zod (`src/features/checkout/data/checkout.schemas.ts`):**
  - Definir schemas estritos com Zod:
    - `initiateCheckoutSchema`: `{ draftId: z.string().min(1), customerWhatsapp: z.string().optional() }`
    - `orderIdSchema`: `{ orderId: z.string().uuid() }`
    - `updateWhatsappSchema`: `{ orderId: z.string().uuid(), whatsapp: z.string().min(10) }`
    - `checkoutDetailsOutputSchema`: DTO serializável seguro para consumo pelo client.

- [ ] **Server Functions RPC (`src/features/checkout/server/functions/checkout.functions.ts`):**
  - Implementar e exportar via `createServerFn`:
    - `initiateCheckoutFn`: valida entrada com Zod, invoca `PixCheckoutService.initiateCheckout` e retorna `{ orderId }`.
    - `getOrderCheckoutDetailsFn`: valida `orderId`, invoca `PixCheckoutService.getCheckoutDetails` e retorna os dados completos da cobrança.
    - `checkPaymentStatusFn`: valida `orderId`, invoca `PixCheckoutService.checkPaymentStatus` e retorna `{ status, isPaid }`.
    - `updateOrderWhatsappFn`: valida `orderId` e `whatsapp`, atualizando o contato de resgate.
    - `regenerateExpiredChargeFn`: valida `orderId` e gera uma nova cobrança se a atual tiver expirado.
  - Consolidar exports em `src/features/checkout/server/index.ts`.

- [ ] **Hooks de Cliente (`src/features/checkout/hooks/`):**
  - **`use-order-polling.ts`**:
    - Utilizar TanStack Query com `refetchInterval: 3000` (3 segundos).
    - Desativar o polling automaticamente quando o status for `PAID`, `CANCELLED` ou quando a tela for desmontada.
    - Disparar o callback `onPaymentConfirmed` quando `isPaid` for verdadeiro.
  - **`use-pix-checkout.ts`**:
    - Mutação para cópia do código Pix Copia e Cola com cópia nativa via `navigator.clipboard` e feedback booleano (`isCopied`).
    - Mutação para salvar/atualizar o WhatsApp de resgate opcional.
    - Mutação para reemitir Pix expirado com invalidação de query.

- [ ] **Testes de RPC e Hooks:**
  - Testes em `src/features/checkout/server/functions/checkout.functions.test.ts` verificando a validação Zod de entrada e saída.
  - Testes em `src/features/checkout/hooks/use-order-polling.test.ts` verificando que o polling para quando o pagamento é detectado como `PAID`.
