# Ticket 02: Testes Automatizados, Validação de Regressão e Limpeza de Componentes Obsoletos

**Slug**: `redesign-checkout-simplificado`  
**Ticket**: `02-test-and-cleanup.md`  
**Responsável**: `test-verifier` / `frontend-builder`  
**Blocked by**: `01-frontend-stream.md`  
**Status**: Ready

---

## 1. Contexto & Requisitos

Garantir que a nova experiência do checkout passe em todos os testes unitários, de renderização e de integração sem quebras de regressão, removendo ou ajustando os componentes e testes legados.

## 2. Tarefas de Implementação

1. **Atualizar `src/features/checkout/views/checkout-view.test.tsx`**:
   - Ajustar asserções para o novo showcase do card (`AdCardCheckoutShowcase`) e o painel unificado (`UnifiedPixPaymentCard`).
   - Testar clique em "Copiar Código Pix" e chamada do callback `copyPixCode`.
   - Testar troca de abas para visualização do QR Code.
   - Testar abertura do acordeão de WhatsApp e submissão do formulário.
   - Testar expiração do Pix e botão de regeneração.
   - Testar renderização de sucesso pós-pagamento (`CheckoutPaidSuccessCard`).

2. **Limpeza e Auditoria de Componentes**:
   - Manter exportações retrocompatíveis ou arquivar componentes legados que foram absorvidos pelo card unificado.
   - Garantir conformidade com Shadcn UI (`./.agents/scripts/verify.sh --shadcn`).

3. **Validação do Pipeline Completo**:
   - Executar `./.agents/scripts/verify.sh` na íntegra (Shadcn + Typecheck + ESLint + Vitest + Build Nitro).
   - Validar responsividade mobile (390px) e desktop (1440px).

## 3. Critérios de Aceite (BDD)

- [x] Todos os testes em `checkout-view.test.tsx` passam com 100% de sucesso.
- [x] O pipeline oficial `./.agents/scripts/verify.sh` passa com zero erros e zero warnings.
- [x] Nenhum vazamento de código server-only no client.
- [x] Zero comentários de supressão de lint (`eslint-disable`).
