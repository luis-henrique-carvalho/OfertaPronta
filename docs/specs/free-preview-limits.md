# Spec: Limites de Prévia Gratuita e Fechamento do Vazamento da Imagem Limpa

- **Slug**: `free-preview-limits`
- **Status**: `ready-for-agent`

## Problem Statement

Hoje a cota de 1 geração gratuita é por `draft`. `saveOfferDraft` cria um draft novo (`aiGenerationCount: 0`) sem identidade nem limite, então qualquer pessoa ou bot gera prévias de IA ilimitadas, com custo de API sem teto. Além disso, `getDraftFn`/`formatDraftForClient` devolvem `cleanMasterImageDataUrl`/`cleanMasterAssetKey` ao navegador. Isso expõe a imagem **sem marca d'água** antes do pagamento (P0). O `saveOfferDraftSchema` também aceita do cliente campos que só o servidor preenche, e o auto-save apaga o master.

## Solution

1. **P0 integridade**: o DTO de saída do draft passa a ser uma allowlist sem campos limpos. A entrada deixa de aceitar campos server-only. O auto-save preserva o master.
2. **Cotas por janela móvel de 24h**, verificadas e consumidas de forma atômica no servidor antes de chamar o Gemini:
   - 2 prévias por visitante (cookie httpOnly assinado com HMAC + registro no banco).
   - 6 prévias por IP (só o hash do IP é guardado).
   - Teto global diário de gerações grátis (`FREE_PREVIEW_DAILY_BUDGET`, padrão 300).
3. **Limite atingido**: o usuário vê o último card (prévia com marca d'água) e o CTA "Liberar por R$ 9,90", que leva ao checkout do último draft.

## User Stories

1. Como microempresário, quero gerar até 2 prévias grátis por dia, para testar variações antes de pagar.
2. Como microempresário, ao bater o limite, quero ver meu último card com o botão "Liberar por R$ 9,90", para pagar sem perder o trabalho.
3. Como dono do produto, quero que reiniciar a página ou criar um draft novo não zere a cota, para limitar o custo de IA.
4. Como dono do produto, quero que limpar cookies ou usar aba anônima ainda esbarre no limite por IP, para dificultar abuso casual.
5. Como dono do produto, quero um teto global diário configurável, para que um ataque ou pico não estoure a conta do Gemini.
6. Como visitante, quero que uma falha da IA não gaste minha cota, para não ser punido por erro do sistema.
7. Como dono do produto, quero que a imagem limpa nunca chegue ao navegador antes do pagamento, para proteger a receita.
8. Como visitante, quero que o auto-save do formulário não apague minha prévia gerada.
9. Como dono do produto, quero que o cliente não consiga forjar `cleanMaster*`, `previewCardImageUrl` nem `previewAssetKey`, para que o checkout não confie em dados adulterados.
10. Como cliente que pagou, quero que as 3 regenerações pós-pagamento continuem funcionando, sem passar pelas cotas grátis.
11. Como visitante em rede 4G compartilhada (CGNAT), quero uma mensagem clara quando o limite do IP for atingido, com o CTA de pagamento, se houver card anterior.
12. Como visitante sem nenhum card anterior que bateu o limite (IP compartilhado, teto global), quero uma mensagem clara de limite, sem CTA de checkout.
13. Como dono do produto, quero que duas requisições simultâneas não ultrapassem a cota (atomicidade).

## Implementation Decisions

**Regras de negócio**

- Janela: móvel de 24h (`created_at > now() - interval '24 hours'`). Constantes: `VISITOR_LIMIT=2`, `IP_LIMIT=6`. `FREE_PREVIEW_DAILY_BUDGET` é um env validado com Zod em `server-env.ts` (inteiro, padrão 300). O dia do teto global é o dia UTC-3 (America/Sao_Paulo), ou uma janela móvel de 24h (escolha do builder; documentar).
- A ordem de checagem é: teto global, depois IP, depois visitante. Todas dentro da mesma transação, com `reserve` antes do Gemini.
- Reserva atômica: dentro de uma transação, `pg_advisory_xact_lock` por chave (visitante, IP e um lock global), conta as linhas da janela e insere a linha com status `RESERVED`. Se o limite estiver estourado, retorna `QUOTA_EXCEEDED` com `reason: "visitor" | "ip" | "global"`.
- Falha da geração: a linha reservada vira `FAILED` (ou é apagada) e **não conta** na cota. Só as linhas `RESERVED` (recentes) e `CONSUMED` contam. Reservas `RESERVED` com mais de ~5 min são ignoradas (crash).
- Retry com o mesmo draft: continua sujeito às cotas (cada geração bem-sucedida consome 1).
- A cota deixa de ser por draft. O `aiGenerationCount` por draft pode ser mantido apenas como informação; o limite é o ledger.
- Regerações pós-pagamento (delivery, 3 por pedido) **não** passam pelo ledger grátis.
- Pedido já PAGO: não aplicar cota grátis.

**Identidade do visitante**

- Cookie `op_vid` httpOnly, Secure (em prod), SameSite=Lax, 1 ano, valor `<uuid>.<hmac-sha256>`. O segredo vem de `server-env` (novo `VISITOR_COOKIE_SECRET`, ou reaproveitar um segredo existente se já houver). Cookie ausente ou com assinatura inválida: emite um novo visitante (não herda cota; o IP segura).
- IP: o primeiro valor de `x-forwarded-for` (ou do header do proxy confiável); `sha256(ip + segredo)` armazenado. O IP puro nunca é persistido nem logado. Se não houver IP, usar o bucket `unknown` (sujeito ao limite, que é conservador).

**Schema (novo, em `src/server/db/schema/promotions.ts`)**: tabela `free_preview_ledger` com `id`, `visitor_id`, `ip_hash`, `draft_id`, `status` (`RESERVED|CONSUMED|FAILED`), `created_at`, e índices em `(visitor_id, created_at)`, `(ip_hash, created_at)` e `(created_at)`. Migração via `pnpm db:generate && pnpm db:migrate`.

**Deep module**: `FreePreviewQuota` (`src/features/promotions/server/services/free-preview-quota.service.ts`), interface pequena:

- `reservePreview({ visitorId, ipHash, draftId, now? }) → { ok: true, reservationId } | { ok: false, reason }`
- `settlePreview(reservationId, "CONSUMED" | "FAILED")`
- `getQuotaStatus({ visitorId, ipHash }) → { remaining, blockedReason | null }` (usado para mostrar a UI sem gastar).
- Auxiliares de cookie e IP ficam no mesmo módulo ou em `visitor-identity.ts` (função pura `signVisitorId`/`verifyVisitorId`, `hashIp`).

**Integração**

- `generatePreviewFn` resolve a identidade (cookie, IP), chama `reservePreview` **antes** do Gemini e depois chama `settlePreview`. Em `QUOTA_EXCEEDED`, retorna um resultado tipado (não lança): `{ status: "LIMIT_REACHED", reason, lastDraft: DraftDto | null }`, e o `lastDraft` é o último draft com prévia desse visitante (via ledger `CONSUMED` mais recente → `draft_id`), caso exista.
- O checkout do último draft usa o fluxo existente de criação de pedido para o `draftId`.

**P0 — DTO e integridade**

- `formatDraftForClient` passa a construir o DTO por allowlist explícita: nunca inclui `cleanMasterImageDataUrl`, `cleanMasterAssetKey`, nem chaves internas de storage. A prévia entregue é só a com marca d'água. Validar a saída com Zod (`draftClientDtoSchema`).
- `saveOfferDraftSchema` remove `cleanMasterImageDataUrl`, `cleanMasterAssetKey`, `previewCardImageUrl` e `previewAssetKey`. Campos desconhecidos são removidos (`strip`) ou rejeitados.
- `saveOfferDraft` no update **nunca** sobrescreve os campos server-only (sem `?? null`); o `UPDATE` só inclui os campos do briefing e das imagens de insumo.
- O checkout/`pix-checkout.service` lê os campos de preview do registro do banco, nunca do payload do cliente.
- Também validar que o `draftId` não permite ler o draft de outro visitante: fora de escopo (o id é um UUID não adivinhável), mas o DTO não vaza o master.

**UX (mobile-first)**

- `LiveCardPreview`/`PreviewView`: ao receber `LIMIT_REACHED`, exibe o `lastDraft` (com marca d'água), o texto explicativo conforme o `reason` e o botão primário "Liberar por R$ 9,90" → `/checkout/$orderId` (criando o pedido do último draft). Se `lastDraft` for nulo, exibe só a mensagem de limite.
- O botão de gerar mostra o restante da cota ("1 prévia grátis restante hoje") a partir de `getQuotaStatus`, e um estado desabilitado com o CTA quando bloqueado.
- Textos: `visitor` e `ip` → "Você já usou suas prévias grátis de hoje. Libere este card sem marca d'água por R$ 9,90."; `global` → "Prévias grátis esgotadas por hoje. Libere este card por R$ 9,90 ou volte amanhã."

## Testing Decisions

- Testar no seam público do deep module `FreePreviewQuota` com o Postgres de teste, ou fake in-memory se for o padrão do repositório (ver os testes existentes de `drafts.service`/`pix-checkout`). Casos: o 3º por visitante bloqueia; o 7º por IP bloqueia; o teto global bloqueia; o `FAILED` não conta; concorrência (N chamadas paralelas → no máximo o limite); janela de 24h (injetar `now`).
- `generatePreviewFn`/service: o Gemini fake **não é chamado** quando a cota está estourada; falha do Gemini → `FAILED`; sucesso → `CONSUMED`.
- P0: teste que `getDraft`/`formatDraftForClient` não contém `cleanMaster*` (inclusive com o draft gerado); `saveOfferDraftSchema` rejeita/remove os campos server-only; update de auto-save após a geração preserva o master; o checkout ignora os campos forjados.
- Cookie: assinatura válida, adulterada, ausente.
- Frontend: renderiza o estado `LIMIT_REACHED` com e sem `lastDraft`, o CTA navega para o checkout; o contador de restantes.
- Rodar apenas os testes dos arquivos editados + `pnpm typecheck` (builders); o pipeline completo fica com o test-verifier.

## Out of Scope

- Captcha/Cloudflare Turnstile, OTP/WhatsApp antes da prévia, prévia em baixa resolução.
- Contas de usuário, pacotes de crédito, painel de telemetria/abuso.
- Alterações nas 3 regenerações pós-pagamento.
- Proteção contra leitura de drafts alheios por `draftId` (UUID não adivinhável).

## Further Notes

- Análise de origem: `analise-cota-geracao-gratuita.md` (conversa do agente pai). Termos do `GLOSSARY.md`: Draft, Offer Brief, Order, Frozen Snapshot.
- Calibrar `FREE_PREVIEW_DAILY_BUDGET` com o custo real por imagem e a taxa de conversão.

### Critérios BDD

- **Dado** um visitante com 2 prévias geradas nas últimas 24h, **quando** pede a 3ª, **então** o Gemini não é chamado e recebe `LIMIT_REACHED(visitor)` com o último card e o CTA de R$ 9,90.
- **Dado** 6 prévias do mesmo IP (hash) em 24h, **quando** um visitante novo (sem cookie) pede outra, **então** recebe `LIMIT_REACHED(ip)`.
- **Dado** o teto global atingido, **quando** qualquer visitante pede, **então** recebe `LIMIT_REACHED(global)`.
- **Dado** que o Gemini falha, **então** a cota do visitante, do IP e a global permanecem inalteradas.
- **Dado** 2 requisições simultâneas com 1 vaga restante, **então** exatamente uma é reservada.
- **Dado** um draft gerado, **quando** o cliente chama `getDraftFn`, **então** a resposta não contém `cleanMasterImageDataUrl` nem `cleanMasterAssetKey`.
- **Dado** um payload de `saveDraftFn` com `cleanMasterImageDataUrl`, **então** o campo é rejeitado ou ignorado e o master armazenado fica intacto.
- **Dado** um auto-save após a geração, **então** o master e a prévia permanecem.
- **Dado** um pedido pago, **quando** regenera, **então** a cota grátis não é consultada.
