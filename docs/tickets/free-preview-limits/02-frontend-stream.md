# 02 — Frontend Stream: Estado de limite atingido e CTA de checkout

- **Spec**: `docs/specs/free-preview-limits.md`
- **Blocked by**: nenhum. Usa o contrato congelado do ticket 01 (pode usar um stub tipado até o backend integrar).

## Escopo

1. Tratar o novo retorno de `generatePreviewFn` (`OK` | `LIMIT_REACHED{reason,lastDraft}`) em `use-ad-card-generator` e em `use-promotion-draft`. Não tratar como erro.
2. Consumir `getPreviewQuotaFn` (TanStack Query) e mostrar "N prévia(s) grátis restante(s) hoje" ao lado do botão de gerar; estado bloqueado com o CTA quando `blockedReason != null`.
3. `PreviewView`/`LiveCardPreview`: no `LIMIT_REACHED`, exibir `lastDraft` (com marca d'água), o texto por `reason` (ver a spec) e o botão primário **"Liberar por R$ 9,90"** → cria o pedido do último draft e navega para `/checkout/$orderId` (fluxo existente). Sem `lastDraft`: só a mensagem de limite, sem CTA.
4. O front não pode depender de `cleanMaster*` (removido do DTO); ajustar tipos e usos que ainda os referenciam. O preço exibido vem do catálogo existente (não hardcode do valor cobrado).
5. Mobile-first (360–430px), componentes shadcn/ui, kebab-case, sem `any`.

## Critérios de aceite

Os BDDs de UX da spec: a tela de limite mostra o último card e o CTA, e o CTA leva ao checkout. O contador de restantes é exibido. Testes de UI/hook para `LIMIT_REACHED` com e sem `lastDraft`, o estado bloqueado e a navegação do CTA.

## Validação (builder)

`pnpm vitest run <testes editados>` + `pnpm typecheck` + `./.agents/scripts/verify.sh --shadcn`.
