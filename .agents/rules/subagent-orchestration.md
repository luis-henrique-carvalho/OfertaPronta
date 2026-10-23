---
trigger: always_on
description: Organiza tarefas grandes com os recursos de delegação disponíveis no ambiente, sem impor ferramentas específicas.
---

## Orquestração Mandatória de Subagentes (Padrão Boost & Feature Factory)

Neste repositório, o agente primário da conversa atua como **User Bridge** e a execução técnica é delegada ao subagente **`feature-orchestrator`**.

### Regras Inegociáveis de Execução:

1. **Topologia Hierárquica de Planejamento e Execução**:
   - **Nível 1 — Chat Canvas (Root / User Bridge)**:
     - Coordena a descoberta inicial acionando `codebase-researcher` (`model: flash`) para mapeamento rápido do grafo (`graphify query`).
     - **Fast-Track Pós-Protótipo (Anti-Cerimônia)**:
       - Se a funcionalidade **já possui um protótipo funcional validado pelo usuário** na sessão (ex: via `/prototype`), **PULE** o despacho de `product-manager` e `to-tickets`. Despache diretamente o **`solution-architect`** (`model: inherit`) para consolidar a arquitetura em `docs/plans/<slug>.md` e gerar no máximo **2 Macro-Tickets** (`01-backend-stream.md` e `02-frontend-stream.md`).
     - **Fluxo Standard (Demandas do Zero sem Protótipo)**:
       - Delega o **Gate 0 Mandatório (`/grill-me`) e Planejamento (`/plan`)** para a dupla de especialistas em `model: inherit`:
         - **`product-manager`**: analisa regras de negócio e UX via `ask_question`, salvando a Spec em `docs/specs/<slug>.md` e fatiando em no máximo **2 a 3 Macro-Tickets** em `docs/tickets/<slug>/`.
         - **`solution-architect`**: avalia arquitetura (*Deep Modules*), segurança e qualidade, redigindo `docs/plans/<slug>.md` (e `implementation_plan.md`) com diagramas Mermaid.
     - Aguarda aprovação explícita do usuário no Gate Humano 1 & 2.
     - **Provisionamento Obrigatório de Git Worktree (Isolamento Físico de Features)**:
       Antes de invocar o `feature-orchestrator`, o Chat Canvas DEVE obrigatoriamente:
       1. Provisionar a worktree isolada: `git worktree add .worktrees/<slug> -b feat/<slug>`
       2. Copiar variáveis de ambiente locais ignoradas pelo Git: `[ -f .env.local ] && cp .env.local .worktrees/<slug>/.env.local`
       3. Garantir que `.worktrees/` conste no `.gitignore`.
       4. Invocar o `feature-orchestrator` passando o diretório da worktree (`Cwd: .worktrees/<slug>`) como raiz de execução para que a branch `main` permaneça 100% intocada até a homologação final.
     - **Gate Obrigatório de Commit na Worktree (Prevenção de Perda de Código)**:
       - O `feature-orchestrator` DEVE executar `git add -A && git commit` dentro de `.worktrees/<slug>` antes de encerrar e reportar o hash do commit criado.
       - Antes de executar `git merge` ou `git worktree remove`, o Chat Canvas DEVE validar que `git -C .worktrees/<slug> status --porcelain` está vazio e que `git rev-list --count main..feat/<slug>` é maior que `0`. É TERMINANTEMENTE PROIBIDO rodar `git worktree remove --force` sem antes confirmar que todos os arquivos estão commitados e mergeados na `main`.
     - **Checklist Obrigatório Pós-Merge na Branch `main`**:
       Sempre que a worktree contiver novas migrações SQL (`drizzle/*.sql`), após realizar o merge na branch `main`, o Chat Canvas DEVE rodar obrigatoriamente `pnpm db:migrate` na raiz do workspace antes de disparar o pipeline de verificação global de fechamento (`./.agents/scripts/verify.sh`).
     - Invoca o subagente `feature-orchestrator` (`Role: "Feature Factory Orchestrator"`) com o plano aprovado.
     - Apresenta o resultado final no Gate 3 e dispara o fechamento `/learn`.
   - **Nível 2 — Subagente Orquestrador (`feature-orchestrator`)**:
     - Opera com carregamento cirúrgico de skills sob demanda (Just-in-Time), sem poluição de contexto.
     - Comanda a esteira técnica e gerencia os blocos de execução paralela respeitando a ordem de dependência (`Blocked by:`) dos macro-tickets.
     - Conduz o loop de auto-correção iterativo caso haja quebras de teste ou code smells.
     - Reporta o resultado consolidado ao Chat Canvas.

2. **Fim do Over-Slicing: Macro-Streams Paralelas (Máximo 2 a 3 Tickets)**:
   - **Proibição de Micro-Tickets Fracionados**: É TERMINANTEMENTE PROIBIDO fatiar funcionalidades em 4, 5 ou mais micro-tickets sequenciais que gerem ondas lentas de subagentes. Cada subagente tem um custo de inicialização de ~2 minutos.
   - **Padrão de 2 Macro-Streams**:
     - **Stream 1 (Backend & Data)**: Drizzle Schemas + Migrações SQL + Schemas Zod isomórficos + Services/Prompts + Testes unitários de backend.
     - **Stream 2 (Frontend & UX)**: Catálogo/DTOs + Hook de Estado + Componentes Visuais + Rota + Testes de integração/UI.
   - Como os contratos de dados e Zod estão congelados no Plano Técnico, **Stream 1 e Stream 2 DEVEM rodar em paralelo** ou em no máximo duas ondas.

3. **Dieta de Contexto nos Builders (Zero Releitura Redundante)**:
   - O `AGENTS.md` **já é injetado automaticamente pelo Antigravity nas regras `<user_rules>` de todos os subagentes**.
   - É PROIBIDO que `backend-builder` ou `frontend-builder` gastem tool calls chamando `view_file` em `AGENTS.md`, `PRD.md`, `GLOSSARY.md` ou `docs/specs/<slug>.md`.
   - Os builders devem abrir **exclusivamente o seu Ticket ativo** (`docs/tickets/<slug>/<NN>-<ticket>.md`) e os contratos específicos em `docs/plans/<slug>.md`, indo direto aos arquivos de código e teste.

4. **TDD Cirúrgico nos Builders vs. Pipeline Completo no Test-Verifier**:
   - **Nos Builders (`backend-builder` / `frontend-builder`)**:
     - O ciclo TDD deve executar **apenas o arquivo de teste unitário específico** em alteração: `pnpm vitest run <caminho/do/teste.test.ts>` (execução ultrarrápida de 1 a 2 segundos) + `pnpm typecheck` + `./.agents/scripts/verify.sh --shadcn` (para frontend).
     - É TERMINANTEMENTE PROIBIDO rodar `pnpm test` global (todos os 40+ arquivos) ou `pnpm build` dentro dos builders.
     - **Isolamento em Testes de Banco Compartilhado (PostgreSQL)**: Como a suíte global do Vitest roda arquivos em paralelo na mesma instância PostgreSQL, é PROIBIDO executar `await db.delete(tabela)` sem cláusula `WHERE` em `beforeEach`/`afterEach`. Sempre isole dados de teste com identificadores únicos (`crypto.randomUUID()`) e remova apenas os registros criados pelo próprio teste.
   - **Migração de Banco na Worktree Obrigatória**:
     - Sempre que `src/server/db/schema/` for alterado, o `backend-builder` DEVE rodar obrigatoriamente `pnpm db:generate && pnpm db:migrate` dentro da worktree para gerar o arquivo SQL em `drizzle/` e aplicá-lo ao banco, garantindo que o commit contenha a migração limpa.
   - **No `test-verifier` (Fase 4)**:
     - O `test-verifier` é o único agente autorizado a rodar o pipeline oficial completo `./.agents/scripts/verify.sh` (todos os testes + typecheck + lint + build de produção Nitro) e o **Dual Browser Audit** (Mobile 390×844 e Desktop 1440×900).

5. **Paralelismo Duplo Inteligente (Construção e Validação)**:
   - **Bloco 1 — Construção Concorrente**: Devido ao desacoplamento arquitetural entre camadas, `backend-builder` e `frontend-builder` **PODEM e DEVEM ser despachados em paralelo** dentro de uma única chamada de `invoke_subagent` sempre que atuarem em diretórios desacoplados.
   - **Bloco 2 — Validação & Auditoria Concorrentes**: Concluída a construção, `test-verifier` e `implementation-validator` **são despachados simultaneamente** em uma única chamada de `invoke_subagent`.

6. **Identificadores Canônicos (`TypeName`)**:
   - `codebase-researcher` para mapeamento rápido do grafo (`graphify`) (`model: flash`).
   - `product-manager` para descoberta de regras de negócio, casos de borda e UX (`model: inherit`).
   - `solution-architect` para arquitetura (*Deep Modules*), segurança e planos técnicos (`model: inherit`).
   - `backend-builder` para construção backend guiada por TDD cirúrgico (`model: flash`).
   - `frontend-builder` para construção frontend mobile-first (`model: flash`).
   - `test-verifier` para pipeline oficial completo e Dual Browser Audit (`model: flash`).
   - `implementation-validator` para auditoria independente de diff contra spec/SOLID/anti-bloat (`model: flash`).
   - **NUNCA use `TypeName: "self"`** a partir do orquestrador.

7. **Proibição Estrita de Polling Ativo e Espionagem de Subagentes (`Zero-Polling & Anti-Spy Invariant`)**:
   - **Zero-Polling**: Proibido `schedule` ou `manage_subagents(Action="list")` em loop. Confie no wakeup reativo.
   - **Zero-Spying**: Proibido rodar `tail`, `grep`, `cat` em logs de transcripts `.system_generated/logs/transcript.jsonl`.
   - **WaitMsBeforeAsync Adequado**: Em comandos de teste/build, utilize `WaitMsBeforeAsync: 10000` para evitar logs truncados em background.

8. **Padrão Mandatório do Relatório de Auditoria Operacional do Agente**:
   - Execute `./.agents/scripts/audit_agent_execution.py <conversation_id>` para telemetria de tokens, tempo ativo real (sem pausas ociosas) e raio-x de subagentes.