# 01 — Backend Stream: P0 + FreePreviewQuota

- **Spec**: `docs/specs/free-preview-limits.md`
- **Blocked by**: nenhum (roda em paralelo com o 02, que usa o contrato abaixo)

## Escopo

1. **P0 DTO/integridade**
   - `formatDraftForClient` em `drafts.service.ts` com allowlist e `draftClientDtoSchema` (Zod) em `offer-brief.schema.ts`, sem `cleanMaster*` nem chaves de storage.
   - `saveOfferDraftSchema` sem `cleanMasterImageDataUrl`, `cleanMasterAssetKey`, `previewCardImageUrl` e `previewAssetKey`.
   - `saveOfferDraft` (update) não sobrescreve campos server-only; o auto-save preserva o master.
   - O checkout (`pix-checkout.service.ts`) lê os campos de preview do banco.
2. **Schema + migração**: tabela `free_preview_ledger` (ver a spec). Rodar `pnpm db:generate && pnpm db:migrate` na worktree e commitar o SQL.
3. **Env**: `FREE_PREVIEW_DAILY_BUDGET` (padrão 300) e o segredo do cookie em `server-env.ts` (Zod). Documentar em `.env.example`, sem segredos reais.
4. **Deep module `FreePreviewQuota`** (`free-preview-quota.service.ts`, mais `visitor-identity` para HMAC e hash de IP): `reservePreview`, `settlePreview`, `getQuotaStatus`. Atômico (transação + `pg_advisory_xact_lock`), janela de 24h, ordem global → IP → visitante, `RESERVED` expirando em ~5 min.
5. **Integração em `generatePreviewFn`/`preview-generator.service.ts`**: resolver o cookie `op_vid` (httpOnly, assinado; emite um novo se faltar ou for inválido) e o IP (hash); reservar **antes** do Gemini; settle `CONSUMED` ou `FAILED`; trocar `validateDraftQuota` pelo ledger.
   - Contrato de retorno do Zod (congelado): `{ status: "OK", draft: DraftDto } | { status: "LIMIT_REACHED", reason: "visitor"|"ip"|"global", lastDraft: DraftDto | null }`.
   - Nova server function `getPreviewQuotaFn` → `{ remaining: number, blockedReason: "visitor"|"ip"|"global"|null }`.
6. Regerações pós-pagamento não são tocadas.

## Critérios de aceite

Ver a seção "Critérios BDD" da spec. Testes no seam público (cota: limites, janela com `now` injetado, `FAILED` não conta, concorrência, cookie válido/adulterado; gerador: Gemini fake não chamado se estourou; P0: DTO sem master, schema, auto-save, checkout).

## Validação (builder)

`pnpm vitest run <testes editados>` + `pnpm typecheck`. Sem `pnpm test` global nem build.
